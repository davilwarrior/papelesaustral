import type { CatalogRepository } from "@/domain/repositories/catalog-repository";
import type { SiteConfigRepository } from "@/domain/repositories/site-config-repository";
import { StaticCatalogRepository } from "./repositories/static-catalog-repository";
import { StaticSiteConfigRepository } from "./repositories/static-site-config-repository";

/**
 * Composition root: punto único donde se decide qué implementación
 * concreta usa la aplicación. Cuando exista el backend del sistema
 * de inventario, aquí se cambia StaticCatalogRepository por una
 * implementación HTTP/DB sin tocar dominio, aplicación ni UI.
 */
export const catalogRepository: CatalogRepository =
  new StaticCatalogRepository();

export const siteConfigRepository: SiteConfigRepository =
  new StaticSiteConfigRepository();
