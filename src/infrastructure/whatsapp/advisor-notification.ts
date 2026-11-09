import type { WhatsAppHandoff } from "@/application/chat/assistant-tools";
import type { WhatsAppStoredMessage } from "@/domain/repositories/whatsapp-conversation-repository";

export interface AdvisorNotice {
  readonly phone: string;
  readonly contactName: string | null;
  readonly handoff: WhatsAppHandoff;
  readonly recentMessages: readonly WhatsAppStoredMessage[];
}

const REASONS: Record<WhatsAppHandoff["reason"], string> = {
  pedido: "Pedido confirmado",
  consulta: "Consulta que el bot no puede resolver",
  solicitud_cliente: "El cliente pidió hablar con un asesor",
};

const ROLES = { user: "Cliente", assistant: "Bot", agent: "Asesor" } as const;

const escapeHtml = (text: string) =>
  text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** Número legible: 593962247520 → +593 96 224 7520. */
function formatPhone(phone: string): string {
  const match = phone.match(/^593(\d{2})(\d{3})(\d{4})$/);
  return match ? `+593 ${match[1]} ${match[2]} ${match[3]}` : `+${phone}`;
}

export function buildAdvisorEmail({ phone, contactName, handoff, recentMessages }: AdvisorNotice) {
  const who = contactName ? `${contactName} (${formatPhone(phone)})` : formatPhone(phone);
  const subject = `WhatsApp: ${REASONS[handoff.reason]} · ${who}`;
  const chat = recentMessages
    .map((m) => `<p><b>${ROLES[m.role]}:</b> ${escapeHtml(m.content).replace(/\n/g, "<br>")}</p>`)
    .join("");
  const html = `
<p><b>${escapeHtml(REASONS[handoff.reason])}</b> — el bot ya no responde en este chat; continúa tú desde WhatsApp Business.</p>
<p>Cliente: ${escapeHtml(who)}<br>
<a href="https://wa.me/${phone}">Abrir el chat en WhatsApp</a></p>
${handoff.notes ? `<p><b>Qué necesita:</b> ${escapeHtml(handoff.notes)}</p>` : ""}
${handoff.orderSummary ? `<pre style="font-family:inherit;background:#f4f4f0;padding:12px;border-radius:8px">${escapeHtml(handoff.orderSummary)}</pre>` : ""}
<hr><p style="color:#666">Últimos mensajes:</p>${chat}`;
  return { subject, html };
}

/**
 * Avisa por correo (Resend) que un cliente de WhatsApp necesita a un asesor.
 * Si faltan las variables, solo lo registra en los logs.
 */
export async function notifyAdvisor(notice: AdvisorNotice): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const to = process.env.ADVISOR_EMAIL_TO?.trim();
  const from = process.env.ADVISOR_EMAIL_FROM?.trim() || "Asistente Papeles Austral <onboarding@resend.dev>";
  if (!apiKey || !to) {
    console.info("[whatsapp] Aviso al asesor no enviado: faltan RESEND_API_KEY o ADVISOR_EMAIL_TO");
    return;
  }

  const { subject, html } = buildAdvisorEmail(notice);
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from, to: to.split(",").map((t) => t.trim()), subject, html }),
  });
  if (!response.ok) {
    throw new Error(`Resend respondió ${response.status}: ${(await response.text()).slice(0, 300)}`);
  }
}
