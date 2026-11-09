/**
 * Envío de mensajes por la API de Kapso, compatible con la Cloud API de Meta:
 * mismo cuerpo, solo cambian la URL base y la cabecera de autenticación.
 */
const BASE_URL = "https://api.kapso.ai/meta/whatsapp/v24.0";
/** WhatsApp admite 4096 caracteres por mensaje de texto. */
const MAX_TEXT_LENGTH = 4000;

function config() {
  const apiKey = process.env.KAPSO_API_KEY?.trim();
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID?.trim();
  if (!apiKey || !phoneNumberId) {
    throw new Error("Faltan KAPSO_API_KEY o WHATSAPP_PHONE_NUMBER_ID");
  }
  return { apiKey, phoneNumberId };
}

async function postMessage(body: Record<string, unknown>): Promise<{ messages?: { id: string }[] }> {
  const { apiKey, phoneNumberId } = config();
  const response = await fetch(`${BASE_URL}/${phoneNumberId}/messages`, {
    method: "POST",
    headers: { "X-API-Key": apiKey, "Content-Type": "application/json" },
    body: JSON.stringify({ messaging_product: "whatsapp", ...body }),
  });
  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`Kapso respondió ${response.status}: ${detail.slice(0, 500)}`);
  }
  return response.json().catch(() => ({}));
}

/** Parte un texto largo por párrafos para no pasar el límite de WhatsApp. */
function splitText(text: string): string[] {
  if (text.length <= MAX_TEXT_LENGTH) return [text];
  const parts: string[] = [];
  let current = "";
  for (const paragraph of text.split("\n")) {
    if (current && current.length + paragraph.length + 1 > MAX_TEXT_LENGTH) {
      parts.push(current);
      current = "";
    }
    current = current ? `${current}\n${paragraph}` : paragraph.slice(0, MAX_TEXT_LENGTH);
  }
  if (current) parts.push(current);
  return parts;
}

/** Envía un texto y devuelve el wamid del último mensaje enviado. */
export async function sendWhatsAppText(to: string, text: string): Promise<string | null> {
  let lastId: string | null = null;
  for (const part of splitText(text)) {
    const result = await postMessage({
      recipient_type: "individual",
      to,
      type: "text",
      text: { body: part, preview_url: true },
    });
    lastId = result.messages?.[0]?.id ?? lastId;
  }
  return lastId;
}

/** Marca el mensaje como leído y muestra "escribiendo…" (dura hasta responder o ~25 s). */
export async function markReadAndShowTyping(messageId: string): Promise<void> {
  await postMessage({
    status: "read",
    message_id: messageId,
    typing_indicator: { type: "text" },
  });
}
