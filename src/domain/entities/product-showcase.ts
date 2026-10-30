import type { ProductFamilyId } from "./product";

/** Ficha visual de una línea del catálogo: foto, descripción y usos. */
export interface ProductShowcaseItem {
  readonly slug: string;
  /** Línea del catálogo (LINEA del Sheet) a la que corresponde la ficha. */
  readonly lineSourceName: string;
  readonly name: string;
  readonly familyId: ProductFamilyId;
  readonly image: string;
  /** Rasgo principal en pocas palabras: "Brillo en ambas caras". */
  readonly highlight: string;
  readonly summary: string;
  readonly uses: readonly string[];
}

/** Ficha enriquecida con lo que hay disponible hoy en el catálogo. */
export interface ProductShowcaseEntry extends ProductShowcaseItem {
  readonly variantCount: number;
  readonly grammages: readonly number[];
  readonly sizes: readonly string[];
}
