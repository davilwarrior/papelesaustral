import { openai, type OpenAILanguageModelResponsesOptions } from "@ai-sdk/openai";
import { generateText, isStepCount, type ModelMessage, transcribe } from "ai";
import { buildAssistantInstructions } from "@/application/chat/assistant-instructions";
import {
  createWhatsAppTools,
  sanitizeCart,
  type PriceListFormat,
  type WhatsAppHandoff,
} from "@/application/chat/assistant-tools";
import { getCategories } from "@/application/use-cases/get-categories";
import { getSiteConfig } from "@/application/use-cases/get-site-config";
import type { WhatsAppConversation } from "@/domain/repositories/whatsapp-conversation-repository";
import { loadCachedCatalog } from "../cached-catalog";
import {
  catalogRepository,
  siteConfigRepository,
  whatsappConversationRepository as conversations,
} from "../container";
import { PRICE_LIST_PATHS } from "../price-list";
import { notifyAdvisor } from "./advisor-notification";
import { describeBusinessHours } from "./business-hours";
import {
  downloadWhatsAppMedia,
  markReadAndShowTyping,
  sendWhatsAppButtons,
  sendWhatsAppDocument,
  sendWhatsAppText,
} from "./kapso-client";
import type { WhatsAppAgentEcho, WhatsAppEvent, WhatsAppInbound } from "./kapso-webhook";

const MODEL = process.env.OPENAI_CHAT_MODEL || "gpt-6-luna";
const TRANSCRIBE_MODEL = process.env.OPENAI_TRANSCRIBE_MODEL || "gpt-transcribe";
/** Vocabulario del negocio para que la transcripción acierte nombres de materiales. */
const TRANSCRIBE_PROMPT =
  "Cliente de Papeles Austral (Cuenca, Ecuador) pidiendo papel: dúplex, couché, bond, kraft, cartulina, " +
  "cartón gris, adhesivo, antigrasa, gramaje, pliegos, paquetes, medidas como 70x100 y 65x90. " +
  "Ciudades: Cuenca, Azogues, Cañar, Gualaceo, Paute, Loja, Machala.";
/** Origen público de la web para los archivos (con www: el dominio sin www redirige). */
const PUBLIC_ORIGIN = process.env.PUBLIC_SITE_ORIGIN || "https://www.papelesaustral.com";
/** Mensajes de historial que se envían al modelo. */
const HISTORY_LIMIT = 24;
/** Solo se usa el historial reciente: si el cliente vuelve días después, empieza una charla nueva. */
const HISTORY_HOURS = 24;
/** Freno contra abusos: por encima de esto el bot deja de responder a ese número durante la hora. */
const MAX_USER_MESSAGES_PER_HOUR = 40;
const FALLBACK_REPLY =
  "Disculpa, no pude responder en este momento. Un asesor revisará tu mensaje y te escribirá pronto.";
/** Se agrega a la primera respuesta del bot a cada número (Ley de Protección de Datos). */
export const PRIVACY_NOTICE =
  "_Te atiende el asistente virtual de Papeles Austral, con inteligencia artificial. Un asesor revisa cada pedido. " +
  "Usamos tus datos solo para atender tu consulta._";

function hoursFromEnv(name: string, fallback: number): number {
  const value = Number(process.env[name]);
  return process.env[name] !== undefined && Number.isFinite(value) && value >= 0 ? value : fallback;
}

/** Horas que el bot se calla en un chat después de que un asesor escribe desde la app. */
const AGENT_PAUSE_HOURS = hoursFromEnv("WHATSAPP_AGENT_PAUSE_HOURS", 4);
/** Horas que el bot se calla después de pasar la conversación a un asesor. */
const HANDOFF_PAUSE_HOURS = hoursFromEnv("WHATSAPP_HANDOFF_PAUSE_HOURS", 12);

const addHours = (date: Date, hours: number) => new Date(date.getTime() + hours * 3_600_000);
/** Número parcialmente oculto para los logs. */
const maskPhone = (phone: string) => `${phone.slice(0, 5)}…${phone.slice(-2)}`;

/** Canal de salida. En producción es Kapso; las simulaciones usan uno falso. */
export interface WhatsAppMessenger {
  markReadAndShowTyping(messageId: string): Promise<void>;
  sendText(to: string, text: string): Promise<string | null>;
  sendButtons(to: string, text: string, titles: readonly string[]): Promise<string | null>;
  sendDocument(to: string, document: { link: string; filename: string }): Promise<string | null>;
  downloadMedia(mediaId: string): Promise<{ data: Uint8Array; mimeType: string }>;
}

export const kapsoMessenger: WhatsAppMessenger = {
  markReadAndShowTyping,
  sendText: sendWhatsAppText,
  sendButtons: sendWhatsAppButtons,
  sendDocument: sendWhatsAppDocument,
  downloadMedia: downloadWhatsAppMedia,
};

