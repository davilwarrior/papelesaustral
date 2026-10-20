"use client";

import { ChevronDown, Download } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { cn } from "../../lib/cn";
import { PRICE_LIST_DOWNLOADS, PRICE_LIST_NOTICE_SHORT } from "./price-list-links";

interface PriceListDownloadMenuProps {
  className?: string;
}

/** Botón compacto con menú de formatos, para la barra del cotizador. */
export function PriceListDownloadMenu({ className }: PriceListDownloadMenuProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const panelId = useId();

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-controls={panelId}
        className="inline-flex h-10 items-center gap-2 rounded-lg border border-navy-800/15 bg-white px-3.5 text-sm font-semibold text-navy-800 shadow-sm transition-colors hover:border-navy-800/35 hover:bg-paper-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest-500"
      >
        <Download className="size-4 text-forest-600" aria-hidden />
        Descargar lista de precios
        <ChevronDown
          className={cn("size-4 text-navy-800/50 transition-transform", open && "rotate-180")}
          aria-hidden
        />
      </button>

      {open && (
        <div
          id={panelId}
          className="absolute left-0 z-40 mt-2 w-[min(22rem,calc(100vw-2rem))] sm:right-0 sm:left-auto overflow-hidden rounded-xl border border-navy-800/10 bg-white shadow-xl shadow-navy-950/10"
        >
          <ul className="p-1.5">
            {PRICE_LIST_DOWNLOADS.map((item) => (
              <li key={item.id}>
                <a
                  href={item.href}
                  {...(item.newTab ? { target: "_blank", rel: "noopener" } : { download: true })}
                  onClick={() => setOpen(false)}
                  className="flex items-start gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-forest-50 focus-visible:bg-forest-50 focus-visible:outline-none"
                >
                  <span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-lg bg-navy-800 text-forest-300">
                    <item.icon className="size-4.5" aria-hidden />
                  </span>
                  <span>
                    <span className="block text-sm font-semibold text-navy-900">{item.title}</span>
                    <span className="block text-xs leading-relaxed text-navy-800/60">
                      {item.description}
                    </span>
                  </span>
                </a>
              </li>
            ))}
          </ul>
          <p className="border-t border-navy-800/8 bg-paper-100 px-4 py-2.5 text-[11px] leading-relaxed text-navy-800/60">
            {PRICE_LIST_NOTICE_SHORT}
          </p>
        </div>
      )}
    </div>
  );
}
