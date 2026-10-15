export const PRODUCT_FAMILIES = [
  { id: "papeles", name: "Papeles" },
  { id: "cartulinas", name: "Cartulinas" },
  { id: "cartones", name: "Cartones" },
  { id: "materiales-especializados", name: "Materiales especializados" },
] as const;

export type ProductFamilyId = (typeof PRODUCT_FAMILIES)[number]["id"];

export interface ProductLine {
  /** Texto de la fila de sección tal como está en el catálogo. */
  readonly sourceName: string;
  readonly name: string;
  readonly familyId: ProductFamilyId;
  readonly order: number;
}

export interface Product {
  /** Código SAMMI: identificador único y estable. */
  readonly code: string;
  readonly description: string;
  readonly line: ProductLine;
  readonly brand: string | null;
  readonly grammage: number | null;
  /** Medida tal como se escribe en el catálogo: "70x100", "A4", "Ancho 24.1". */
  readonly size: string | null;
  readonly caliper: number | null;
  readonly thicknessMm: number | null;
  readonly sheetsPerPack: number | null;
  /** Precio final en USD. null = "Consultar". */
  readonly pricePerPack: number | null;
  readonly tags: readonly string[];
}

export interface ProductTag {
  readonly name: string;
  readonly description: string;
}
