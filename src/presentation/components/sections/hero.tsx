import { ArrowRight, BadgeCheck, MessageCircle, Truck, FileDown } from "lucide-react";
import Image from "next/image";
import type { SiteConfig } from "@/domain/entities/site-config";
import { buildWhatsAppQuoteUrl } from "@/application/use-cases/build-whatsapp-quote-url";
import { ButtonLink } from "../ui/button";
import { Container } from "../ui/container";

interface HeroProps {
  site: SiteConfig;
}

export function Hero({ site }: HeroProps) {
  const whatsappUrl = buildWhatsAppQuoteUrl(site.contact.whatsappNumber);

  return (
    <section className="texture-grain relative overflow-hidden bg-navy-900">
      {/* Resplandores de acento */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 right-[-10%] size-[34rem] rounded-full bg-forest-500/20 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-[-30%] left-[-10%] size-[30rem] rounded-full bg-navy-500/30 blur-3xl"
      />

      <Container className="relative grid items-center gap-14 pt-32 pb-20 sm:pt-36 lg:grid-cols-[1.05fr_0.95fr] lg:gap-10 lg:pt-40 lg:pb-28">
        <div>
          <p className="animate-fade-up inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-xs font-semibold tracking-wide text-navy-100 backdrop-blur">
            <span className="size-1.5 rounded-full bg-forest-300" />
            Papeles · Cartulinas · Cartones · Especializados
          </p>

          <h1
            className="animate-fade-up mt-6 font-display text-4xl font-bold tracking-tight text-balance text-white sm:text-5xl lg:text-[3.6rem] lg:leading-[1.05]"
            style={{ animationDelay: "120ms" }}
          >
            El material correcto,{" "}
            <span className="text-forest-300">cuando lo necesitas.</span>
          </h1>

          <p
            className="animate-fade-up mt-6 max-w-xl text-lg leading-relaxed text-pretty text-navy-100/80"
            style={{ animationDelay: "240ms" }}
          >
            Ayudamos a imprentas, diseñadores, editoriales y empresas de
            packaging a encontrar rápidamente el material adecuado para cada
            trabajo, con disponibilidad, variedad y asesoría técnica en un
            solo proveedor.
          </p>

          <div
            className="animate-fade-up mt-9 flex flex-wrap items-center gap-4"
            style={{ animationDelay: "360ms" }}
          >
            <ButtonLink
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              size="lg"
            >
              <MessageCircle className="size-5" aria-hidden />
              Cotizar por WhatsApp
            </ButtonLink>
            <ButtonLink href="#productos" variant="ghost-light" size="lg">
              Ver productos
              <ArrowRight className="size-5" aria-hidden />
            </ButtonLink>
          </div>

          <a
            href="/lista-de-precios.pdf"
            target="_blank"
            rel="noopener"
            className="animate-fade-up mt-5 inline-flex items-center gap-2 text-sm font-semibold text-navy-100/80 underline decoration-white/25 underline-offset-4 transition-colors hover:text-white hover:decoration-white"
            style={{ animationDelay: "420ms" }}
          >
            <FileDown className="size-4 text-forest-300" aria-hidden />
            Descargar lista de precios en PDF
          </a>

          <dl
            className="animate-fade-up mt-12 flex flex-wrap gap-x-10 gap-y-6"
            style={{ animationDelay: "480ms" }}
          >
            {[
              { icon: BadgeCheck, label: "Disponibilidad real", sub: "Stock confirmado al cotizar" },
              { icon: Truck, label: "Entregas ágiles", sub: "Cobertura en el Austro" },
            ].map((item) => (
              <div key={item.label} className="flex items-start gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white/8 text-forest-300 ring-1 ring-white/10">
                  <item.icon className="size-5" aria-hidden />
                </span>
                <div>
                  <dt className="text-sm font-semibold text-white">
                    {item.label}
                  </dt>
                  <dd className="mt-0.5 text-xs text-navy-100/60">
                    {item.sub}
                  </dd>
                </div>
              </div>
            ))}
          </dl>
        </div>

        <div className="animate-fade-up relative" style={{ animationDelay: "300ms" }}>
          <div className="relative overflow-hidden rounded-3xl ring-1 ring-white/15 shadow-2xl shadow-navy-950/60">
            <Image
              src="/images/hero-papeles.png"
              alt="Resmas de papel y cartulinas de colores en la bodega de Papeles Austral"
              width={1600}
              height={900}
              priority
              className="aspect-[4/3] w-full object-cover"
            />
            <div
              aria-hidden
              className="absolute inset-0 bg-gradient-to-t from-navy-900/50 via-transparent to-transparent"
            />
          </div>

          {/* Tarjeta flotante */}
          <div className="absolute -bottom-6 -left-4 max-w-[15rem] rounded-2xl border border-white/40 bg-paper-50/95 p-4 shadow-xl shadow-navy-950/30 backdrop-blur sm:-left-8">
            <p className="font-display text-2xl font-bold text-navy-800">
              +400
            </p>
            <p className="mt-1 text-xs leading-snug text-navy-800/70">
              referencias en papeles, cartulinas y cartones listas para cotizar
            </p>
          </div>
        </div>
      </Container>
    </section>
  );
}
