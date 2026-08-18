import type { SiteConfig } from "@/domain/entities/site-config";
import { Container } from "../ui/container";
import { SectionHeading } from "../ui/section-heading";
import { ContactForm } from "./contact-form";
import { ContactInfoCard } from "./contact-info-card";

interface ContactProps {
  site: SiteConfig;
}

export function Contact({ site }: ContactProps) {
  return (
    <section id="contacto" className="scroll-mt-20 bg-white py-20 sm:py-28">
      <Container>
        <SectionHeading
          eyebrow="Contacto"
          title="Cotiza tu material en minutos"
          description="Cuéntanos qué necesitas y te respondemos por WhatsApp con disponibilidad, precios y tiempos de entrega. Sin vueltas."
        />

        <div className="mt-14 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <ContactForm whatsappNumber={site.contact.whatsappNumber} />
          <ContactInfoCard site={site} />
        </div>
      </Container>
    </section>
  );
}