export interface HandleOptions {
  readonly messenger?: WhatsAppMessenger;
  /** Hora actual; las simulaciones la cambian para probar el horario de atención. */
  readonly now?: Date;
  /** Aviso al asesor; por defecto, correo con Resend si está configurado. */
  readonly notify?: typeof notifyAdvisor;
}

/** Procesa los eventos de un webhook: cada número en paralelo, sin que un error afecte a otro. */
export async function handleWhatsAppEvents(
  events: readonly WhatsAppEvent[],
  options: HandleOptions = {},
): Promise<void> {
  const byPhone = new Map<string, WhatsAppEvent[]>();
  for (const event of events) byPhone.set(event.phone, [...(byPhone.get(event.phone) ?? []), event]);

  await Promise.all(
    [...byPhone].map(([phone, phoneEvents]) =>
      handleConversation(phone, phoneEvents, options).catch((error) =>
        console.error(`[whatsapp] Error con ${maskPhone(phone)}`, error),
      ),
    ),
  );
}

async function handleConversation(
  phone: string,
  events: readonly WhatsAppEvent[],
  { messenger = kapsoMessenger, now = new Date(), notify = notifyAdvisor }: HandleOptions,
) {
  const inbound = events.filter((e): e is WhatsAppInbound => e.kind === "inbound");
  const echoes = events.filter((e): e is WhatsAppAgentEcho => e.kind === "agent_echo");
  const contactName = inbound.find((e) => e.contactName)?.contactName ?? null;
  const conversation = await conversations.getOrCreate(phone, contactName);
  let pausedUntil = conversation.botPausedUntil;

  // Un asesor escribió desde la app: el bot se calla en este chat por un rato.
  for (const echo of echoes) {
    const saved = await conversations.saveMessage(phone, {
      waMessageId: echo.id,
      role: "agent",
      content: echo.text,
    });
    if (saved !== null) pausedUntil = addHours(now, AGENT_PAUSE_HOURS);
  }
  if (pausedUntil !== conversation.botPausedUntil) {
    await conversations.update(phone, { botPausedUntil: pausedUntil });
    console.info(`[whatsapp] Asesor activo con ${maskPhone(phone)}: bot en pausa`);
  }

  // Guardar primero evita responder dos veces si el webhook se reintenta.
  let lastSavedId: number | null = null;
  let lastMessageId: string | null = null;
  for (const message of inbound) {
    const id = await conversations.saveMessage(phone, {
      waMessageId: message.id,
      role: "user",
      content: message.text,
    });
    if (id === null) continue;
    // Se transcribe solo después de guardar, para no pagar dos veces si Kapso reintenta.
    if (message.audioId) {
      const transcript = await transcribeVoiceNote(messenger, message.audioId);
      if (transcript) await conversations.updateMessageContent(id, transcript);
    }
    lastSavedId = id;
    lastMessageId = message.id;
  }
  if (lastSavedId === null || lastMessageId === null) return;

  if (pausedUntil && pausedUntil > now) return;
  const lastHour = await conversations.countUserMessagesSince(phone, addHours(now, -1));
  if (lastHour > MAX_USER_MESSAGES_PER_HOUR) {
    console.warn(`[whatsapp] Límite de mensajes alcanzado por ${maskPhone(phone)}`);
    return;
  }

  messenger
    .markReadAndShowTyping(lastMessageId)
    .catch((error) => console.warn("[whatsapp] No se pudo marcar como leído", error));

  const firstReply = !(await conversations.hasBotReplied(phone));
  let reply: GeneratedReply;
  try {
    reply = await generateReply(conversation, now);
  } catch (error) {
    console.error("[whatsapp] Error al generar la respuesta", error);
    reply = { text: FALLBACK_REPLY, cart: conversation.cart, handoff: null, priceLists: [], buttons: [] };
  }

  // Si el cliente escribió otra vez mientras se generaba, responde el proceso de ese mensaje.
  if ((await conversations.lastUserMessageId(phone)) !== lastSavedId) return;

  const save = (waMessageId: string | null, content: string) =>
    conversations.saveMessage(phone, { waMessageId, role: "assistant", content });

  if (reply.handoff?.orderSummary) {
    await save(await messenger.sendText(phone, reply.handoff.orderSummary), reply.handoff.orderSummary);
  }
  if (reply.text) {
    const text = firstReply ? `${reply.text}\n\n${PRIVACY_NOTICE}` : reply.text;
    let buttons = reply.buttons;
    let waMessageId: string | null;
    try {
      waMessageId =
        buttons.length > 0 ? await messenger.sendButtons(phone, text, buttons) : await messenger.sendText(phone, text);
    } catch (error) {
      if (buttons.length === 0) throw error;
      // Si WhatsApp rechaza los botones, el cliente igual recibe la respuesta.
      console.warn("[whatsapp] No se pudieron enviar los botones; se envía solo el texto", error);
      buttons = [];
      waMessageId = await messenger.sendText(phone, text);
    }
    const buttonsNote = buttons.length > 0 ? `\n[Botones: ${buttons.join(" | ")}]` : "";
    await save(waMessageId, text + buttonsNote);
  }
  for (const format of reply.priceLists) {
    const filename = format === "pdf" ? "Lista de precios Papeles Austral.pdf" : "Lista de precios Papeles Austral.xlsx";
    const waMessageId = await messenger.sendDocument(phone, {
      link: `${PUBLIC_ORIGIN}${PRICE_LIST_PATHS[format]}`,
      filename,
    });
    await save(waMessageId, `[Archivo enviado: ${filename}]`);
  }

  await conversations.update(phone, {
    // El pedido ya quedó en el chat para el asesor: el próximo empieza vacío.
    cart: reply.handoff?.reason === "pedido" ? {} : reply.cart,
    ...(reply.handoff ? { botPausedUntil: addHours(now, HANDOFF_PAUSE_HOURS), lastHandoffAt: now } : {}),
  });

  if (reply.handoff) {
    console.info(`[whatsapp] Conversación pasada a asesor (${reply.handoff.reason})`, maskPhone(phone));
    const recent = await conversations.recentMessages(phone, 12, addHours(new Date(), -HISTORY_HOURS));
    await notify({
      phone,
      contactName: conversation.contactName,
      handoff: reply.handoff,
      recentMessages: recent,
    }).catch((error) => console.error("[whatsapp] No se pudo avisar al asesor", error));
  }
}

