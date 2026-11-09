/**
 * Lectura de los webhooks de Kapso (formato propio, payload v2).
 * Con "debounce" activo llegan siempre en lote: { batch: true, data: [...] }.
 */

export interface WhatsAppInbound {
  readonly kind: "inbound";
  /** wamid de Meta. */
  readonly id: string;
  readonly phone: string;
  readonly contactName: string | null;
  /** Texto para el modelo (transcripción, pie de foto o una descripción si no hay texto). */
  readonly text: string;
}

/** Mensaje que escribió un asesor desde la app WhatsApp Business (modo dual). */
export interface WhatsAppAgentEcho {
  readonly kind: "agent_echo";
  readonly id: string;
  readonly phone: string;
  readonly text: string;
}

export type WhatsAppEvent = WhatsAppInbound | WhatsAppAgentEcho;

interface KapsoMessage {
  id?: string;
  type?: string;
  from?: string;
  to?: string;
  text?: { body?: string };
  image?: { caption?: string };
  video?: { caption?: string };
  document?: { caption?: string; filename?: string };
  button?: { text?: string };
  interactive?: { button_reply?: { title?: string }; list_reply?: { title?: string } };
  kapso?: {
    direction?: string;
    origin?: string;
    content?: string;
    transcript?: { text?: string };
  };
}

interface KapsoItem {
  message?: KapsoMessage;
  conversation?: { phone_number?: string; contact_name?: string };
  phone_number_id?: string;
}

const TYPE_NAMES: Record<string, string> = {
  audio: "una nota de voz",
  image: "una imagen",
  video: "un video",
  document: "un documento",
  sticker: "un sticker",
  location: "una ubicación",
  contacts: "un contacto",
};

const digits = (value: string | undefined) => (value ?? "").replace(/\D/g, "");

function messageText(message: KapsoMessage): string {
  const type = message.type ?? "desconocido";
  const transcript = message.kapso?.transcript?.text?.trim();
  if (type === "text") return message.text?.body?.trim() || message.kapso?.content?.trim() || "";
  if (type === "audio" && transcript) return `(Nota de voz) ${transcript}`;
  if (type === "button") return message.button?.text?.trim() ?? "";
  if (type === "interactive") {
    return (
      message.interactive?.button_reply?.title?.trim() ??
      message.interactive?.list_reply?.title?.trim() ??
      ""
    );
  }
  const caption = (message.image ?? message.video ?? message.document)?.caption?.trim();
  const described = `[El cliente envió ${TYPE_NAMES[type] ?? `un mensaje de tipo ${type}`}]`;
  return caption ? `${described} ${caption}` : described;
}

function toEvent(item: KapsoItem, eventType: string | null): WhatsAppEvent | null {
  const message = item.message;
  if (!message?.id) return null;
  const origin = message.kapso?.origin;
  const outbound = message.kapso?.direction === "outbound" || eventType === "whatsapp.message.sent";

  if (outbound) {
    // Solo interesan los mensajes del asesor; los del bot (cloud_api) ya están guardados.
    if (origin !== "business_app") return null;
    const phone = digits(item.conversation?.phone_number ?? message.to);
    const text = message.kapso?.content?.trim() || message.text?.body?.trim() || `[${message.type}]`;
    return phone ? { kind: "agent_echo", id: message.id, phone, text } : null;
  }

  if (origin === "history_sync") return null;
  const phone = digits(item.conversation?.phone_number ?? message.from);
  const text = messageText(message);
  if (!phone || !text) return null;
  return {
    kind: "inbound",
    id: message.id,
    phone,
    contactName: item.conversation?.contact_name?.trim() || null,
    text,
  };
}

/** Devuelve los eventos útiles del webhook, ignorando los de otros números de la cuenta. */
export function parseKapsoWebhook(
  payload: unknown,
  eventType: string | null,
  phoneNumberId?: string,
): WhatsAppEvent[] {
  if (!payload || typeof payload !== "object") return [];
  const body = payload as { batch?: boolean; data?: KapsoItem[]; type?: string };
  const type = eventType ?? body.type ?? null;
  const items: KapsoItem[] = body.batch && Array.isArray(body.data) ? body.data : [payload as KapsoItem];
  return items
    .filter((item) => !phoneNumberId || !item.phone_number_id || item.phone_number_id === phoneNumberId)
    .map((item) => toEvent(item, type))
    .filter((event): event is WhatsAppEvent => event !== null);
}
