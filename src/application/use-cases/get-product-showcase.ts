import type { Product } from "@/domain/entities/product";
import type { ProductShowcaseEntry } from "@/domain/entities/product-showcase";
import type { CatalogRepository } from "@/domain/repositories/catalog-repository";

/**
 * Fichas visuales de cada línea con los gramajes y medidas que hay hoy
 * en el catálogo. Una línea sin productos activos se muestra igual,
 * solo sin esas cifras.
 */
export async function getProductShowcase(
  repository: CatalogRepository,
  products: readonly Product[],
): Promise<readonly ProductShowcaseEntry[]> {
  const items = await repository.getProductShowcase();

  const byLine = new Map<string, Product[]>();
  for (const product of products) {
    const list = byLine.get(product.line.sourceName) ?? [];
    list.push(product);
    byLine.set(product.line.sourceName, list);
  }

  return items.map((item) => {
    const lineProducts = byLine.get(item.lineSourceName) ?? [];
    const grammages = new Set<number>();
    const sizes = new Map<string, number>();
    for (const product of lineProducts) {
      if (product.grammage !== null) grammages.add(product.grammage);
      if (product.size) sizes.set(product.size, (sizes.get(product.size) ?? 0) + 1);
    }

    return {
      ...item,
      variantCount: lineProducts.length,
      grammages: [...grammages].sort((a, b) => a - b),
      // Las medidas más frecuentes primero.
      sizes: [...sizes.entries()].sort((a, b) => b[1] - a[1]).map(([size]) => size),
    };
  });
}
