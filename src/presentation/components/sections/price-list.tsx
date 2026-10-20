import { ArrowRight, CalendarCheck, Info, Layers, Printer } from "lucide-react";
import Link from "next/link";
import {
  PRICE_LIST_DOWNLOADS,
  PRICE_LIST_NOTICE_SHORT,
} from "../catalog/price-list-links";
import { Container } from "../ui/container";
import { Reveal } from "../ui/reveal";

interface PriceListProps {
  productCount: number;
  updatedAtLabel: string | null;
}

/** Descarga de la lista de precios para quienes prefieren revisarla impresa. */
export function PriceList({ productCount, updatedAtLabel }: PriceListProps) {
  return (
    <section id="lista-de-precios" className="scroll-mt-20 pb-20 sm:pb-28">
      <Container>
        <Reveal>
          <div className="relative overflow-hidden rounded-3xl bg-navy-800 px-6 py-10 shadow-2xl shadow-navy-950/20 sm:px-10 sm:py-12 lg:px-14">
            <div aria-hidden className="texture-grain absolute inset-0" />
            <div
              aria-hidden
              className="absolute -right-24 -bottom-24 size-[26rem] rounded-full bg-forest-500/20 blur-3xl"
            />

            <div className="relative grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
              <div>
                <p className="inline-flex items-center gap-2 text-xs font-bold tracking-[0.2em] text-forest-300 uppercase">
                  <Printer className="size-4" aria-hidden />
                  Lista de precios
                </p>
                <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-balance text-white sm:text-4xl">
                  ¿Prefieres revisarlo en papel?
                </h2>
                <p className="mt-4 max-w-xl text-base leading-relaxed text-pretty text-navy-100/80 sm:text-lg">
                  Descarga el catálogo completo con los precios por paquete actualizados.
                  Imprímelo, revísalo con calma y haz tu pedido cuando estés listo.
                </p>

                <ul className="mt-6 flex flex-wrap gap-3 text-sm text-white">
                  <li className="inline-flex items-center gap-2 rounded-full bg-white/8 px-3.5 py-1.5 ring-1 ring-white/12">
                    <Layers className="size-4 text-forest-300" aria-hidden />
                    {productCount} productos
                  </li>
                  {updatedAtLabel && (
                    <li className="inline-flex items-center gap-2 rounded-full bg-white/8 px-3.5 py-1.5 ring-1 ring-white/12">
                      <CalendarCheck className="size-4 text-forest-300" aria-hidden />
                      Actualizada al {updatedAtLabel}
                    </li>
                  )}
                </ul>

                <Link
                  href="/cotizador"
                  className="mt-7 inline-flex items-center gap-1.5 text-sm font-semibold text-forest-300 hover:text-white"
                >
                  ¿Prefieres buscar en línea? Abre el cotizador
                  <ArrowRight className="size-4" aria-hidden />
                </Link>
              </div>

              <div className="space-y-3">
                {PRICE_LIST_DOWNLOADS.map((item, index) => (
                  <a
                    key={item.id}
                    href={item.href}
                    {...(item.newTab ? { target: "_blank", rel: "noopener" } : { download: true })}
                    className={
                      index === 0
                        ? "group flex items-center gap-4 rounded-2xl bg-white p-5 text-navy-900 shadow-xl shadow-navy-950/30 transition-all hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest-300"
                        : "group flex items-center gap-4 rounded-2xl bg-white/6 p-5 text-white ring-1 ring-white/15 transition-all hover:-translate-y-0.5 hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest-300"
                    }
                  >
                    <span
                      className={
                        index === 0
                          ? "grid size-12 shrink-0 place-items-center rounded-xl bg-forest-500 text-white"
                          : "grid size-12 shrink-0 place-items-center rounded-xl bg-white/10 text-forest-300"
                      }
                    >
                      <item.icon className="size-6" aria-hidden />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-base font-semibold">
                        Descargar {item.title}
                      </span>
                      <span
                        className={
                          index === 0
                            ? "block text-sm text-navy-800/65"
                            : "block text-sm text-navy-100/70"
                        }
                      >
                        {item.description}
                      </span>
                    </span>
                    <ArrowRight
                      className="size-5 shrink-0 opacity-60 transition-transform group-hover:translate-x-0.5"
                      aria-hidden
                    />
                  </a>
                ))}

                <p className="flex gap-2.5 rounded-xl bg-navy-950/40 px-4 py-3 text-sm leading-relaxed text-navy-100/75">
                  <Info className="mt-0.5 size-4 shrink-0 text-forest-300" aria-hidden />
                  {PRICE_LIST_NOTICE_SHORT}
                </p>
              </div>
            </div>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
