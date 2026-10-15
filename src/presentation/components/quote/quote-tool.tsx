"use client";

import { ClipboardList, Search, X } from "lucide-react";
import { useDeferredValue, useMemo, useState } from "react";
import { calculateQuoteTotals, formatUsd } from "@/application/use-cases/build-quote-message";
import { PRODUCT_FAMILIES, type Product, type ProductTag } from "@/domain/entities/product";
import { cn } from "../../lib/cn";
import {
  EMPTY_FILTERS,
  GRAMMAGE_RANGES,
  matchesFilters,
  searchText,
  type CatalogFilters,
} from "./catalog-search";
import { ProductTable, type ProductGroup } from "./product-table";
import { QuoteCart } from "./quote-cart";
import { useQuoteCart } from "./quote-cart-store";

interface QuoteToolProps {
  products: readonly Product[];
  tags: readonly ProductTag[];
  whatsappNumber: string;
  updatedAtLabel: string | null;
}

const familyNames = new Map<string, string>(PRODUCT_FAMILIES.map((f) => [f.id, f.name]));

const selectClass =
  "h-9 min-w-0 grow basis-[calc(50%-0.25rem)] rounded-lg border border-navy-800/15 bg-white pr-8 pl-3 text-sm sm:grow-0 sm:basis-auto text-navy-900 outline-none focus:border-forest-500 focus:ring-2 focus:ring-forest-500/20";

/** Opciones de un filtro con su conteo, respetando los demás filtros activos. */
function optionsFor(
  indexed: readonly { product: Product; haystack: string }[],
  filters: CatalogFilters,
  key: keyof CatalogFilters,
  pick: (product: Product) => readonly (string | null)[],
) {
  const counts = new Map<string, number>();
  for (const { product, haystack } of indexed) {
    if (!matchesFilters(product, haystack, filters, key)) continue;
    for (const value of pick(product)) {
      if (value) counts.set(value, (counts.get(value) ?? 0) + 1);
    }
  }
  return counts;
}

