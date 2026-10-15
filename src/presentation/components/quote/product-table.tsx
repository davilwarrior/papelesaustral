"use client";

import { Minus, Plus } from "lucide-react";
import { formatUsd } from "@/application/use-cases/build-quote-message";
import type { Product } from "@/domain/entities/product";
import { cn } from "../../lib/cn";
import { quoteCart, type QuoteCart } from "./quote-cart-store";

export interface ProductGroup {
  readonly lineName: string;
  readonly familyName: string;
  readonly products: readonly Product[];
}

interface ProductTableProps {
  groups: readonly ProductGroup[];
  cart: QuoteCart;
}

function formatNumber(value: number | null, suffix = ""): string {
  return value === null ? "—" : `${value.toLocaleString("es-EC")}${suffix}`;
}

function pricePerSheet(product: Product): string | null {
  if (product.pricePerPack === null || !product.sheetsPerPack) return null;
  return `$${(product.pricePerPack / product.sheetsPerPack).toFixed(3)} / pliego`;
}

function PacksInput({ product, packs }: { product: Product; packs: number }) {
  return (
    <div className="inline-flex items-center rounded-lg border border-navy-800/15 bg-white focus-within:border-forest-500 focus-within:ring-2 focus-within:ring-forest-500/20">
      <button
        type="button"
        onClick={() => quoteCart.setPacks(product.code, packs - 1)}
        aria-label={`Quitar un paquete de ${product.description}`}
        className="grid size-8 place-items-center text-navy-800/50 hover:text-navy-800 disabled:opacity-30"
        disabled={packs === 0}
      >
        <Minus className="size-3.5" aria-hidden />
      </button>
      <input
        type="number"
        inputMode="numeric"
        min={0}
        step={1}
        value={packs || ""}
        placeholder="0"
        onChange={(e) => quoteCart.setPacks(product.code, Number(e.target.value))}
        onFocus={(e) => e.target.select()}
        aria-label={`Paquetes de ${product.description}`}
        className="h-8 w-11 [appearance:textfield] bg-transparent text-center text-sm font-semibold text-navy-900 tabular-nums outline-none placeholder:font-normal placeholder:text-navy-800/30 [&::-webkit-inner-spin-button]:appearance-none"
      />
      <button
        type="button"
        onClick={() => quoteCart.setPacks(product.code, packs + 1)}
        aria-label={`Agregar un paquete de ${product.description}`}
        className="grid size-8 place-items-center text-navy-800/50 hover:text-forest-600"
      >
        <Plus className="size-3.5" aria-hidden />
      </button>
    </div>
  );
}

function Price({ product }: { product: Product }) {
  if (product.pricePerPack === null) {
    return <span className="text-sm text-navy-800/45">Consultar</span>;
  }
  return (
    <span className="font-semibold text-navy-900">{formatUsd(product.pricePerPack)}</span>
  );
}

function Tags({ product }: { product: Product }) {
  if (product.tags.length === 0) return null;
  return (
    <span className="mt-1 flex flex-wrap gap-1">
      {product.tags.map((tag) => (
        <span
          key={tag}
          className="rounded bg-forest-50 px-1.5 py-px text-[11px] font-medium text-forest-700"
        >
          {tag}
        </span>
      ))}
    </span>
  );
}

const th = "px-3 py-2.5 text-left text-[11px] font-semibold tracking-wider text-navy-800/55 uppercase";

