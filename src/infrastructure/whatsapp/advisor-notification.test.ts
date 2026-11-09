import { describe, expect, it } from "vitest";
import { buildAdvisorEmail } from "./advisor-notification";

describe("correo al asesor", () => {
  it("incluye motivo, cliente, enlace al chat y pedido, escapando HTML", () => {
    const { subject, html } = buildAdvisorEmail({
      phone: "593962247520",
      contactName: "Ana <script>",
      handoff: { reason: "pedido", orderSummary: "1. Duplex x 2", notes: "Entrega en Azogues" },
      recentMessages: [
        { id: 1, role: "user", content: "Quiero dúplex", createdAt: new Date() },
        { id: 2, role: "assistant", content: "Listo", createdAt: new Date() },
      ],
    });
    expect(subject).toBe("WhatsApp: Pedido confirmado · Ana <script> (+593 96 224 7520)");
    expect(html).toContain('href="https://wa.me/593962247520"');
    expect(html).toContain("1. Duplex x 2");
    expect(html).toContain("Entrega en Azogues");
    expect(html).toContain("Ana &lt;script&gt;");
    expect(html).not.toContain("<script>");
    expect(html).toContain("<b>Cliente:</b> Quiero dúplex");
  });
});
