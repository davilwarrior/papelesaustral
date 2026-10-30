"use client";

import { ArrowUpRight } from "lucide-react";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { PRODUCT_FAMILIES } from "@/domain/entities/product";
import type { ProductShowcaseEntry } from "@/domain/entities/product-showcase";
import { cn } from "../../lib/cn";
import { Container } from "../ui/container";
import { formatGrammages, ProductDetailDialog } from "./product-detail-dialog";

interface ProductGalleryProps {
  entries: readonly ProductShowcaseEntry[];
  whatsappNumber: string;
}

const familyNames = new Map<string, string>(PRODUCT_FAMILIES.map((f) => [f.id, f.name]));

export function ProductGallery({ entries, whatsappNumber }: ProductGalleryProps) {
  const [family, setFamily] = useState("");
  const [openSlug, setOpenSlug] = useState<string | null>(null);

  const visible = useMemo(
    () => (family ? entries.filter((e) => e.familyId === family) : entries),
    [entries, family],
  );

  // Enlaces compartibles: /productos#papel-kraft abre esa ficha.
  useEffect(() => {
    const fromHash = () => {
      const slug = decodeURIComponent(window.location.hash.slice(1));
      setOpenSlug(entries.some((e) => e.slug === slug) ? slug : null);
    };
    fromHash();
    window.addEventListener("hashchange", fromHash);
    return () => window.removeEventListener("hashchange", fromHash);
  }, [entries]);

  const open = (slug: string | null) => {
    setOpenSlug(slug);
    const url = slug ? `#${slug}` : window.location.pathname + window.location.search;
    window.history.replaceState(null, "", url);
  };

  const openIndex = visible.findIndex((e) => e.slug === openSlug);
  const openEntry = entries.find((e) => e.slug === openSlug) ?? null;
  const step = (delta: number) => {
    if (openIndex === -1) return;
    open(visible[(openIndex + delta + visible.length) % visible.length].slug);
  };

  return (
    <section id="galeria" className="scroll-mt-18 pb-20 sm:pb-28">
      {/* Filtro por familia */}
      <div className="sticky top-18 z-30 border-y border-navy-800/8 bg-paper-100/85 backdrop-blur-xl">
        <Container>
          <div
            role="tablist"
            aria-label="Filtrar por familia"
            className="-mx-5 flex gap-2 overflow-x-auto px-5 py-3 [scrollbar-width:none] sm:mx-0 sm:px-0"
          >
            {[{ id: "", name: "Todos" }, ...PRODUCT_FAMILIES].map((f) => {
              const active = family === f.id;
              const count = f.id ? entries.filter((e) => e.familyId === f.id).length : entries.length;
              return (
                <button
                  key={f.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setFamily(f.id)}
                  className={cn(
                    "inline-flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-all duration-200",
                    active
                      ? "bg-navy-800 text-white shadow-lg shadow-navy-800/20"
                      : "bg-white text-navy-800/70 ring-1 ring-navy-800/10 hover:text-navy-800 hover:ring-navy-800/25",
                  )}
                >
                  {f.name}
                  <span
                    className={cn(
                      "rounded-full px-1.5 text-xs tabular-nums",
                      active ? "bg-white/15 text-white" : "bg-paper-200 text-navy-800/60",
                    )}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </Container>
      </div>

      <Container>
        {/* La key reinicia la animación de entrada al cambiar de familia */}
        <ul key={family} className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8">
          {visible.map((entry, index) => (
            <li
              key={entry.slug}
              className="animate-fade-up"
              style={{ animationDelay: `${Math.min(index, 8) * 60}ms` }}
            >
              <ProductCard entry={entry} onOpen={() => open(entry.slug)} />
            </li>
          ))}
        </ul>
      </Container>

      <ProductDetailDialog
        entry={openEntry}
        familyName={openEntry ? (familyNames.get(openEntry.familyId) ?? "") : ""}
        position={openIndex === -1 ? null : { index: openIndex, total: visible.length }}
        whatsappNumber={whatsappNumber}
        onClose={() => open(null)}
        onStep={step}
      />
    </section>
  );
}

function ProductCard({ entry, onOpen }: { entry: ProductShowcaseEntry; onOpen: () => void }) {
  const grammages = formatGrammages(entry.grammages);

  return (
    <button
      type="button"
      onClick={onOpen}
      className="group flex h-full w-full flex-col overflow-hidden rounded-3xl border border-navy-800/8 bg-white text-left shadow-sm shadow-navy-950/5 transition-all duration-500 ease-out hover:-translate-y-1.5 hover:border-navy-800/15 hover:shadow-2xl hover:shadow-navy-950/10 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-forest-500"
    >
      <div className="relative aspect-[3/2] overflow-hidden bg-[#f2f0eb]">
        <Image
          src={entry.image}
          alt={entry.name}
          fill
          sizes="(min-width: 1280px) 400px, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
          className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.06]"
        />
        <span className="absolute top-4 left-4 rounded-full bg-white/85 px-3 py-1 text-[0.7rem] font-semibold tracking-wide text-navy-800 shadow-sm backdrop-blur">
          {familyNames.get(entry.familyId)}
        </span>
        <span
          aria-hidden
          className="absolute right-4 bottom-4 inline-flex size-10 translate-y-2 items-center justify-center rounded-full bg-navy-800 text-white opacity-0 shadow-lg transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100"
        >
          <ArrowUpRight className="size-5" />
        </span>
      </div>

      <div className="flex flex-1 flex-col p-6">
        <p className="text-xs font-bold tracking-[0.14em] text-forest-600 uppercase">
          {entry.highlight}
        </p>
        <h3 className="mt-2 font-display text-xl font-bold tracking-tight text-navy-800">
          {entry.name}
        </h3>
        <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-navy-800/65">
          {entry.summary}
        </p>

        {(grammages || entry.sizes.length > 0) && (
          <ul className="mt-auto flex flex-wrap gap-2 pt-5 text-xs font-medium text-navy-800/70">
            {grammages && (
              <li className="rounded-full bg-paper-100 px-3 py-1 ring-1 ring-navy-800/8">
                {grammages}
              </li>
            )}
            {entry.sizes.length > 0 && (
              <li className="rounded-full bg-paper-100 px-3 py-1 ring-1 ring-navy-800/8">
                {entry.sizes.length === 1 ? entry.sizes[0] : `${entry.sizes.length} medidas`}
              </li>
            )}
          </ul>
        )}
      </div>
    </button>
  );
}
