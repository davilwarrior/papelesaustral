import { describe, expect, it, vi } from "vitest";
import type { Product } from "@/domain/entities/product";
import type { ProductCatalog } from "@/domain/repositories/product-repository";
import { createWhatsAppTools, sanitizeCart, type WhatsAppHandoff } from "./assistant-tools";

const product = (code: string, description: string, pricePerPack: number | null): Product => ({
  code,
  description,
  line: { sourceName: "DUPLEX", name: "Dúplex", familyId: "cartulinas", order: 1 },
  brand: "NY",
  grammage: 250,
  size: "70x100",
  caliper: null,
  thicknessMm: null,
  sheetsPerPack: 100,
  pricePerPack,
  tags: [],
});

const catalog: ProductCatalog = {
  products: [product("001", "Duplex 250gr 70x100", 18.35), product("002", "Kraft 90gr", null)],
  tags: [],
  updatedAt: null,
};
const options = { toolCallId: "t1", messages: [], context: {} } as never;

function setup(cart = new Map<string, number>()) {
  const onHandoff = vi.fn<(h: WhatsAppHandoff) => void>();
  const onPriceList = vi.fn();
  const onButtons = vi.fn();
  const tools = createWhatsAppTools({ catalog, cart, onHandoff, onPriceList, onButtons });
  return { tools, cart, onHandoff, onPriceList, onButtons };
}

describe("sanitizeCart", () => {
  it("solo acepta códigos activos y cantidades válidas", () => {
    const byCode = new Map(catalog.products.map((p) => [p.code, p]));
    const cart = sanitizeCart({ "001": 2.6, "002": 0, "999": 5, "003": "x" }, byCode);
    expect([...cart]).toEqual([["001", 3]]);
    expect(sanitizeCart(null, byCode).size).toBe(0);
  });
});

describe("herramientas de WhatsApp", () => {
  it("actualizar_pedido agrega, cambia y quita productos con el total", async () => {
    const { tools, cart } = setup();
    const result = await tools.actualizar_pedido.execute!(
      { items: [{ codigo: "001", paquetes: 2 }, { codigo: "999", paquetes: 1 }] },
      options,
    );
    expect(result).toMatchObject({ noEncontrados: ["999"], pedido: { totalUsd: 36.7 } });
    await tools.actualizar_pedido.execute!({ items: [{ codigo: "001", paquetes: 0 }] }, options);
    expect(cart.size).toBe(0);
  });

  it("pasar_a_asesor con pedido exige productos y nombre", async () => {
    const { tools, onHandoff } = setup();
    const empty = await tools.pasar_a_asesor.execute!({ motivo: "pedido", nombre: "Ana" }, options);
    expect(empty).toMatchObject({ listo: false, motivo: "El pedido está vacío." });

    const { tools: withCart, onHandoff: handoff2 } = setup(new Map([["001", 2]]));
    const noName = await withCart.pasar_a_asesor.execute!({ motivo: "pedido" }, options);
    expect(noName).toMatchObject({ listo: false, motivo: "Falta el nombre del cliente." });
    expect(onHandoff).not.toHaveBeenCalled();

    const ok = await withCart.pasar_a_asesor.execute!({ motivo: "pedido", nombre: "Ana", ciudad: "Azogues" }, options);
    expect(ok).toMatchObject({ listo: true });
    const summary = handoff2.mock.calls[0][0].orderSummary ?? "";
    expect(summary).toContain("Pedido armado con el asistente:");
    expect(summary).toContain("[001] Duplex 250gr 70x100");
    expect(summary).toContain("Ciudad: Azogues");
  });

  it("pasar_a_asesor sin pedido manda la consulta como resumen", async () => {
    const { tools, onHandoff } = setup();
    await tools.pasar_a_asesor.execute!({ motivo: "consulta", resumenParaAsesor: "Pregunta por envío a Loja" }, options);
    expect(onHandoff).toHaveBeenCalledWith({ reason: "consulta", orderSummary: null, notes: "Pregunta por envío a Loja" });
  });

  it("enviar_lista_precios y mostrar_botones avisan al canal", async () => {
    const { tools, onPriceList, onButtons } = setup();
    await tools.enviar_lista_precios.execute!({ formato: "pdf" }, options);
    await tools.mostrar_botones.execute!({ opciones: ["Confirmar pedido", "Cambiar algo"] }, options);
    expect(onPriceList).toHaveBeenCalledWith("pdf");
    expect(onButtons).toHaveBeenCalledWith(["Confirmar pedido", "Cambiar algo"]);
  });
});
