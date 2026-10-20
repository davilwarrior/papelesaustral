import { buildPriceList } from "@/application/use-cases/build-price-list";
import { getProductCatalog } from "@/application/use-cases/get-product-catalog";
import { getSiteConfig } from "@/application/use-cases/get-site-config";
import { productRepository, siteConfigRepository } from "./container";

/** Rutas de descarga; la sincronización las revalida junto con el cotizador. */
export const PRICE_LIST_PATHS = {
  pdf: "/lista-de-precios.pdf",
  xlsx: "/lista-de-precios.xlsx",
} as const;

export async function loadPriceList() {
  const [site, catalog] = await Promise.all([
    getSiteConfig(siteConfigRepository),
    getProductCatalog(productRepository),
  ]);
  return buildPriceList(catalog, site);
}
