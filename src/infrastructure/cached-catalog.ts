import { getProductCatalog } from "@/application/use-cases/get-product-catalog";
import type { ProductCatalog } from "@/domain/repositories/product-repository";
import { productRepository } from "./container";

/** El catálogo cambia solo al sincronizar el Sheet; 5 minutos evita una consulta por mensaje. */
let catalogCache: { value: Promise<ProductCatalog>; at: number } | null = null;

/** Catálogo para los asistentes (web y WhatsApp), con caché en memoria por instancia. */
export function loadCachedCatalog(): Promise<ProductCatalog> {
  if (!catalogCache || Date.now() - catalogCache.at > 5 * 60_000) {
    const value = getProductCatalog(productRepository);
    value.catch(() => (catalogCache = null));
    catalogCache = { value, at: Date.now() };
  }
  return catalogCache.value;
}
