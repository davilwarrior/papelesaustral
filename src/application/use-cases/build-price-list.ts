import { PRODUCT_FAMILIES, type Product } from "@/domain/entities/product";
import type { ContactInfo } from "@/domain/entities/site-config";
import type { ProductCatalog } from "@/domain/repositories/product-repository";

export interface PriceListLine {
  readonly name: string;
  readonly products: readonly Product[];
}

export interface PriceListSection {
  readonly familyName: string;
  readonly lines: readonly PriceListLine[];
  readonly productCount: number;
}

export interface PriceList {
  readonly companyName: string;
  readonly siteUrl: string;
  readonly contact: ContactInfo;
  /** Fecha de la última actualización de precios, ya formateada ("20 oct 2026"). */
  readonly updatedAtLabel: string;
  /** Fecha para el nombre del archivo ("2026-10-20"). */
  readonly fileDate: string;
  readonly sections: readonly PriceListSection[];
  readonly productCount: number;
}

/** Aviso que acompaña cualquier lista descargada o impresa. */
export const PRICE_LIST_NOTICE = {
  title: "Importante sobre los precios",
  points: [
    "Los precios son finales, en dólares (USD), por paquete y vigentes a la fecha de actualización indicada.",
    "La mayoría se mantiene estable, pero algunos valores pueden cambiar sin previo aviso según la llegada y el costo de la mercadería.",
    "Antes de confirmar tu pedido, verifica precio y disponibilidad con un asesor.",
    "\"Consultar\" indica productos cuyo precio se confirma directamente con un asesor.",
  ],
  short:
    "Precios en USD sujetos a cambio sin previo aviso según disponibilidad. Confirma con un asesor antes de tu pedido.",
} as const;

const TIME_ZONE = "America/Guayaquil";

export function buildPriceList(
  catalog: ProductCatalog,
  site: { name: string; url: string; contact: ContactInfo },
): PriceList {
  const updatedAt = catalog.updatedAt ? new Date(catalog.updatedAt) : new Date();

  const sections = PRODUCT_FAMILIES.map((family) => {
    const lines = new Map<string, Product[]>();
    for (const product of catalog.products) {
      if (product.line.familyId !== family.id) continue;
      const list = lines.get(product.line.name) ?? [];
      list.push(product);
      lines.set(product.line.name, list);
    }
    const lineList = [...lines.entries()].map(([name, products]) => ({ name, products }));
    return {
      familyName: family.name,
      lines: lineList,
      productCount: lineList.reduce((total, line) => total + line.products.length, 0),
    };
  }).filter((section) => section.productCount > 0);

  return {
    companyName: site.name,
    siteUrl: site.url,
    contact: site.contact,
    updatedAtLabel: new Intl.DateTimeFormat("es-EC", {
      day: "numeric",
      month: "long",
      year: "numeric",
      timeZone: TIME_ZONE,
    }).format(updatedAt),
    fileDate: new Intl.DateTimeFormat("en-CA", { timeZone: TIME_ZONE }).format(updatedAt),
    sections,
    productCount: catalog.products.length,
  };
}
