import type { CompanyValue } from "@/domain/entities/company-value";
import { Container } from "../ui/container";
import { Icon } from "../ui/icon";
import { Reveal } from "../ui/reveal";
import { SectionHeading } from "../ui/section-heading";

interface ValuesProps {
  values: readonly CompanyValue[];
}

export function Values({ values }: ValuesProps) {
  const [featured, ...rest] = values;

  return (
    <section id="nosotros" className="scroll-mt-20 py-20 sm:py-28">
      <Container>
        <SectionHeading
          eyebrow="Por qué Papeles Austral"
          title="Especialistas en papel, no un proveedor más"
          description="Nos dedicamos exclusivamente a papeles, cartulinas y cartones. Esa especialización se nota en la asesoría, la disponibilidad y los tiempos."
        />

        <div className="mt-14 grid gap-5 lg:grid-cols-3">
          {featured && (
            <Reveal className="lg:col-span-2">
              <article className="texture-grain relative flex h-full flex-col justify-between overflow-hidden rounded-3xl bg-navy-800 p-8 sm:p-10">
                <div
                  aria-hidden
                  className="pointer-events-none absolute -top-24 -right-24 size-64 rounded-full bg-forest-500/25 blur-3xl"
                />
                <span className="relative inline-flex size-12 items-center justify-center rounded-2xl bg-white/10 text-forest-300 ring-1 ring-white/15">
                  <Icon name={featured.icon} className="size-6" />
                </span>
                <div className="relative mt-16 sm:mt-24">
                  <h3 className="font-display text-2xl font-bold tracking-tight text-white sm:text-3xl">
                    {featured.name}
                  </h3>
                  <p className="mt-3 max-w-md text-sm leading-relaxed text-navy-100/75 sm:text-base">
                    {featured.description}
                  </p>
                </div>
              </article>
            </Reveal>
          )}

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-1">
            {rest.slice(0, 2).map((value, index) => (
              <Reveal key={value.id} delay={100 + index * 90}>
                <ValueCard value={value} />
              </Reveal>
            ))}
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:col-span-3 lg:grid-cols-2">
            {rest.slice(2).map((value, index) => (
              <Reveal key={value.id} delay={index * 90}>
                <ValueCard value={value} />
              </Reveal>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}

function ValueCard({ value }: { value: CompanyValue }) {
  return (
    <article className="flex h-full items-start gap-4 rounded-3xl border border-navy-800/8 bg-white p-6 transition-all duration-300 hover:-translate-y-1 hover:border-forest-500/40 hover:shadow-lg hover:shadow-navy-950/8">
      <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-forest-500/10 text-forest-600 ring-1 ring-forest-500/20">
        <Icon name={value.icon} className="size-5" />
      </span>
      <div>
        <h3 className="font-display text-lg font-bold text-navy-800">
          {value.name}
        </h3>
        <p className="mt-1.5 text-sm leading-relaxed text-navy-800/65">
          {value.description}
        </p>
      </div>
    </article>
  );
}
