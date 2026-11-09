import { tool, type InferUITools, type UIDataTypes, type UIMessage } from "ai";
import { z } from "zod";
import {
  buildQuoteMessage,
  calculateQuoteTotals,
  type QuoteLine,
} from "@/application/use-cases/build-quote-message";
import { buildWhatsAppQuoteUrl } from "@/application/use-cases/build-whatsapp-quote-url";
import { searchProducts } from "@/application/use-cases/search-products";
import type { Product } from "@/domain/entities/product";
import type { ProductCatalog } from "@/domain/repositories/product-repository";

/** Paquetes por código de producto, como lo guarda el cotizador. */
export type CartSnapshot = Readonly<Record<string, number>>;

export const MAX_PACKS = 9999;

/** Lo que el modelo ve de cada producto. Los precios salen siempre del catálogo. */
function describeProduct(product: Product) {
  return {
    codigo: product.code,
    descripcion: product.description,
    linea: product.line.name,
    marca: product.brand,
    gramaje: product.grammage,
    medida: product.size,
    calibre: product.caliper,
    espesorMm: product.thicknessMm,
    pliegosPorPaquete: product.sheetsPerPack,
    precioPaqueteUsd: product.pricePerPack,
    usos: product.tags,
  };
}

function cartLines(cart: Map<string, number>, byCode: Map<string, Product>): QuoteLine[] {
  return [...cart]
    .map(([code, packs]) => ({ product: byCode.get(code), packs }))
    .filter((line): line is QuoteLine => line.product !== undefined);
}

function summarize(lines: readonly QuoteLine[]) {
  const totals = calculateQuoteTotals(lines);
  return {
    items: lines.map(({ product, packs }) => ({
      codigo: product.code,
      descripcion: product.description,
      paquetes: packs,
      precioPaqueteUsd: product.pricePerPack,
      subtotalUsd: product.pricePerPack === null ? null : round(product.pricePerPack * packs),
    })),
    totalUsd: round(totals.total),
    pliegos: totals.sheets,
    itemsPorConsultar: totals.pendingItems,
  };
}

const round = (value: number) => Math.round(value * 100) / 100;

/** Normaliza el pedido que manda el navegador: solo códigos activos y cantidades válidas. */
export function sanitizeCart(raw: unknown, byCode: Map<string, Product>): Map<string, number> {
  const cart = new Map<string, number>();
  if (!raw || typeof raw !== "object") return cart;
  for (const [code, value] of Object.entries(raw)) {
    const packs = Math.round(Number(value));
    if (byCode.has(code) && packs > 0) cart.set(code, Math.min(packs, MAX_PACKS));
  }
  return cart;
}

interface CatalogToolsContext {
  readonly catalog: ProductCatalog;
  /** Pedido actual del cliente; las herramientas lo modifican durante la respuesta. */
  readonly cart: Map<string, number>;
}

/** Herramientas comunes a todos los canales: catálogo y pedido. */
function createCatalogTools({ catalog, cart }: CatalogToolsContext) {
  const byCode = new Map(catalog.products.map((p) => [p.code, p]));

  return {
    buscar_productos: tool({
      description:
        "Busca en el catálogo de Papeles Austral. Usa palabras clave cortas: tipo de material, gramaje, medida, marca o un uso " +
        'de la lista de usos. Ejemplos: "duplex 250 70x100", "couche 150", "kraft", "adhesivo", "grado alimenticio", "antigrasa". ' +
        "Devuelve precios reales por paquete. Si no hay coincidencia exacta, prueba otra vez con menos palabras.",
      inputSchema: z.object({
        consulta: z.string().max(120).describe("Palabras clave a buscar"),
      }),
      execute: async ({ consulta }) => {
        const { results, total, exact } = searchProducts(catalog.products, { query: consulta });
        return {
          total,
          coincidenciaExacta: exact,
          productos: results.map(describeProduct),
        };
      },
    }),

    actualizar_pedido: tool({
      description:
        "Agrega, cambia o quita productos del pedido del cliente. paquetes es la cantidad final de paquetes " +
        "(0 para quitar). Usa solo códigos obtenidos con buscar_productos.",
      inputSchema: z.object({
        items: z
          .array(
            z.object({
              codigo: z.string().describe("Código SAMMI del producto"),
              paquetes: z.number().int().min(0).max(MAX_PACKS),
            }),
          )
          .min(1)
          .max(30),
      }),
      execute: async ({ items }) => {
        const cambios: { codigo: string; paquetes: number; descripcion: string }[] = [];
        const noEncontrados: string[] = [];
        for (const { codigo, paquetes } of items) {
          const product = byCode.get(codigo.trim());
          if (!product) {
            noEncontrados.push(codigo);
            continue;
          }
          if (paquetes > 0) cart.set(product.code, paquetes);
          else cart.delete(product.code);
          cambios.push({ codigo: product.code, paquetes, descripcion: product.description });
        }
        return { cambios, noEncontrados, pedido: summarize(cartLines(cart, byCode)) };
      },
    }),

    ver_pedido: tool({
      description: "Muestra el pedido actual del cliente con subtotales y total.",
      inputSchema: z.object({}),
      execute: async () => summarize(cartLines(cart, byCode)),
    }),
  };
}

