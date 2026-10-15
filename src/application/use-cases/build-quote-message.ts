import type { Product } from "@/domain/entities/product";

export interface QuoteLine {
  readonly product: Product;
  readonly packs: number;
}

export interface QuoteCustomer {
  readonly name: string;
  readonly company?: string;
  readonly taxId?: string;
  readonly city?: string;
  readonly notes?: string;
}

export interface QuoteTotals {
  /** Suma de los ítems con precio. */
  readonly total: number;
  readonly sheets: number;
  /** Ítems sin precio publicado que el asesor debe cotizar. */
  readonly pendingItems: number;
}

const usd = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

export function formatUsd(value: number): string {
  return usd.format(value);
}

export function calculateQuoteTotals(lines: readonly QuoteLine[]): QuoteTotals {
  return lines.reduce<QuoteTotals>(
    (acc, { product, packs }) => ({
      total:
        acc.total + (product.pricePerPack === null ? 0 : product.pricePerPack * packs),
      sheets: acc.sheets + (product.sheetsPerPack ?? 0) * packs,
      pendingItems: acc.pendingItems + (product.pricePerPack === null ? 1 : 0),
    }),
    { total: 0, sheets: 0, pendingItems: 0 },
  );
}

/** Texto del pedido para enviar por WhatsApp al asesor. */
export function buildQuoteMessage(
  lines: readonly QuoteLine[],
  customer: QuoteCustomer,
): string {
  const totals = calculateQuoteTotals(lines);
  const items = lines.map(({ product, packs }, i) => {
    const sheets = product.sheetsPerPack ? ` (${(product.sheetsPerPack * packs).toLocaleString("es-EC")} pliegos)` : "";
    const price =
      product.pricePerPack === null
        ? "precio a consultar"
        : `${formatUsd(product.pricePerPack)} c/u = ${formatUsd(product.pricePerPack * packs)}`;
    return `${i + 1}. [${product.code}] ${product.description}\n   ${packs} paq${sheets} · ${price}`;
  });

  const customerLines = [
    `Nombre: ${customer.name}`,
    customer.company && `Empresa: ${customer.company}`,
    customer.taxId && `RUC/Cédula: ${customer.taxId}`,
    customer.city && `Ciudad: ${customer.city}`,
    customer.notes && `Notas: ${customer.notes}`,
  ].filter(Boolean);

  const pending =
    totals.pendingItems > 0
      ? ` + ${totals.pendingItems} ${totals.pendingItems === 1 ? "ítem" : "ítems"} a consultar`
      : "";

  return [
    "Hola, quiero cotizar este pedido desde el cotizador web:",
    "",
    ...items,
    "",
    `Total: ${formatUsd(totals.total)}${pending}`,
    "",
    ...customerLines,
  ].join("\n");
}