/** Tabla densa en escritorio, tarjetas compactas en móvil. */
export function ProductTable({ groups, cart }: ProductTableProps) {
  return (
    <>
      <table className="hidden w-full border-separate border-spacing-0 text-sm tabular-nums md:table">
        <thead className="sticky top-18 z-10 bg-paper-50 xl:top-0">
          <tr>
            <th className={cn(th, "w-20 border-b border-navy-800/10")}>Código</th>
            <th className={cn(th, "border-b border-navy-800/10")}>Producto</th>
            <th className={cn(th, "w-20 border-b border-navy-800/10 text-right")}>Gramaje</th>
            <th className={cn(th, "w-20 border-b border-navy-800/10")}>Medida</th>
            <th className={cn(th, "w-18 border-b border-navy-800/10 text-right")}>Calibre</th>
            <th className={cn(th, "w-22 border-b border-navy-800/10 text-right")}>Pliegos/paq</th>
            <th className={cn(th, "w-28 border-b border-navy-800/10 text-right")}>Precio/paq</th>
            <th className={cn(th, "w-32 border-b border-navy-800/10 text-center")}>Paquetes</th>
          </tr>
        </thead>
        {groups.map((group) => (
          <tbody key={group.lineName}>
            <tr>
              <th
                colSpan={8}
                scope="colgroup"
                className="border-b border-navy-800/10 bg-navy-800/[0.04] px-3 py-1.5 text-left text-xs font-semibold text-navy-800"
              >
                {group.lineName}
                <span className="ml-2 font-normal text-navy-800/45">
                  {group.familyName} · {group.products.length}
                </span>
              </th>
            </tr>
            {group.products.map((product) => {
              const packs = cart[product.code] ?? 0;
              return (
                <tr
                  key={product.code}
                  className={cn(
                    "transition-colors hover:bg-white",
                    packs > 0 && "bg-forest-50/70 hover:bg-forest-50",
                  )}
                >
                  <td className="border-b border-navy-800/6 px-3 py-2 font-mono text-xs text-navy-800/55">
                    {product.code}
                  </td>
                  <td className="border-b border-navy-800/6 px-3 py-2">
                    <span className="block font-medium text-navy-900">{product.description}</span>
                    {product.brand && (
                      <span className="text-xs text-navy-800/50">{product.brand}</span>
                    )}
                    <Tags product={product} />
                  </td>
                  <td className="border-b border-navy-800/6 px-3 py-2 text-right text-navy-800">
                    {formatNumber(product.grammage, " g")}
                  </td>
                  <td className="border-b border-navy-800/6 px-3 py-2 text-navy-800">
                    {product.size ?? "—"}
                  </td>
                  <td className="border-b border-navy-800/6 px-3 py-2 text-right text-navy-800">
                    {product.caliper ?? (product.thicknessMm ? `${product.thicknessMm} mm` : "—")}
                  </td>
                  <td className="border-b border-navy-800/6 px-3 py-2 text-right text-navy-800">
                    {formatNumber(product.sheetsPerPack)}
                  </td>
                  <td className="border-b border-navy-800/6 px-3 py-2 text-right">
                    <Price product={product} />
                    {pricePerSheet(product) && (
                      <span className="block text-[11px] text-navy-800/45">
                        {pricePerSheet(product)}
                      </span>
                    )}
                  </td>
                  <td className="border-b border-navy-800/6 px-3 py-1.5 text-center">
                    <PacksInput product={product} packs={packs} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        ))}
      </table>

      <div className="divide-y divide-navy-800/8 md:hidden">
        {groups.map((group) => (
          <section key={group.lineName}>
            <h3 className="sticky top-18 z-10 bg-paper-200/95 px-4 py-2 text-xs font-semibold text-navy-800 backdrop-blur">
              {group.lineName}
              <span className="ml-2 font-normal text-navy-800/45">{group.products.length}</span>
            </h3>
            <ul className="divide-y divide-navy-800/6">
              {group.products.map((product) => {
                const packs = cart[product.code] ?? 0;
                const specs = [
                  product.grammage && `${product.grammage} g`,
                  product.size,
                  product.caliper && `cal. ${product.caliper}`,
                  product.thicknessMm && `${product.thicknessMm} mm`,
                  product.sheetsPerPack && `${product.sheetsPerPack} pliegos/paq`,
                ].filter(Boolean);
                return (
                  <li
                    key={product.code}
                    className={cn("flex gap-3 px-4 py-3", packs > 0 && "bg-forest-50/70")}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-navy-900">{product.description}</p>
                      <p className="mt-0.5 text-xs text-navy-800/55">
                        <span className="font-mono">{product.code}</span> · {specs.join(" · ")}
                      </p>
                      <Tags product={product} />
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-2">
                      <Price product={product} />
                      <PacksInput product={product} packs={packs} />
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>
    </>
  );
}
