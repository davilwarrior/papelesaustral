"use client";

import { Check, ChevronLeft, ChevronRight, MessageCircle, Search, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, type ReactNode } from "react";
import { buildWhatsAppQuoteUrl } from "@/application/use-cases/build-whatsapp-quote-url";
import type { ProductShowcaseEntry } from "@/domain/entities/product-showcase";

/** "75 g", "75 – 300 g" o null si la línea no maneja gramaje. */
export function formatGrammages(grammages: readonly number[]): string | null {
  if (grammages.length === 0) return null;
  const min = grammages[0];
  const max = grammages[grammages.length - 1];
  return min === max ? `${min} g` : `${min} – ${max} g`;
}

const MAX_SIZES = 8;

interface ProductDetailDialogProps {
  entry: ProductShowcaseEntry | null;
  familyName: string;
  /** Posición dentro de la lista filtrada, para navegar entre fichas. */
  position: { index: number; total: number } | null;
  whatsappNumber: string;
  onClose: () => void;
  onStep: (delta: number) => void;
}

export function ProductDetailDialog({
  entry,
  familyName,
  position,
  whatsappNumber,
  onClose,
  onStep,
}: ProductDetailDialogProps) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (entry && !dialog.open) dialog.showModal();
    if (!entry && dialog.open) dialog.close();
  }, [entry]);

  const canStep = position !== null && position.total > 1;

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(event) => event.target === event.currentTarget && onClose()}
      onKeyDown={(event) => {
        if (!canStep) return;
        if (event.key === "ArrowRight") onStep(1);
        if (event.key === "ArrowLeft") onStep(-1);
      }}
      aria-labelledby="product-detail-title"
      className="product-dialog m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-6xl overflow-hidden rounded-3xl bg-white p-0 text-navy-900 shadow-2xl shadow-navy-950/30 backdrop:bg-navy-950/60 backdrop:backdrop-blur-sm"
    >
      {entry && (
        <div
          key={entry.slug}
          className="grid max-h-[calc(100dvh-2rem)] overflow-y-auto lg:grid-cols-[1.35fr_1fr]"
        >
          {/* La foto completa en 3:2, enmarcada como lámina de catálogo */}
          <div className="flex flex-col justify-center bg-paper-100 p-3 sm:p-5 lg:p-7">
            <div className="relative aspect-[3/2] w-full overflow-hidden rounded-2xl bg-[#f2f0eb] shadow-xl shadow-navy-950/10 ring-1 ring-navy-800/5">
              <Image
                src={entry.image}
                alt={entry.name}
                fill
                preload
                sizes="(min-width: 1152px) 620px, (min-width: 1024px) 55vw, 100vw"
                className="product-dialog-image object-cover"
              />
            </div>
            {canStep && (
              <div className="mt-3 flex items-center justify-between gap-2 sm:mt-5">
                <span className="text-xs font-semibold text-navy-800/50 tabular-nums">
                  {position.index + 1} / {position.total}
                </span>
                <div className="flex gap-2">
                  <StepButton label="Producto anterior" onClick={() => onStep(-1)}>
                    <ChevronLeft className="size-5" />
                  </StepButton>
                  <StepButton label="Producto siguiente" onClick={() => onStep(1)}>
                    <ChevronRight className="size-5" />
                  </StepButton>
                </div>
              </div>
            )}
          </div>

          <div className="product-dialog-body flex flex-col p-6 sm:p-8 lg:p-10">
            <div className="flex items-start justify-between gap-4">
              <p className="text-xs font-bold tracking-[0.18em] text-forest-600 uppercase">
                {familyName}
              </p>
              <button
                type="button"
                onClick={onClose}
                aria-label="Cerrar"
                className="-mt-2 -mr-2 inline-flex size-10 shrink-0 items-center justify-center rounded-full text-navy-800/60 transition-colors hover:bg-navy-800/5 hover:text-navy-800"
              >
                <X className="size-5" />
              </button>
            </div>

            <h2
              id="product-detail-title"
              className="mt-1 font-display text-3xl font-bold tracking-tight text-balance text-navy-800"
            >
              {entry.name}
            </h2>
            <p className="mt-2 text-sm font-semibold text-forest-600">{entry.highlight}</p>
            <p className="mt-4 leading-relaxed text-pretty text-navy-800/70">{entry.summary}</p>

            <h3 className="mt-7 text-xs font-bold tracking-[0.14em] text-navy-800/50 uppercase">
              Ideal para
            </h3>
            <ul className="mt-3 space-y-2">
              {entry.uses.map((use) => (
                <li key={use} className="flex items-center gap-2.5 text-sm text-navy-800/80">
                  <span className="inline-flex size-5 items-center justify-center rounded-full bg-forest-50 text-forest-600">
                    <Check className="size-3.5" aria-hidden />
                  </span>
                  {use}
                </li>
              ))}
            </ul>

            <Availability entry={entry} />

            <div className="mt-auto flex flex-wrap gap-3 pt-8">
              <Link
                href={buildWhatsAppQuoteUrl(
                  whatsappNumber,
                  `Hola, me interesa ${entry.name.toLowerCase()}. ¿Me pueden ayudar con una cotización?`,
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex grow items-center justify-center gap-2 rounded-full whitespace-nowrap bg-forest-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-forest-500/25 transition-all hover:-translate-y-0.5 hover:bg-forest-600"
              >
                <MessageCircle className="size-4" aria-hidden />
                Cotizar por WhatsApp
              </Link>
              {entry.variantCount > 0 && (
                <Link
                  href={`/cotizador?q=${encodeURIComponent(entry.name)}`}
                  className="inline-flex grow items-center justify-center gap-2 rounded-full whitespace-nowrap border-2 border-navy-800/15 px-5 py-3 text-sm font-semibold text-navy-800 transition-all hover:-translate-y-0.5 hover:border-navy-800/40"
                >
                  <Search className="size-4" aria-hidden />
                  Ver precios
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </dialog>
  );
}

function Availability({ entry }: { entry: ProductShowcaseEntry }) {
  const grammages = formatGrammages(entry.grammages);
  if (entry.variantCount === 0) return null;

  const sizes = entry.sizes.slice(0, MAX_SIZES);
  const hiddenSizes = entry.sizes.length - sizes.length;

  return (
    <dl className="mt-7 grid grid-cols-2 gap-px overflow-hidden rounded-2xl bg-navy-800/8 ring-1 ring-navy-800/8">
      <div className="bg-paper-50 p-4">
        <dt className="text-xs text-navy-800/55">Presentaciones</dt>
        <dd className="mt-1 font-display text-lg font-bold text-navy-800 tabular-nums">
          {entry.variantCount}
        </dd>
      </div>
      <div className="bg-paper-50 p-4">
        <dt className="text-xs text-navy-800/55">Gramaje</dt>
        <dd className="mt-1 font-display text-lg font-bold text-navy-800 tabular-nums">
          {grammages ?? "—"}
        </dd>
      </div>
      {sizes.length > 0 && (
        <div className="col-span-2 bg-paper-50 p-4">
          <dt className="text-xs text-navy-800/55">Medidas disponibles</dt>
          <dd className="mt-2 flex flex-wrap gap-1.5">
            {sizes.map((size) => (
              <span
                key={size}
                className="rounded-md bg-white px-2 py-0.5 text-xs font-medium text-navy-800/80 ring-1 ring-navy-800/10"
              >
                {size}
              </span>
            ))}
            {hiddenSizes > 0 && (
              <span className="px-1 py-0.5 text-xs font-medium text-navy-800/50">
                +{hiddenSizes} más
              </span>
            )}
          </dd>
        </div>
      )}
    </dl>
  );
}

function StepButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="inline-flex size-10 items-center justify-center rounded-full bg-white text-navy-800 shadow-md shadow-navy-950/10 ring-1 ring-navy-800/8 transition-all hover:scale-105 hover:ring-navy-800/20"
    >
      {children}
    </button>
  );
}
