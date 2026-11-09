import { createHmac, timingSafeEqual } from "node:crypto";
import { after } from "next/server";
import { parseKapsoWebhook } from "@/infrastructure/whatsapp/kapso-webhook";
import { handleWhatsAppEvents } from "@/infrastructure/whatsapp/whatsapp-assistant";

/**
 * Webhook de WhatsApp (Kapso, formato propio con mensajes agrupados).
 * Responde 200 enseguida (Kapso espera máximo 10 s) y genera la respuesta del bot después, con after().
 */
export const maxDuration = 60;

/** Quita espacios y comillas que se cuelan al copiar el valor desde el .env. */
function cleanSecret(value: string | null | undefined): string {
  return (value ?? "").trim().replace(/^(["'])(.*)\1$/, "$2").trim();
}

/** Kapso firma el cuerpo crudo con HMAC-SHA256 (hex, sin prefijo "sha256="). */
function hasValidSignature(rawBody: string, signature: string | null, secret: string): boolean {
  const received = (signature ?? "").trim().replace(/^sha256=/i, "").toLowerCase();
  const expected = createHmac("sha256", secret).update(rawBody, "utf8").digest("hex");
  const a = Buffer.from(received);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

/** Verificación de Meta al registrar el webhook (por si se conecta sin intermediario). */
export function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const verifyToken = cleanSecret(process.env.WHATSAPP_WEBHOOK_SECRET);
  if (
    params.get("hub.mode") === "subscribe" &&
    verifyToken !== "" &&
    params.get("hub.verify_token") === verifyToken
  ) {
    return new Response(params.get("hub.challenge") ?? "", { status: 200 });
  }
  return new Response("OK", { status: 200 });
}

export async function POST(request: Request) {
  const secret = cleanSecret(process.env.WHATSAPP_WEBHOOK_SECRET);
  if (!secret) {
    console.error("[whatsapp] Falta WHATSAPP_WEBHOOK_SECRET");
    return Response.json({ ok: false }, { status: 503 });
  }

  const rawBody = await request.text();
  const signature =
    request.headers.get("x-webhook-signature") ?? request.headers.get("x-hub-signature-256");
  if (!hasValidSignature(rawBody, signature, secret)) {
    console.warn("[whatsapp] 401: firma inválida", {
      hasSignature: signature !== null,
      headers: [...request.headers.keys()].filter((k) => k.startsWith("x-")),
    });
    return Response.json({ ok: false }, { status: 401 });
  }

  let payload: unknown;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return Response.json({ ok: false }, { status: 400 });
  }

  const eventType = request.headers.get("x-webhook-event");
  const events = parseKapsoWebhook(payload, eventType, process.env.WHATSAPP_PHONE_NUMBER_ID?.trim());
  // Sin texto de mensajes ni números en los logs (datos personales).
  console.info("[whatsapp] Evento recibido", {
    event: eventType,
    inbound: events.filter((e) => e.kind === "inbound").length,
    agentEchoes: events.filter((e) => e.kind === "agent_echo").length,
  });

  if (events.length > 0) after(() => handleWhatsAppEvents(events));
  return Response.json({ ok: true });
}
