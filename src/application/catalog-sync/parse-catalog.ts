import {
  PRODUCT_FAMILIES,
  type Product,
  type ProductLine,
  type ProductTag,
} from "@/domain/entities/product";

/** Filas crudas de cada pestaña del Sheet (como las devuelve la API de valores). */
export interface RawCatalogSheets {
  readonly catalog: readonly (readonly string[])[];
  readonly lines: readonly (readonly string[])[];
  readonly tags: readonly (readonly string[])[];
  readonly brands: readonly (readonly string[])[];
}

export type CatalogIssueKind =
  | "missing-code"
  | "duplicate-code"
  | "unknown-line"
  | "unknown-family"
  | "product-without-line"
  | "invalid-price"
  | "missing-header";

export interface CatalogIssue {
  readonly kind: CatalogIssueKind;
  /** Pestaña y fila (base 1) donde está el problema. */
  readonly sheet: string;
  readonly row: number | null;
  readonly message: string;
  /** Si es true, la fila no se migra. */
  readonly excluded: boolean;
}

export interface ParsedProduct extends Product {
  /** Fila del Sheet (base 1), para conservar el orden del catálogo. */
  readonly sourceRow: number;
}

export interface ParsedCatalog {
  readonly products: readonly ParsedProduct[];
  readonly lines: readonly ProductLine[];
  readonly tags: readonly ProductTag[];
  readonly issues: readonly CatalogIssue[];
}

const CATALOG_SHEET = "CATALOGO PCC GRAFICO";

const CATALOG_COLUMNS = {
  code: "codigo sammi",
  description: "descripcion",
  sheetsPerPack: "pliegos por paquete",
  pricePerPack: "precio por paquetes",
} as const;

/** Clave estable de una línea a partir del nombre de la sección. */
export function lineKey(sourceName: string): string {
  return normalize(sourceName);
}

