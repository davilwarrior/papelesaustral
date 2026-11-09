import { timingSafeEqual } from "node:crypto";
import { whatsappConversationRepository } from "@/infrastructure/container";

/**
 * Borra las conversaciones de WhatsApp sin actividad en 90 días (Ley Orgánica de
 * Protección de Datos Personales: no guardar datos más tiempo del necesario).
 * Lo llama el Cron de Vercel una vez al día con "Authorization: Bearer <CRON_SECRET>".
 */
const RETENTION_DAYS = Number(process.env.WHATSAPP_RETENTION_DAYS) || 90;

function isAuthorized(request: Request): boolean {
  const secret = (process.env.CRON_SECRET ?? "").trim();
  const token = (request.headers.get("authorization") ?? "").replace(/^\s*Bearer\s+/i, "").trim();
  const a = Buffer.from(token);
  const b = Buffer.from(secret);
  return secret !== "" && a.length === b.length && timingSafeEqual(a, b);
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) return Response.json({ ok: false }, { status: 401 });
  const cutoff = new Date(Date.now() - RETENTION_DAYS * 86_400_000);
  const deleted = await whatsappConversationRepository.deleteInactiveSince(cutoff);
  console.info(`[whatsapp] Limpieza: ${deleted} conversaciones sin actividad desde ${cutoff.toISOString()}`);
  return Response.json({ ok: true, deleted });
}