export function QuoteTool({ products, tags, whatsappNumber, updatedAtLabel }: QuoteToolProps) {
  const [filters, setFilters] = useState<CatalogFilters>(EMPTY_FILTERS);
  const [cartOpen, setCartOpen] = useState(false);
  const deferredFilters = useDeferredValue(filters);
  const cart = useQuoteCart();

  const indexed = useMemo(
    () => products.map((product) => ({ product, haystack: searchText(product) })),
    [products],
  );

  const visible = useMemo(
    () =>
      indexed
        .filter(({ product, haystack }) => matchesFilters(product, haystack, deferredFilters))
        .map(({ product }) => product),
    [indexed, deferredFilters],
  );

  const groups = useMemo(() => {
    const byLine = new Map<string, ProductGroup>();
    for (const product of visible) {
      const group = byLine.get(product.line.sourceName) ?? {
        lineName: product.line.name,
        familyName: familyNames.get(product.line.familyId) ?? "",
        products: [],
      };
      byLine.set(product.line.sourceName, { ...group, products: [...group.products, product] });
    }
    return [...byLine.values()];
  }, [visible]);

  const facets = useMemo(
    () => ({
      family: optionsFor(indexed, deferredFilters, "family", (p) => [p.line.familyId]),
      brand: optionsFor(indexed, deferredFilters, "brand", (p) => [p.brand]),
      size: optionsFor(indexed, deferredFilters, "size", (p) => [p.size]),
      tag: optionsFor(indexed, deferredFilters, "tag", (p) => p.tags),
    }),
    [indexed, deferredFilters],
  );

  const lines = useMemo(
    () =>
      products
        .filter((product) => (cart[product.code] ?? 0) > 0)
        .map((product) => ({ product, packs: cart[product.code] })),
    [products, cart],
  );
  const totals = calculateQuoteTotals(lines);

  const set = <K extends keyof CatalogFilters>(key: K, value: CatalogFilters[K]) =>
    setFilters((current) => ({ ...current, [key]: value }));

  const hasFilters = JSON.stringify(filters) !== JSON.stringify(EMPTY_FILTERS);
  const selectedTag = tags.find((t) => t.name === filters.tag);
  const sortedBrands = [...facets.brand.keys()].sort((a, b) => a.localeCompare(b, "es"));
  const sortedSizes = [...facets.size.entries()].sort((a, b) => b[1] - a[1]);

  return (
    <div className="flex flex-col xl:h-[calc(100dvh-4.5rem)]">
      {/* Encabezado y filtros */}
      <div className="border-b border-navy-800/10 bg-paper-50">
        <div className="mx-auto w-full max-w-[1600px] px-4 pt-5 pb-3 sm:px-6">
          <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-1">
            <div>
              <h1 className="font-display text-2xl font-semibold tracking-tight text-navy-900 sm:text-3xl">
                Cotizador
              </h1>
              <p className="mt-1 text-sm text-navy-800/60">
                Busca por gramaje, medida, marca o uso y arma tu pedido por paquetes.
              </p>
            </div>
            <p className="text-xs text-navy-800/50">
              {products.length} productos · Precios en USD
              {updatedAtLabel && ` · Actualizados el ${updatedAtLabel}`}
            </p>
          </div>

          <div className="relative mt-4">
            <Search
              className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-navy-800/40"
              aria-hidden
            />
            <input
              type="search"
              value={filters.query}
              onChange={(e) => set("query", e.target.value)}
              placeholder="Buscar: dúplex 250 70x100, antigrasa, couché 150, código 00743…"
              aria-label="Buscar productos"
              className="h-11 w-full rounded-xl border border-navy-800/15 bg-white pr-4 pl-10 text-[15px] text-navy-900 shadow-sm outline-none placeholder:text-navy-800/35 focus:border-forest-500 focus:ring-4 focus:ring-forest-500/15"
            />
          </div>

          <div className="mt-3 flex gap-1.5 overflow-x-auto pb-1" role="group" aria-label="Familia">
            {[{ id: "", name: "Todos" }, ...PRODUCT_FAMILIES].map((family) => {
              const active = filters.family === family.id;
              const count = family.id
                ? (facets.family.get(family.id) ?? 0)
                : [...facets.family.values()].reduce((a, b) => a + b, 0);
              return (
                <button
                  key={family.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => set("family", family.id as CatalogFilters["family"])}
                  className={cn(
                    "shrink-0 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
                    active
                      ? "border-navy-800 bg-navy-800 text-white"
                      : "border-navy-800/15 bg-white text-navy-800/75 hover:border-navy-800/35 hover:text-navy-900",
                  )}
                >
                  {family.name}
                  <span className={cn("ml-1.5 text-xs", active ? "text-white/60" : "text-navy-800/40")}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-2">
            <select aria-label="Marca" value={filters.brand} onChange={(e) => set("brand", e.target.value)} className={selectClass}>
              <option value="">Marca: todas</option>
              {sortedBrands.map((brand) => (
                <option key={brand} value={brand}>
                  {brand} ({facets.brand.get(brand)})
                </option>
              ))}
            </select>
            <select aria-label="Gramaje" value={filters.grammage} onChange={(e) => set("grammage", e.target.value)} className={selectClass}>
              <option value="">Gramaje: todos</option>
              {GRAMMAGE_RANGES.map((range) => (
                <option key={range.id} value={range.id}>
                  {range.label}
                </option>
              ))}
            </select>
            <select aria-label="Medida" value={filters.size} onChange={(e) => set("size", e.target.value)} className={selectClass}>
              <option value="">Medida: todas</option>
              {sortedSizes.map(([size, count]) => (
                <option key={size} value={size}>
                  {size} ({count})
                </option>
              ))}
            </select>
            <select aria-label="Uso" value={filters.tag} onChange={(e) => set("tag", e.target.value)} className={selectClass}>
              <option value="">Uso: todos</option>
              {tags
                .filter((tag) => facets.tag.has(tag.name) || tag.name === filters.tag)
                .map((tag) => (
                  <option key={tag.name} value={tag.name}>
                    {tag.name} ({facets.tag.get(tag.name) ?? 0})
                  </option>
                ))}
            </select>
            <label className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-lg px-2 text-sm text-navy-800/75">
              <input
                type="checkbox"
                checked={filters.onlyPriced}
                onChange={(e) => set("onlyPriced", e.target.checked)}
                className="size-4 accent-forest-500"
              />
              Solo con precio
            </label>
            {hasFilters && (
              <button
                type="button"
                onClick={() => setFilters(EMPTY_FILTERS)}
                className="inline-flex h-9 items-center gap-1 rounded-lg px-2 text-sm font-medium text-forest-700 hover:bg-forest-50"
              >
                <X className="size-3.5" aria-hidden />
                Limpiar filtros
              </button>
            )}
            <span className="ml-auto text-xs text-navy-800/50" aria-live="polite">
              {visible.length} {visible.length === 1 ? "resultado" : "resultados"}
            </span>
          </div>
          {selectedTag?.description && (
            <p className="mt-2 text-xs text-navy-800/60">
              <span className="font-semibold text-forest-700">{selectedTag.name}:</span>{" "}
              {selectedTag.description}
            </p>
          )}
        </div>
      </div>

      {/* Tabla y pedido */}
      <div className="mx-auto grid w-full max-w-[1600px] min-h-0 flex-1 gap-4 px-0 sm:px-6 xl:grid-cols-[minmax(0,1fr)_360px] xl:py-4">
        <div className="min-h-0 overflow-clip bg-paper-50 sm:rounded-xl sm:border sm:border-navy-800/10 xl:overflow-y-auto">
          {groups.length > 0 ? (
            <ProductTable groups={groups} cart={cart} />
          ) : (
            <div className="px-6 py-16 text-center">
              <p className="font-medium text-navy-900">No encontramos productos con esos filtros</p>
              <p className="mt-1 text-sm text-navy-800/55">
                Prueba con otra medida o gramaje, o escribe solo una palabra.
              </p>
              <button
                type="button"
                onClick={() => setFilters(EMPTY_FILTERS)}
                className="mt-4 rounded-lg border border-navy-800/15 bg-white px-4 py-2 text-sm font-medium text-navy-800 hover:border-navy-800/35"
              >
                Ver todo el catálogo
              </button>
            </div>
          )}
        </div>

        <aside className="hidden min-h-0 overflow-hidden rounded-xl border border-navy-800/10 bg-white xl:flex" aria-label="Pedido">
          <QuoteCart lines={lines} whatsappNumber={whatsappNumber} className="flex-1 overflow-y-auto" />
        </aside>
      </div>

      {/* Barra y hoja del pedido en móvil y tablet */}
      <div className="sticky bottom-0 z-30 border-t border-navy-800/10 bg-white/95 px-4 py-3 backdrop-blur xl:hidden">
        <button
          type="button"
          onClick={() => setCartOpen(true)}
          className="flex w-full items-center justify-between rounded-xl bg-navy-800 px-4 py-3 text-white"
        >
          <span className="flex items-center gap-2 text-sm font-semibold">
            <ClipboardList className="size-4" aria-hidden />
            Ver pedido {lines.length > 0 && `(${lines.length})`}
          </span>
          <span className="font-display font-semibold tabular-nums">{formatUsd(totals.total)}</span>
        </button>
      </div>
      {cartOpen && (
        <div className="fixed inset-0 z-[60] flex items-end bg-navy-950/40 xl:hidden" onClick={() => setCartOpen(false)}>
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Tu pedido"
            onClick={(e) => e.stopPropagation()}
            className="flex max-h-[90dvh] w-full flex-col overflow-hidden rounded-t-2xl bg-white"
          >
            <QuoteCart
              lines={lines}
              whatsappNumber={whatsappNumber}
              onClose={() => setCartOpen(false)}
              className="flex-1 overflow-y-auto"
            />
          </div>
        </div>
      )}
    </div>
  );
}
