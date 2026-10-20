import { Clock, Mail, MapPin, MessageCircle } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { SiteConfig } from "@/domain/entities/site-config";
import { buildWhatsAppQuoteUrl } from "@/application/use-cases/build-whatsapp-quote-url";
import { Container } from "../ui/container";

const navItems = [
  { href: "/#productos", label: "Productos" },
  { href: "/cotizador", label: "Cotizador" },
  { href: "/#lista-de-precios", label: "Lista de precios" },
  { href: "/#quienes", label: "Para quién" },
  { href: "/#nosotros", label: "Nosotros" },
  { href: "/#logistica", label: "Logística" },
  { href: "/#contacto", label: "Contacto" },
];

interface FooterProps {
  site: SiteConfig;
}

export function Footer({ site }: FooterProps) {
  const whatsappUrl = buildWhatsAppQuoteUrl(site.contact.whatsappNumber);
  const year = new Date().getFullYear();

  return (
    <footer className="texture-grain bg-navy-950 text-navy-100">
      <Container className="grid gap-12 py-16 lg:grid-cols-[1.4fr_1fr_1.2fr] lg:gap-16">
        <div>
          <span className="inline-flex items-center rounded-full bg-white px-4 py-2.5">
            <Image
              src="/images/logo.png"
              alt="Papeles Austral"
              width={1212}
              height={400}
              className="h-8 w-auto"
            />
          </span>
          <p className="mt-5 max-w-sm text-sm leading-relaxed text-navy-100/70">
            {site.description}
          </p>
          <p className="mt-4 text-xs font-medium tracking-wide text-navy-100/50">
            Antes {site.formerName}
          </p>
        </div>

        <nav aria-label="Pie de página">
          <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-forest-300">
            Navegación
          </h3>
          <ul className="mt-5 space-y-3">
            {navItems.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="text-sm text-navy-100/70 transition-colors hover:text-white"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div>
          <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-forest-300">
            Contacto
          </h3>
          <ul className="mt-5 space-y-4 text-sm">
            <li>
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-start gap-3 text-navy-100/70 transition-colors hover:text-white"
              >
                <MessageCircle className="mt-0.5 size-4 shrink-0 text-forest-300" aria-hidden />
                {site.contact.whatsappDisplay}
              </a>
            </li>
            <li>
              <a
                href={`mailto:${site.contact.email}`}
                className="group flex items-start gap-3 text-navy-100/70 transition-colors hover:text-white"
              >
                <Mail className="mt-0.5 size-4 shrink-0 text-forest-300" aria-hidden />
                {site.contact.email}
              </a>
            </li>
            <li className="flex items-start gap-3 text-navy-100/70">
              <MapPin className="mt-0.5 size-4 shrink-0 text-forest-300" aria-hidden />
              <span>
                {site.contact.address}
                <br />
                {site.contact.city}
              </span>
            </li>
            <li className="flex items-start gap-3 text-navy-100/70">
              <Clock className="mt-0.5 size-4 shrink-0 text-forest-300" aria-hidden />
              {site.contact.schedule}
            </li>
          </ul>
        </div>
      </Container>

      <div className="border-t border-white/10">
        <Container className="flex flex-col items-center justify-between gap-3 py-6 text-xs text-navy-100/50 sm:flex-row">
          <p>
            © {year} {site.legalName} Todos los derechos reservados.
          </p>
          <p>
            <span className="text-forest-300">{site.domain}</span>
          </p>
        </Container>
      </div>
    </footer>
  );
}