/** Minúsculas, sin tildes y con un solo espacio entre palabras. */
export function normalize(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

/** Normaliza y deja solo letras y números, para buscar palabras completas. */
function toWords(value: string): string {
  return ` ${normalize(value).replace(/[^a-z0-9.]+/g, " ").trim()} `;
}

function splitList(value: string | undefined): string[] {
  return (value ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function cell(row: readonly string[], index: number): string {
  return (row[index] ?? "").trim();
}

/** "$ 22.00" → 22, "$ -  .00" / "-" / "" → null. Devuelve undefined si no se entiende. */
export function parsePrice(raw: string): number | null | undefined {
  const value = raw.replace(/\$/g, "").replace(/\s+/g, "");
  if (value === "" || /^-?\.?0*$/.test(value) || /^-\.?\d*$/.test(value)) return null;
  const amount = Number(value.replace(/,/g, ""));
  if (!Number.isFinite(amount)) return undefined;
  return amount > 0 ? Math.round(amount * 100) / 100 : null;
}

function parseInteger(raw: string): number | null {
  const value = Number(raw.replace(/[.,\s]/g, ""));
  return Number.isInteger(value) && value > 0 ? value : null;
}

function parseDecimal(raw: string): number {
  return Number(raw.replace(",", "."));
}

export function extractAttributes(description: string) {
  const text = description.replace(/\s+/g, " ");

  const polyethylene = text.match(/\b0-(\d{2,3})-\d{1,2}\b/);
  const grams = text.match(/(\d+(?:[.,]\d+)?)\s*gr?\b/i);
  const grammage = polyethylene
    ? Number(polyethylene[1])
    : grams
      ? parseDecimal(grams[1])
      : null;

  const dimensions = text.match(/\b(\d{2,3})\s*x\s*(\d{2,3})\b/i);
  const isoFormat = text.match(/\bA([345])\b/i);
  const rollWidth = text.match(/\bancho\s*(\d+(?:[.,]\d+)?)/i);
  const size = dimensions
    ? `${dimensions[1]}x${dimensions[2]}`
    : isoFormat
      ? `A${isoFormat[1]}`
      : rollWidth
        ? `Ancho ${rollWidth[1]}`
        : null;

  const caliper = text.match(/\bcalibre\s*(\d+(?:[.,]\d+)?)/i);
  const thickness = text.match(/(\d+(?:[.,]\d+)?)\s*mm\b/i);

  return {
    grammage,
    size,
    caliper: caliper ? parseDecimal(caliper[1]) : null,
    thicknessMm: thickness ? parseDecimal(thickness[1]) : null,
  };
}

function findHeader(rows: readonly (readonly string[])[], firstColumn: string) {
  const index = rows.findIndex((row) =>
    row.some((value) => normalize(value) === firstColumn),
  );
  if (index === -1) return null;
  const columns = new Map(rows[index].map((value, i) => [normalize(value), i]));
  return { index, columns };
}

function parseLines(rows: RawCatalogSheets["lines"], issues: CatalogIssue[]) {
  const lines = new Map<string, ProductLine>();
  rows.slice(1).forEach((row, i) => {
    const [sourceName, familyName, webName, order] = row.map((v) => (v ?? "").trim());
    if (!sourceName) return;
    const family = PRODUCT_FAMILIES.find((f) => normalize(f.name) === normalize(familyName ?? ""));
    if (!family) {
      issues.push({
        kind: "unknown-family",
        sheet: "LINEAS",
        row: i + 2,
        message: `La familia "${familyName}" no existe. Usa: ${PRODUCT_FAMILIES.map((f) => f.name).join(", ")}.`,
        excluded: true,
      });
      return;
    }
    lines.set(normalize(sourceName), {
      sourceName,
      name: webName || sourceName,
      familyId: family.id,
      order: Number(order) || 0,
    });
  });
  return lines;
}

interface TagRule extends ProductTag {
  readonly keywords: readonly string[];
  readonly lineKeys: ReadonlySet<string>;
}

function parseTagRules(rows: RawCatalogSheets["tags"]): TagRule[] {
  return rows
    .slice(1)
    .filter((row) => cell(row, 0))
    .map((row) => ({
      name: cell(row, 0),
      keywords: splitList(row[1]).map((k) => toWords(k)),
      lineKeys: new Set(splitList(row[2]).map(normalize)),
      description: cell(row, 3),
    }));
}

function parseBrandAliases(rows: RawCatalogSheets["brands"]) {
  return rows
    .slice(1)
    .filter((row) => cell(row, 0))
    .flatMap((row) =>
      [cell(row, 0), ...splitList(row[1])].map((alias) => ({
        brand: cell(row, 0),
        alias: toWords(alias),
      })),
    )
    .sort((a, b) => b.alias.length - a.alias.length);
}

/**
 * Convierte las pestañas del Sheet en productos listos para guardar.
 * Las filas sin código o con código repetido se excluyen y se reportan.
 */
export function parseCatalog(sheets: RawCatalogSheets): ParsedCatalog {
  const issues: CatalogIssue[] = [];
  const lines = parseLines(sheets.lines, issues);
  const tagRules = parseTagRules(sheets.tags);
  const brandAliases = parseBrandAliases(sheets.brands);

  const header = findHeader(sheets.catalog, CATALOG_COLUMNS.code);
  const columns = header
    ? Object.fromEntries(
        Object.entries(CATALOG_COLUMNS).map(([key, name]) => [key, header.columns.get(name)]),
      )
    : {};
  const missingColumns = Object.entries(CATALOG_COLUMNS).filter(
    ([key]) => columns[key] === undefined,
  );
  if (!header || missingColumns.length > 0) {
    issues.push({
      kind: "missing-header",
      sheet: CATALOG_SHEET,
      row: header ? header.index + 1 : null,
      message: `Faltan encabezados: ${missingColumns.map(([, name]) => name).join(", ") || Object.values(CATALOG_COLUMNS).join(", ")}.`,
      excluded: true,
    });
    return { products: [], lines: [...lines.values()], tags: tagRules, issues };
  }

  const col = columns as Record<keyof typeof CATALOG_COLUMNS, number>;
  type Candidate = { row: number; code: string; description: string; raw: readonly string[]; lineKey: string | null };
  const candidates: Candidate[] = [];
  const unknownLines = new Set<string>();
  let currentLine: string | null = null;

  sheets.catalog.slice(header.index + 1).forEach((raw, i) => {
    const row = header.index + i + 2;
    const code = cell(raw, col.code);
    const description = cell(raw, col.description).replace(/\s+/g, " ");
    const filled = raw.filter((v) => (v ?? "").trim()).length;

    if (!description) {
      if (code && filled === 1) {
        currentLine = normalize(code);
        if (!lines.has(currentLine) && !unknownLines.has(currentLine)) {
          unknownLines.add(currentLine);
          issues.push({
            kind: "unknown-line",
            sheet: CATALOG_SHEET,
            row,
            message: `La sección "${code}" no está en la pestaña LINEAS. Sus productos no se migran.`,
            excluded: true,
          });
        }
      }
      return;
    }

    if (!code) {
      issues.push({
        kind: "missing-code",
        sheet: CATALOG_SHEET,
        row,
        message: `"${description}" no tiene código.`,
        excluded: true,
      });
      return;
    }
    candidates.push({ row, code, description, raw, lineKey: currentLine });
  });

  const codeCount = new Map<string, number>();
  candidates.forEach((c) => codeCount.set(c.code, (codeCount.get(c.code) ?? 0) + 1));

  const products: ParsedProduct[] = [];
  for (const candidate of candidates) {
    const { row, code, description, raw, lineKey } = candidate;

    if ((codeCount.get(code) ?? 0) > 1) {
      issues.push({
        kind: "duplicate-code",
        sheet: CATALOG_SHEET,
        row,
        message: `El código ${code} se repite ("${description}").`,
        excluded: true,
      });
      continue;
    }

    const line = lineKey ? lines.get(lineKey) : undefined;
    if (!line) {
      if (!lineKey) {
        issues.push({
          kind: "product-without-line",
          sheet: CATALOG_SHEET,
          row,
          message: `"${description}" está antes de cualquier sección.`,
          excluded: true,
        });
      }
      continue;
    }

    const rawPrice = cell(raw, col.pricePerPack);
    let pricePerPack = parsePrice(rawPrice);
    if (pricePerPack === undefined) {
      issues.push({
        kind: "invalid-price",
        sheet: CATALOG_SHEET,
        row,
        message: `No se entiende el precio "${rawPrice}" de ${code}. Se muestra como "Consultar".`,
        excluded: false,
      });
      pricePerPack = null;
    }

    const words = toWords(description);
    const brand = brandAliases.find((b) => words.includes(b.alias))?.brand ?? null;
    const tags = tagRules
      .filter(
        (rule) =>
          rule.lineKeys.has(normalize(line.sourceName)) ||
          rule.keywords.some((keyword) => words.includes(keyword)),
      )
      .map((rule) => rule.name);

    products.push({
      code,
      description,
      line,
      brand,
      ...extractAttributes(description),
      sheetsPerPack: parseInteger(cell(raw, col.sheetsPerPack)),
      pricePerPack,
      tags,
      sourceRow: row,
    });
  }

  return {
    products,
    lines: [...lines.values()],
    tags: tagRules.map(({ name, description }) => ({ name, description })),
    issues,
  };
}
