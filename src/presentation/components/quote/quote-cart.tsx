"use client";

import { ClipboardList, MessageCircle, Trash2, X } from "lucide-react";
import { useState, type FormEvent } from "react";
import {
  buildQuoteMessage,
  calculateQuoteTotals,
  formatUsd,
  type QuoteLine,
} from "@/application/use-cases/build-quote-message";
import { buildWhatsAppQuoteUrl } from "@/application/use-cases/build-whatsapp-quote-url";
import { cn } from "../../lib/cn";
import { quoteCart } from "./quote-cart-store";

interface QuoteCartProps {
  lines: readonly QuoteLine[];
  whatsappNumber: string;
  onClose?: () => void;
  className?: string;
}

const inputClass =
  "h-10 w-full rounded-lg border border-navy-800/15 bg-white px-3 text-sm text-navy-900 outline-none placeholder:text-navy-800/35 focus:border-forest-500 focus:ring-2 focus:ring-forest-500/20";

export function QuoteCart({ lines, whatsappNumber, onClose, className }: QuoteCartProps) {
  const [nameError, setNameError] = useState(false);
  const totals = calculateQuoteTotals(lines);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const field = (key: string) => String(data.get(key) ?? "").trim();
    const name = field("name");
    if (!name) {
      setNameError(true);
      return;
    }
    const message = buildQuoteMessage(lines, {
      name,
      company: field("company"),
      taxId: field("taxId"),
      city: field("city"),
      notes: field("notes"),
    });
    window.open(buildWhatsAppQuoteUrl(whatsappNumber, message), "_blank", "noopener,noreferrer");
  }

  return (
    <div className={cn("flex min-h-0 flex-col", className)}>
      <div className="flex items-center gap-2 border-b border-navy-800/10 px-5 py-4">
        <ClipboardList className="size-5 text-forest-600" aria-hidden />
        <h2 className="font-display text-lg font-semibold text-navy-900">Tu pedido</h2>
        {lines.length > 0 && (
          <span className="rounded-full bg-navy-800 px-2 py-0.5 text-xs font-semibold text-white">
            {lines.length}
          </span>
        )}
        <div className="ml-auto flex items-center gap-1">
          {lines.length > 0 && (
            <button
              type="button"
              onClick={() => quoteCart.clear()}
              className="rounded-lg px-2 py-1 text-xs font-medium text-navy-800/50 hover:bg-navy-800/5 hover:text-navy-800"
            >
              Vaciar
            </button>
          )}
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar pedido"
              className="grid size-8 place-items-center rounded-lg text-navy-800/60 hover:bg-navy-800/5"
            >
              <X className="size-4" aria-hidden />
            </button>
          )}
        </div>
      </div>

      {lines.length === 0 ? (
        <div className="px-5 py-10 text-center">
          <p className="text-sm font-medium text-navy-900">Arma tu pedido desde la tabla</p>
          <p className="mt-1 text-sm text-navy-800/55">
            Escribe cuántos paquetes necesitas de cada producto. Un asesor confirma
            precios y disponibilidad por WhatsApp.
          </p>
        </div>
      ) : (
        <>
          <ul className="divide-y divide-navy-800/8 px-5">
            {lines.map(({ product, packs }) => (
              <li key={product.code} className="flex gap-3 py-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm leading-snug font-medium text-navy-900">
                    {product.description}
                  </p>
                  <p className="mt-0.5 text-xs text-navy-800/55 tabular-nums">
                    {packs} paq
                    {product.sheetsPerPack &&
                      ` · ${(product.sheetsPerPack * packs).toLocaleString("es-EC")} pliegos`}
                  </p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <span className="text-sm font-semibold text-navy-900 tabular-nums">
                    {product.pricePerPack === null
                      ? "Consultar"
                      : formatUsd(product.pricePerPack * packs)}
                  </span>
                  <button
                    type="button"
                    onClick={() => quoteCart.setPacks(product.code, 0)}
                    aria-label={`Quitar ${product.description}`}
                    className="text-navy-800/35 hover:text-red-600"
                  >
                    <Trash2 className="size-3.5" aria-hidden />
                  </button>
                </div>
              </li>
            ))}
          </ul>

          <div className="space-y-1 border-t border-navy-800/10 bg-paper-100 px-5 py-3 text-sm tabular-nums">
            <div className="flex justify-between text-navy-800/60">
              <span>Total pliegos</span>
              <span>{totals.sheets.toLocaleString("es-EC")}</span>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="font-medium text-navy-900">Total</span>
              <span className="font-display text-xl font-semibold text-navy-900">
                {formatUsd(totals.total)}
              </span>
            </div>
            {totals.pendingItems > 0 && (
              <p className="text-xs text-navy-800/55">
                + {totals.pendingItems} {totals.pendingItems === 1 ? "producto" : "productos"} a
                consultar con el asesor.
              </p>
            )}
          </div>

          <form onSubmit={handleSubmit} noValidate className="space-y-2.5 border-t border-navy-800/10 px-5 py-4">
            <div>
              <label htmlFor="quote-name" className="sr-only">
                Nombre
              </label>
              <input
                id="quote-name"
                name="name"
                autoComplete="name"
                placeholder="Tu nombre *"
                aria-invalid={nameError}
                aria-describedby={nameError ? "quote-name-error" : undefined}
                onChange={() => setNameError(false)}
                className={cn(inputClass, nameError && "border-red-500 focus:border-red-500 focus:ring-red-500/20")}
              />
              {nameError && (
                <p id="quote-name-error" className="mt-1 text-xs text-red-600">
                  Escribe tu nombre para que el asesor sepa quién pide.
                </p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              <input name="company" autoComplete="organization" placeholder="Empresa" aria-label="Empresa" className={inputClass} />
              <input name="taxId" placeholder="RUC o cédula" aria-label="RUC o cédula" className={inputClass} />
            </div>
            <input name="city" autoComplete="address-level2" placeholder="Ciudad de entrega" aria-label="Ciudad de entrega" className={inputClass} />
            <textarea
              name="notes"
              rows={2}
              placeholder="Notas: corte, fecha de entrega, retiro en bodega…"
              aria-label="Notas"
              className={cn(inputClass, "h-auto resize-none py-2")}
            />
            <button
              type="submit"
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-forest-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-forest-500/25 transition-all hover:-translate-y-0.5 hover:bg-forest-600"
            >
              <MessageCircle className="size-4" aria-hidden />
              Enviar pedido por WhatsApp
            </button>
            <p className="text-center text-[11px] text-navy-800/45">
              Precios finales en USD. Un asesor confirma la disponibilidad.
            </p>
          </form>
        </>
      )}
    </div>
  );
}
