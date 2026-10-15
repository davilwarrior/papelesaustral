import type { Product, ProductFamilyId } from "@/domain/entities/product";

export interface CatalogFilters {
  readonly query: string;
  readonly family: ProductFamilyId | "";
  readonly brand: string;
  readonly size: string;
  readonly grammage: string;
  readonly tag: string;
  readonly onlyPriced: boolean;
}

export const EMPTY_FILTERS: CatalogFilters = {
  query: "",
  family: "",
  brand: "",
  size: "",
  grammage: "",
  tag: "",
  onlyPriced: false,
};

export const GRAMMAGE_RANGES = [
  { id: "0-89", label: "Hasta 89 g" },
  { id: "90-149", label: "90 a 149 g" },
  { id: "150-249", label: "150 a 249 g" },
  { id: "250-349", label: "250 a 349 g" },
  { id: "350-99999", label: "350 g o más" },
] as const;

export function normalizeText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}

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

export function matchesFilters(
  product: Product,
  haystack: string,
  filters: CatalogFilters,
  skip?: keyof CatalogFilters,
): boolean {
  const f = filters;
  if (skip !== "family" && f.family && product.line.familyId !== f.family) return false;
  if (skip !== "brand" && f.brand && product.brand !== f.brand) return false;
  if (skip !== "size" && f.size && product.size !== f.size) return false;
  if (skip !== "tag" && f.tag && !product.tags.includes(f.tag)) return false;
  if (f.onlyPriced && product.pricePerPack === null) return false;
  if (skip !== "grammage" && f.grammage) {
    const [min, max] = f.grammage.split("-").map(Number);
    if (product.grammage === null || product.grammage < min || product.grammage > max) return false;
  }
  const terms = normalizeText(f.query).split(/\s+/).filter(Boolean);
  return terms.every((term) => haystack.includes(term));
}
