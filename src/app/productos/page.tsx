import { ArrowRight, MessageCircle } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { buildWhatsAppQuoteUrl } from "@/application/use-cases/build-whatsapp-quote-url";
import { getProductCatalog } from "@/application/use-cases/get-product-catalog";
import { getProductShowcase } from "@/application/use-cases/get-product-showcase";
import { getSiteConfig } from "@/application/use-cases/get-site-config";
import { PRODUCT_FAMILIES } from "@/domain/entities/product";
import {
  catalogRepository,
  productRepository,
  siteConfigRepository,
} from "@/infrastructure/container";
import { Footer } from "@/presentation/components/layout/footer";
import { Header } from "@/presentation/components/layout/header";
import { ProductGallery } from "@/presentation/components/showcase/product-gallery";
import { Container } from "@/presentation/components/ui/container";
import { Reveal } from "@/presentation/components/ui/reveal";

// La sincronización con el Sheet revalida "/productos"; esto es solo un respaldo.
export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Productos: papeles, cartulinas y cartones",
  description:
    "Mira cómo es cada papel, cartulina y cartón que distribuimos: acabados, usos recomendados, gramajes y medidas disponibles.",
  alternates: { canonical: "/productos" },
};

const heroImages = [
  { slug: "cartulina-bristol", className: "top-0 left-0 w-[62%] -rotate-3" },
  { slug: "papel-couche-brillante-c2s", className: "top-[18%] right-0 w-[58%] rotate-2" },
  { slug: "papel-bond-colores-pasteles", className: "bottom-0 left-[12%] w-[60%] rotate-1" },
];

export default async function ProductsPage() {
  const [site, catalog] = await Promise.all([
    getSiteConfig(siteConfigRepository),
    getProductCatalog(productRepository),
  ]);
  const entries = await getProductShowcase(catalogRepository, catalog.products);
  const whatsappUrl = buildWhatsAppQuoteUrl(site.contact.whatsappNumber);

  const stats = [
    { value: entries.length, label: "líneas de producto" },
    { value: PRODUCT_FAMILIES.length, label: "familias" },
    { value: catalog.products.length, label: "presentaciones" },
  ];

  return (
    <>
      <Header whatsappUrl={whatsappUrl} alwaysSolid />
      <main className="pt-18">
        <section className="relative overflow-hidden py-16 sm:py-24">
          <div
            aria-hidden
            className="absolute -top-40 -right-40 size-[36rem] rounded-full bg-forest-100/60 blur-3xl"
          />
          <Container className="relative grid items-center gap-14 lg:grid-cols-[1fr_1.05fr]">
            <div className="animate-fade-up">
              <p className="text-xs font-bold tracking-[0.2em] text-forest-600 uppercase">
                Catálogo visual
              </p>
              <h1 className="mt-4 font-display text-4xl font-bold tracking-tight text-balance text-navy-800 sm:text-5xl lg:text-6xl lg:leading-[1.05]">
                Conoce cada papel antes de pedirlo
              </h1>
              <p className="mt-5 max-w-xl text-lg leading-relaxed text-pretty text-navy-800/70">
                Acabados, texturas y usos de todo lo que distribuimos. Abre cualquier
                producto para ver sus gramajes y medidas disponibles, y cotízalo en un clic.
              </p>

              <dl className="mt-10 grid max-w-md grid-cols-3 gap-6">
                {stats.map((stat) => (
                  <div key={stat.label} className="flex flex-col-reverse">
                    <dt className="text-sm leading-snug text-navy-800/60">{stat.label}</dt>
                    <dd className="font-display text-4xl font-bold text-navy-800 tabular-nums">
                      {stat.value}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>

            <div
              aria-hidden
              className="relative mx-auto aspect-[5/4] w-full max-w-xl animate-fade-up [animation-delay:150ms]"
            >
              {heroImages.map(({ slug, className }, index) => (
                <div
                  key={slug}
                  className={`absolute aspect-[3/2] overflow-hidden rounded-2xl bg-[#f2f0eb] shadow-2xl shadow-navy-950/15 ring-1 ring-navy-800/5 transition-transform duration-700 hover:z-10 hover:scale-[1.03] hover:rotate-0 ${className}`}
                >
                  <Image
                    src={`/images/productos/${slug}.webp`}
                    alt=""
                    fill
                    preload={index === 0}
                    sizes="(min-width: 1024px) 360px, 60vw"
                    className="object-cover"
                  />
                </div>
              ))}
            </div>
          </Container>
        </section>

        <ProductGallery entries={entries} whatsappNumber={site.contact.whatsappNumber} />

        <section className="pb-20 sm:pb-28">
          <Container>
            <Reveal>
              <div className="relative overflow-hidden rounded-3xl bg-navy-800 px-6 py-12 text-center shadow-2xl shadow-navy-950/20 sm:px-12 sm:py-16">
                <div aria-hidden className="texture-grain absolute inset-0" />
                <div
                  aria-hidden
                  className="absolute -bottom-32 left-1/2 size-[30rem] -translate-x-1/2 rounded-full bg-forest-500/20 blur-3xl"
                />
                <div className="relative mx-auto max-w-2xl">
                  <h2 className="font-display text-3xl font-bold tracking-tight text-balance text-white sm:text-4xl">
                    ¿No sabes cuál elegir?
                  </h2>
                  <p className="mt-4 text-lg leading-relaxed text-pretty text-navy-100/80">
                    Cuéntanos qué vas a imprimir o empacar y te recomendamos el material,
                    gramaje y formato correctos.
                  </p>
                  <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                    <Link
                      href={whatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-2 rounded-full bg-forest-500 px-7 py-3.5 font-semibold text-white shadow-lg shadow-forest-500/25 transition-all hover:-translate-y-0.5 hover:bg-forest-600"
                    >
                      <MessageCircle className="size-5" aria-hidden />
                      Pedir asesoría
                    </Link>
                    <Link
                      href="/cotizador"
                      className="inline-flex items-center justify-center gap-2 rounded-full border border-white/25 bg-white/10 px-7 py-3.5 font-semibold text-white backdrop-blur transition-all hover:bg-white/20"
                    >
                      Ir al cotizador
                      <ArrowRight className="size-5" aria-hidden />
                    </Link>
                  </div>
                </div>
              </div>
            </Reveal>
          </Container>
        </section>
      </main>
      <Footer site={site} />
    </>
  );
}
