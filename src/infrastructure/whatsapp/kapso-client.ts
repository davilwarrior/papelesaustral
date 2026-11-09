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

/** WhatsApp limita el cuerpo de un mensaje con botones a 1024 caracteres. */
const MAX_INTERACTIVE_BODY = 1024;

/** Envía un texto con botones de respuesta rápida (máximo 3, de 20 caracteres). */
export async function sendWhatsAppButtons(
  to: string,
  text: string,
  titles: readonly string[],
): Promise<string | null> {
  const unique = [...new Set(titles.map((t) => t.trim().slice(0, 20)).filter(Boolean))].slice(0, 3);
  if (unique.length === 0) return sendWhatsAppText(to, text);

  let body = text;
  if (text.length > MAX_INTERACTIVE_BODY) {
    await sendWhatsAppText(to, text);
    body = "Elige una opción:";
  }
  const result = await postMessage({
    recipient_type: "individual",
    to,
    type: "interactive",
    interactive: {
      type: "button",
      body: { text: body },
      action: {
        buttons: unique.map((title, i) => ({ type: "reply", reply: { id: `opcion_${i + 1}`, title } })),
      },
    },
  });
  return result.messages?.[0]?.id ?? null;
}

/** Envía un archivo público por enlace (WhatsApp lo descarga de la URL). */
export async function sendWhatsAppDocument(
  to: string,
  document: { link: string; filename: string; caption?: string },
): Promise<string | null> {
  const result = await postMessage({ recipient_type: "individual", to, type: "document", document });
  return result.messages?.[0]?.id ?? null;
}

/** Límite para transcribir: una nota de voz de varios minutos pesa bastante menos. */
const MAX_MEDIA_BYTES = 10 * 1024 * 1024;

/** Descarga un archivo recibido (nota de voz, imagen) a partir de su id de Meta. */
export async function downloadWhatsAppMedia(
  mediaId: string,
): Promise<{ data: Uint8Array; mimeType: string }> {
  const { apiKey, phoneNumberId } = config();
  const infoResponse = await fetch(
    `${BASE_URL}/${encodeURIComponent(mediaId)}?phone_number_id=${encodeURIComponent(phoneNumberId)}`,
    { headers: { "X-API-Key": apiKey } },
  );
  if (!infoResponse.ok) throw new Error(`Kapso respondió ${infoResponse.status} al pedir el archivo`);
  const info = (await infoResponse.json()) as {
    download_url?: string;
    mime_type?: string;
    file_size?: string;
  };
  if (!info.download_url) throw new Error("Kapso no devolvió download_url");
  if (Number(info.file_size) > MAX_MEDIA_BYTES) throw new Error(`Archivo muy grande: ${info.file_size} bytes`);

  // El enlace trae la autenticación en el token y vence en 4 minutos.
  const file = await fetch(info.download_url);
  if (!file.ok) throw new Error(`Descarga del archivo falló: ${file.status}`);
  return {
    data: new Uint8Array(await file.arrayBuffer()),
    mimeType: info.mime_type ?? file.headers.get("content-type") ?? "application/octet-stream",
  };
}

/** Marca el mensaje como leído y muestra "escribiendo…" (dura hasta responder o ~25 s). */
export async function markReadAndShowTyping(messageId: string): Promise<void> {
  await postMessage({
    status: "read",
    message_id: messageId,
    typing_indicator: { type: "text" },
  });
}
