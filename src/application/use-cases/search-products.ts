import type { Product, ProductFamilyId } from "@/domain/entities/product";

export function normalizeText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}

/** Texto indexable de un producto: código, descripción, marca, línea, medidas y usos. */
export function searchText(product: Product): string {
  return normalizeText(
    [
      product.code,
      product.description,
      product.brand,
      product.line.name,
      product.grammage && `${product.grammage}gr ${product.grammage}g`,
      product.size,
      product.caliper && `calibre ${product.caliper}`,
      ...product.tags,
    ]
      .filter(Boolean)
      .join(" "),
  );
}

/** Palabras que no ayudan a encontrar un producto ("papel de 250 gramos para cajas"). */
const STOPWORDS = new Set([
  "de", "del", "la", "el", "los", "las", "un", "una", "unos", "unas", "y", "o",
  "con", "en", "para", "por", "que", "me", "mi", "tienen", "tiene", "hay",
  "gramos", "gramo", "gr", "g", "grs", "medida", "pliego", "pliegos",
]);

export interface ProductSearchOptions {
  readonly query: string;
  readonly family?: ProductFamilyId;
  readonly onlyPriced?: boolean;
  readonly limit?: number;
}

/**
 * Búsqueda tolerante para el asistente: si ningún producto contiene todas
 * las palabras, devuelve los que contienen más, en orden de catálogo.
 */
export function searchProducts(
  products: readonly Product[],
  { query, family, onlyPriced = false, limit = 12 }: ProductSearchOptions,
): { readonly results: readonly Product[]; readonly total: number; readonly exact: boolean } {
  const terms = normalizeText(query)
    .replace(/(\d)\s*(?:gr|g|grs)\b/g, "$1")
    .split(/[\s,]+/)
    .filter((term) => term && !STOPWORDS.has(term));

  const scored = products
    .filter((p) => (!family || p.line.familyId === family) && (!onlyPriced || p.pricePerPack !== null))
    .map((product) => {
      const haystack = searchText(product);
      return { product, score: terms.filter((term) => haystack.includes(term)).length };
    });

  const best = Math.max(0, ...scored.map((s) => s.score));
  const matches = terms.length === 0 ? scored : scored.filter((s) => best > 0 && s.score === best);

  return {
    results: matches.slice(0, limit).map((s) => s.product),
    total: matches.length,
    exact: terms.length === 0 || best === terms.length,
  };
}
