import type { Audience } from "@/domain/entities/audience";
import { Container } from "../ui/container";
import { Icon } from "../ui/icon";
import { Reveal } from "../ui/reveal";
import { SectionHeading } from "../ui/section-heading";

interface AudiencesProps {
  audiences: readonly Audience[];
}

export function Audiences({ audiences }: AudiencesProps) {
  return (
    <section id="quienes" className="scroll-mt-20 bg-white py-20 sm:py-28">
      <Container>
        <SectionHeading
          eyebrow="Para quién trabajamos"
          title="Un aliado para todo el sector gráfico"
          description="Conocemos las necesidades de cada tipo de cliente y adaptamos la asesoría, los formatos y los tiempos a tu forma de trabajar."
        />

        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
          {audiences.map((audience, index) => (
            <Reveal key={audience.id} delay={index * 80} className="h-full">
              <article className="flex h-full flex-col items-center rounded-3xl border border-navy-800/8 bg-paper-50 p-6 text-center transition-all duration-300 hover:-translate-y-1 hover:border-forest-500/40 hover:shadow-lg hover:shadow-navy-950/8">
                <span className="flex size-14 items-center justify-center rounded-full bg-forest-500/10 text-forest-600 ring-1 ring-forest-500/20">
                  <Icon name={audience.icon} className="size-7" />
                </span>
                <h3 className="mt-4 font-display text-base font-bold text-navy-800">
                  {audience.name}
                </h3>
                <p className="mt-2 text-xs leading-relaxed text-navy-800/65">
                  {audience.description}
                </p>
              </article>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}