interface AssistantToolsContext extends CatalogToolsContext {
  readonly whatsappNumber: string;
}

/** Herramientas del asistente web: el pedido se envía con un botón de WhatsApp. */
export function createAssistantTools({ catalog, whatsappNumber, cart }: AssistantToolsContext) {
  const byCode = new Map(catalog.products.map((p) => [p.code, p]));

  return {
    ...createCatalogTools({ catalog, cart }),

    preparar_envio: tool({
      description:
        "Prepara el pedido para enviarlo por WhatsApp a un asesor. Úsalo solo cuando el cliente confirmó el pedido " +
        "y te dio al menos su nombre. El cliente verá un botón para enviarlo.",
      inputSchema: z.object({
        nombre: z.string().min(1).max(100),
        empresa: z.string().max(120).optional(),
        rucOCedula: z.string().max(20).optional(),
        ciudad: z.string().max(60).optional(),
        notas: z.string().max(400).optional(),
      }),
      execute: async ({ nombre, empresa, rucOCedula, ciudad, notas }) => {
        const lines = cartLines(cart, byCode);
        if (lines.length === 0) {
          return { listo: false as const, motivo: "El pedido está vacío." };
        }
        const message = buildQuoteMessage(lines, {
          name: nombre,
          company: empresa,
          taxId: rucOCedula,
          city: ciudad,
          notes: notas,
        }).replace("desde el cotizador web", "desde el asistente web");
        return {
          listo: true as const,
          whatsappUrl: buildWhatsAppQuoteUrl(whatsappNumber, message),
          pedido: summarize(lines),
        };
      },
    }),
  };
}

/** Datos con los que el bot de WhatsApp pasa la conversación a un asesor. */
export interface WhatsAppHandoff {
  readonly reason: "pedido" | "consulta" | "solicitud_cliente";
  /** Texto del pedido para el asesor; null si no hay productos. */
  readonly orderSummary: string | null;
}

interface WhatsAppToolsContext extends CatalogToolsContext {
  readonly onHandoff: (handoff: WhatsAppHandoff) => void;
}

/** Herramientas del bot de WhatsApp: el cliente ya está en el chat, así que se pasa a un asesor. */
export function createWhatsAppTools({ catalog, cart, onHandoff }: WhatsAppToolsContext) {
  const byCode = new Map(catalog.products.map((p) => [p.code, p]));

  return {
    ...createCatalogTools({ catalog, cart }),

    pasar_a_asesor: tool({
      description:
        "Pasa la conversación a un asesor humano en este mismo chat. Úsalo cuando el cliente confirmó su pedido " +
        "(y te dio al menos su nombre), cuando pide hablar con una persona, o cuando pregunta algo que no puedes " +
        "resolver (stock, envío, pagos, descuentos, crédito, facturación). Después de usarlo ya no respondes más.",
      inputSchema: z.object({
        motivo: z.enum(["pedido", "consulta", "solicitud_cliente"]),
        nombre: z.string().max(100).optional(),
        empresa: z.string().max(120).optional(),
        rucOCedula: z.string().max(20).optional(),
        ciudad: z.string().max(60).optional(),
        notas: z.string().max(400).optional().describe("Resumen breve de lo que necesita el cliente"),
      }),
      execute: async ({ motivo, nombre, empresa, rucOCedula, ciudad, notas }) => {
        const lines = cartLines(cart, byCode);
        if (motivo === "pedido" && (lines.length === 0 || !nombre)) {
          return {
            listo: false as const,
            motivo: lines.length === 0 ? "El pedido está vacío." : "Falta el nombre del cliente.",
          };
        }
        const orderSummary =
          lines.length > 0
            ? buildQuoteMessage(lines, {
                name: nombre || "(sin nombre)",
                company: empresa,
                taxId: rucOCedula,
                city: ciudad,
                notes: notas,
              }).replace("Hola, quiero cotizar este pedido desde el cotizador web:", "Pedido armado con el asistente:")
            : notas
              ? `Consulta para el asesor: ${notas}`
              : null;
        onHandoff({ reason: motivo, orderSummary });
        return { listo: true as const, pedido: lines.length > 0 ? summarize(lines) : null };
      },
    }),
  };
}

export type AssistantTools = ReturnType<typeof createAssistantTools>;
export type AssistantUIMessage = UIMessage<never, UIDataTypes, InferUITools<AssistantTools>>;