interface GeneratedReply {
  readonly text: string;
  readonly cart: Readonly<Record<string, number>>;
  readonly handoff: WhatsAppHandoff | null;
  readonly priceLists: readonly PriceListFormat[];
  readonly buttons: readonly string[];
}

/** Transcribe una nota de voz; si falla devuelve null y el modelo ve el aviso de que llegó un audio. */
async function transcribeVoiceNote(messenger: WhatsAppMessenger, audioId: string): Promise<string | null> {
  try {
    const { data } = await messenger.downloadMedia(audioId);
    const result = await transcribe({
      model: openai.transcription(TRANSCRIBE_MODEL),
      audio: data,
      // gpt-transcribe solo acepta "json" o "text" (el SDK pide "verbose_json" por defecto).
      providerOptions: { openai: { language: "es", responseFormat: "json", prompt: TRANSCRIBE_PROMPT } },
    });
    const text = result.text.trim();
    return text ? `(Nota de voz) ${text}` : null;
  } catch (error) {
    console.warn("[whatsapp] No se pudo transcribir la nota de voz", error);
    return null;
  }
}

async function generateReply(conversation: WhatsAppConversation, now: Date): Promise<GeneratedReply> {
  const [site, catalog, categories, history] = await Promise.all([
    getSiteConfig(siteConfigRepository),
    loadCachedCatalog(),
    getCategories(catalogRepository),
    // Reloj real (no `now`): las fechas de los mensajes las pone la base de datos.
    conversations.recentMessages(conversation.phone, HISTORY_LIMIT, addHours(new Date(), -HISTORY_HOURS)),
  ]);

  const cart = sanitizeCart(conversation.cart, new Map(catalog.products.map((p) => [p.code, p])));
  let handoff = null as WhatsAppHandoff | null;
  const priceLists = new Set<PriceListFormat>();
  let buttons: readonly string[] = [];
  const tools = createWhatsAppTools({
    catalog,
    cart,
    onHandoff: (h) => (handoff = h),
    onPriceList: (format) => priceLists.add(format),
    onButtons: (titles) => (buttons = titles),
  });

  const messages: ModelMessage[] = history.map((m) =>
    m.role === "user"
      ? { role: "user", content: m.content }
      : { role: "assistant", content: m.role === "agent" ? `[Mensaje del asesor] ${m.content}` : m.content },
  );

  const instructions =
    buildAssistantInstructions({ site, catalog, categories, cartItems: cart.size, channel: "whatsapp" }) +
    `\n${describeBusinessHours(now)}` +
    (conversation.contactName ? `\nNombre del perfil de WhatsApp del cliente: ${conversation.contactName}` : "");

  const settings = {
    model: openai(MODEL),
    instructions,
    reasoning: "low",
    maxOutputTokens: 1200,
    providerOptions: {
      openai: { store: false, textVerbosity: "low" } satisfies OpenAILanguageModelResponsesOptions,
    },
  } as const;
  const result = await generateText({ ...settings, messages, tools, stopWhen: isStepCount(6) });
  // El modelo a veces escribe la respuesta junto con mostrar_botones y el último paso queda vacío:
  // se usa el último texto que haya escrito en cualquier paso.
  let text = result.steps.map((step) => step.text.trim()).filter(Boolean).at(-1) ?? "";

  // Si no escribió nada en ningún paso, se le pide solo el texto final.
  if (!text) {
    const followUp = await generateText({
      ...settings,
      messages: [...messages, ...result.response.messages],
      tools,
      toolChoice: "none",
    });
    text = followUp.text.trim();
  }

  return {
    text,
    cart: Object.fromEntries(cart),
    handoff,
    priceLists: [...priceLists],
    // Sin botones al pasar a un asesor: la conversación ya no sigue con el bot.
    buttons: handoff ? [] : buttons,
  };
}
