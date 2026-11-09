import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Webhook de WhatsApp (Kapso, tipo "Meta webhooks": reenvía los eventos de Meta tal cual).
 * Por ahora solo valida la firma y registra el tipo de evento; el asistente se conecta después.
 */

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

interface MetaWebhookPayload {
  object?: string;
  entry?: { changes?: { field?: string; value?: Record<string, unknown> }[] }[];
}

/** Resumen sin contenido de mensajes ni números de clientes (datos personales). */
function summarize(payload: MetaWebhookPayload) {
  return (payload.entry ?? []).flatMap((entry) =>
    (entry.changes ?? []).map(({ field, value }) => ({
      field,
      messages: Array.isArray(value?.messages) ? value.messages.length : 0,
      statuses: Array.isArray(value?.statuses) ? value.statuses.length : 0,
      echoes: Array.isArray(value?.message_echoes) ? value.message_echoes.length : 0,
      types: Array.isArray(value?.messages)
        ? (value.messages as { type?: string }[]).map((m) => m.type)
        : undefined,
    })),
  );
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

  let payload: MetaWebhookPayload;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return Response.json({ ok: false }, { status: 400 });
  }

  console.info("[whatsapp] Evento recibido", {
    event: request.headers.get("x-webhook-event"),
    object: payload.object,
    changes: summarize(payload),
  });

  return Response.json({ ok: true });
}
