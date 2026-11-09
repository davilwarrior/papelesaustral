import { openai, type OpenAILanguageModelResponsesOptions } from "@ai-sdk/openai";
import { generateText, isStepCount, type ModelMessage } from "ai";
import { buildAssistantInstructions } from "@/application/chat/assistant-instructions";
import {
  createWhatsAppTools,
  sanitizeCart,
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
import { markReadAndShowTyping, sendWhatsAppText } from "./kapso-client";
import type { WhatsAppAgentEcho, WhatsAppEvent, WhatsAppInbound } from "./kapso-webhook";

const MODEL = process.env.OPENAI_CHAT_MODEL || "gpt-5.4-mini";
/** Mensajes de historial que se envían al modelo. */
const HISTORY_LIMIT = 24;
/** Freno contra abusos: por encima de esto el bot deja de responder a ese número durante la hora. */
const MAX_USER_MESSAGES_PER_HOUR = 40;
const FALLBACK_REPLY =
  "Disculpa, no pude responder en este momento. Un asesor revisará tu mensaje y te escribirá pronto.";

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

/** Procesa los eventos de un webhook: cada número en paralelo, sin que un error afecte a otro. */
export async function handleWhatsAppEvents(events: readonly WhatsAppEvent[]): Promise<void> {
  const byPhone = new Map<string, WhatsAppEvent[]>();
  for (const event of events) byPhone.set(event.phone, [...(byPhone.get(event.phone) ?? []), event]);

  await Promise.all(
    [...byPhone].map(([phone, phoneEvents]) =>
      handleConversation(phone, phoneEvents).catch((error) =>
        console.error(`[whatsapp] Error con ${maskPhone(phone)}`, error),
      ),
    ),
  );
}

async function handleConversation(phone: string, events: readonly WhatsAppEvent[]) {
  const inbound = events.filter((e): e is WhatsAppInbound => e.kind === "inbound");
  const echoes = events.filter((e): e is WhatsAppAgentEcho => e.kind === "agent_echo");
  const contactName = inbound.find((e) => e.contactName)?.contactName ?? null;
  const conversation = await conversations.getOrCreate(phone, contactName);
  const now = new Date();
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
    if (id !== null) {
      lastSavedId = id;
      lastMessageId = message.id;
    }
  }
  if (lastSavedId === null || lastMessageId === null) return;

  if (pausedUntil && pausedUntil > now) return;
  const lastHour = await conversations.countUserMessagesSince(phone, addHours(now, -1));
  if (lastHour > MAX_USER_MESSAGES_PER_HOUR) {
    console.warn(`[whatsapp] Límite de mensajes alcanzado por ${maskPhone(phone)}`);
    return;
  }

  markReadAndShowTyping(lastMessageId).catch((error) =>
    console.warn("[whatsapp] No se pudo marcar como leído", error),
  );

  let reply: GeneratedReply;
  try {
    reply = await generateReply(conversation);
  } catch (error) {
    console.error("[whatsapp] Error al generar la respuesta", error);
    reply = { text: FALLBACK_REPLY, cart: conversation.cart, handoff: null };
  }

  // Si el cliente escribió otra vez mientras se generaba, responde el proceso de ese mensaje.
  if ((await conversations.lastUserMessageId(phone)) !== lastSavedId) return;

  const outgoing = [reply.handoff?.orderSummary, reply.text].filter((t): t is string => !!t);
  for (const text of outgoing) {
    const waMessageId = await sendWhatsAppText(phone, text);
    await conversations.saveMessage(phone, { waMessageId, role: "assistant", content: text });
  }

  await conversations.update(phone, {
    cart: reply.cart,
    ...(reply.handoff
      ? { botPausedUntil: addHours(new Date(), HANDOFF_PAUSE_HOURS), lastHandoffAt: new Date() }
      : {}),
  });
  if (reply.handoff) {
    console.info(`[whatsapp] Conversación pasada a asesor (${reply.handoff.reason})`, maskPhone(phone));
  }
}

interface GeneratedReply {
  readonly text: string;
  readonly cart: Readonly<Record<string, number>>;
  readonly handoff: WhatsAppHandoff | null;
}

async function generateReply(conversation: WhatsAppConversation): Promise<GeneratedReply> {
  const [site, catalog, categories, history] = await Promise.all([
    getSiteConfig(siteConfigRepository),
    loadCachedCatalog(),
    getCategories(catalogRepository),
    conversations.recentMessages(conversation.phone, HISTORY_LIMIT),
  ]);

  const cart = sanitizeCart(conversation.cart, new Map(catalog.products.map((p) => [p.code, p])));
  let handoff = null as WhatsAppHandoff | null;
  const tools = createWhatsAppTools({ catalog, cart, onHandoff: (h) => (handoff = h) });

  const messages: ModelMessage[] = history.map((m) =>
    m.role === "user"
      ? { role: "user", content: m.content }
      : { role: "assistant", content: m.role === "agent" ? `[Mensaje del asesor] ${m.content}` : m.content },
  );

  const instructions =
    buildAssistantInstructions({ site, catalog, categories, cartItems: cart.size, channel: "whatsapp" }) +
    (conversation.contactName ? `\nNombre del perfil de WhatsApp del cliente: ${conversation.contactName}` : "");

  const result = await generateText({
    model: openai(MODEL),
    instructions,
    messages,
    tools,
    stopWhen: isStepCount(6),
    reasoning: "low",
    maxOutputTokens: 1200,
    providerOptions: {
      openai: { store: false, textVerbosity: "low" } satisfies OpenAILanguageModelResponsesOptions,
    },
  });

  return { text: result.text.trim(), cart: Object.fromEntries(cart), handoff };
}
