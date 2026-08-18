import { MapPinned, PackageCheck, Timer } from "lucide-react";
import Image from "next/image";
import { Container } from "../ui/container";
import { Reveal } from "../ui/reveal";
import { SectionHeading } from "../ui/section-heading";

const features = [
  {
    icon: Timer,
    title: "Respuesta rápida",
    text: "Cotizaciones ágiles para que tu producción no se detenga.",
  },
  {
    icon: MapPinned,
    title: "Cobertura regional",
    text: "Entregas en Cuenca y todo el Austro ecuatoriano.",
  },
  {
    icon: PackageCheck,
    title: "Material protegido",
    text: "Manipuleo y empaque cuidadoso para que el papel llegue impecable.",
  },
];

export function Logistics() {
  return (
    <section id="logistica" className="relative scroll-mt-20 overflow-hidden">
      <Image
        src="/images/logistica-camiones.jpeg"
        alt=""
        fill
        sizes="100vw"
        className="object-cover"
      />
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-r from-navy-950/95 via-navy-950/85 to-navy-900/60"
      />

      <Container className="relative py-24 sm:py-32">
        <div className="max-w-2xl">
          <SectionHeading
            dark
            align="left"
            eyebrow="Logística"
            title="Tu material llega a tiempo, donde lo necesitas"
            description="Sabemos que una imprenda detenida cuesta dinero. Por eso cuidamos la disponibilidad y la logística tanto como la calidad del papel."
          />
        </div>

        <div className="mt-12 grid gap-5 sm:grid-cols-3">
          {features.map((feature, index) => (
            <Reveal key={feature.title} delay={index * 100} className="h-full">
              <article className="h-full rounded-3xl border border-white/12 bg-white/6 p-6 backdrop-blur-md transition-colors duration-300 hover:bg-white/10">
                <span className="inline-flex size-11 items-center justify-center rounded-xl bg-forest-500/20 text-forest-300 ring-1 ring-forest-300/25">
                  <feature.icon className="size-5" aria-hidden />
                </span>
                <h3 className="mt-4 font-display text-lg font-bold text-white">
                  {feature.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-navy-100/70">
                  {feature.text}
                </p>
              </article>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}
