import type { Category } from "@/domain/entities/category";
import { Container } from "../ui/container";
import { Icon } from "../ui/icon";
import { Reveal } from "../ui/reveal";
import { SectionHeading } from "../ui/section-heading";

interface CategoriesProps {
  categories: readonly Category[];
}

export function Categories({ categories }: CategoriesProps) {
  return (
    <section id="productos" className="scroll-mt-20 py-20 sm:py-28">
      <Container>
        <SectionHeading
          eyebrow="Nuestro catálogo"
          title="Todo el papel que tu proyecto necesita"
          description="Cuatro familias de materiales, un solo proveedor. Cotiza con nosotros y recibe asesoría para elegir el gramaje, formato y acabado correctos."
        />

        <div className="mt-14 grid gap-6 sm:grid-cols-2">
          {categories.map((category, index) => (
            <Reveal key={category.id} delay={index * 90}>
              <article className="group relative h-full overflow-hidden rounded-3xl border border-navy-800/8 bg-white p-7 shadow-sm shadow-navy-950/5 transition-all duration-300 hover:-translate-y-1.5 hover:border-forest-500/40 hover:shadow-xl hover:shadow-navy-950/10 sm:p-8">
                <div
                  aria-hidden
                  className="absolute -top-16 -right-16 size-40 rounded-full bg-forest-50 transition-transform duration-500 group-hover:scale-150"
                />
                <div className="relative">
                  <span className="inline-flex size-12 items-center justify-center rounded-2xl bg-navy-800 text-forest-300 shadow-lg shadow-navy-800/20">
                    <Icon name={category.icon} className="size-6" />
                  </span>

                  <h3 className="mt-5 font-display text-2xl font-bold tracking-tight text-navy-800">
                    {category.name}
                  </h3>
                  <p className="mt-1 text-sm font-semibold text-forest-600">
                    {category.tagline}
                  </p>
                  <p className="mt-3 text-sm leading-relaxed text-navy-800/70">
                    {category.description}
                  </p>

                  <ul className="mt-5 flex flex-wrap gap-2">
                    {category.examples.map((example) => (
                      <li
                        key={example}
                        className="rounded-full bg-paper-100 px-3 py-1 text-xs font-medium text-navy-800/70 ring-1 ring-navy-800/8"
                      >
                        {example}
                      </li>
                    ))}
                  </ul>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}
