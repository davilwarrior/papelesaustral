import type { Product, ProductTag } from "../entities/product";

export interface ProductCatalog {
  /** Productos activos, en el orden del catálogo (familia, línea, fila). */
  readonly products: readonly Product[];
  readonly tags: readonly ProductTag[];
  /** Última sincronización exitosa con el Sheet (ISO 8601). */
  readonly updatedAt: string | null;
}

export interface ProductRepository {
  getCatalog(): Promise<ProductCatalog>;
}
