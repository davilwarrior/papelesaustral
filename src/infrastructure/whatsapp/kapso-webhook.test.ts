import { describe, expect, it } from "vitest";
import { parseKapsoWebhook } from "./kapso-webhook";

const inbound = (id: string, message: Record<string, unknown>, extra: Record<string, unknown> = {}) => ({
  message: { id, kapso: { direction: "inbound", origin: "cloud_api" }, ...message },
  conversation: { phone_number: "+593962247520", contact_name: "Ana" },
  phone_number_id: "111",
  ...extra,
});

describe("parseKapsoWebhook", () => {
  it("lee un lote con debounce y normaliza el número", () => {
    const events = parseKapsoWebhook(
      {
        batch: true,
        data: [
          inbound("w1", { type: "text", text: { body: "Hola" } }),
          inbound("w2", { type: "text", text: { body: "¿tienen kraft?" } }),
        ],
      },
      "whatsapp.message.received",
    );
    expect(events).toEqual([
      { kind: "inbound", id: "w1", phone: "593962247520", contactName: "Ana", text: "Hola", audioId: null },
      { kind: "inbound", id: "w2", phone: "593962247520", contactName: "Ana", text: "¿tienen kraft?", audioId: null },
    ]);
  });

  it("acepta un mensaje suelto (sin lote)", () => {
    const events = parseKapsoWebhook(inbound("w1", { type: "text", text: { body: "Hola" } }), null);
    expect(events).toHaveLength(1);
  });

  it("ignora eventos de otro número de la cuenta", () => {
    const events = parseKapsoWebhook(
      { batch: true, data: [inbound("w1", { type: "text", text: { body: "x" } }, { phone_number_id: "999" })] },
      null,
      "111",
    );
    expect(events).toEqual([]);
  });

  it("usa la transcripción de Kapso si viene, y si no pide transcribir", () => {
    const [withTranscript, withoutTranscript] = parseKapsoWebhook(
      {
        batch: true,
        data: [
          inbound("a1", {
            type: "audio",
            audio: { id: "m1" },
            kapso: { direction: "inbound", transcript: { text: "quiero dúplex" } },
          }),
          inbound("a2", { type: "audio", audio: { id: "m2" } }),
        ],
      },
      null,
    );
    expect(withTranscript).toMatchObject({ text: "(Nota de voz) quiero dúplex", audioId: null });
    expect(withoutTranscript).toMatchObject({ text: "[El cliente envió una nota de voz]", audioId: "m2" });
  });

  it("convierte botones, imágenes con pie y tipos desconocidos en texto", () => {
    const events = parseKapsoWebhook(
      {
        batch: true,
        data: [
          inbound("b1", { type: "interactive", interactive: { button_reply: { title: "Confirmar pedido" } } }),
          inbound("i1", { type: "image", image: { caption: "esta caja" } }),
          inbound("s1", { type: "sticker" }),
        ],
      },
      null,
    );
    expect(events.map((e) => e.text)).toEqual([
      "Confirmar pedido",
      "[El cliente envió una imagen] esta caja",
      "[El cliente envió un sticker]",
    ]);
  });

  it("reconoce lo que escribe un asesor desde la app e ignora lo que envía el bot", () => {
    const outbound = (id: string, origin: string) => ({
      message: { id, type: "text", to: "593962247520", text: { body: "Hola, soy Juan" }, kapso: { direction: "outbound", origin } },
      conversation: { phone_number: "593962247520" },
    });
    expect(parseKapsoWebhook(outbound("e1", "business_app"), "whatsapp.message.sent")).toEqual([
      { kind: "agent_echo", id: "e1", phone: "593962247520", text: "Hola, soy Juan" },
    ]);
    expect(parseKapsoWebhook(outbound("e2", "cloud_api"), "whatsapp.message.sent")).toEqual([]);
  });

  it("ignora el historial importado y los payloads inválidos", () => {
    const history = inbound("h1", { type: "text", text: { body: "viejo" }, kapso: { direction: "inbound", origin: "history_sync" } });
    expect(parseKapsoWebhook(history, null)).toEqual([]);
    expect(parseKapsoWebhook(null, null)).toEqual([]);
    expect(parseKapsoWebhook({ batch: true, data: [{}] }, null)).toEqual([]);
  });
});
