import { Clock, Mail, MapPin, MessageCircle } from "lucide-react";
import type { SiteConfig } from "@/domain/entities/site-config";
import { buildWhatsAppQuoteUrl } from "@/application/use-cases/build-whatsapp-quote-url";

interface ContactInfoCardProps {
  site: SiteConfig;
}

export function ContactInfoCard({ site }: ContactInfoCardProps) {
  const whatsappUrl = buildWhatsAppQuoteUrl(site.contact.whatsappNumber);
  const { contact } = site;

  return (
    <aside className="texture-grain flex h-full flex-col rounded-3xl bg-navy-800 p-7 sm:p-9">
      <h3 className="font-display text-xl font-bold text-white">
        Atención directa
      </h3>
      <p className="mt-2 text-sm leading-relaxed text-navy-100/70">
        Si prefieres, escríbenos o visítanos. Te asesoramos para elegir el
        material adecuado, aunque todavía no tengas claro qué necesitas.
      </p>

      <ul className="mt-7 space-y-5 text-sm">
        <li>
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center gap-4"
          >
            <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-white/8 text-forest-300 ring-1 ring-white/12 transition-colors group-hover:bg-forest-500/20">
              <MessageCircle className="size-5" aria-hidden />
            </span>
            <span>
              <span className="block text-xs font-semibold uppercase tracking-wider text-navy-100/50">
                WhatsApp
              </span>
              <span className="mt-0.5 block font-medium text-white transition-colors group-hover:text-forest-300">
                {contact.whatsappDisplay}
              </span>
            </span>
          </a>
        </li>
        <li>
          <a href={`mailto:${contact.email}`} className="group flex items-center gap-4">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-white/8 text-forest-300 ring-1 ring-white/12 transition-colors group-hover:bg-forest-500/20">
              <Mail className="size-5" aria-hidden />
            </span>
            <span>
              <span className="block text-xs font-semibold uppercase tracking-wider text-navy-100/50">
                Correo
              </span>
              <span className="mt-0.5 block font-medium text-white transition-colors group-hover:text-forest-300">
                {contact.email}
              </span>
            </span>
          </a>
        </li>
        <li className="flex items-center gap-4">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-white/8 text-forest-300 ring-1 ring-white/12">
            <MapPin className="size-5" aria-hidden />
          </span>
          <span>
            <span className="block text-xs font-semibold uppercase tracking-wider text-navy-100/50">
              Dirección
            </span>
            <span className="mt-0.5 block font-medium text-white">
              {contact.address} · {contact.city}
            </span>
          </span>
        </li>
        <li className="flex items-center gap-4">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-white/8 text-forest-300 ring-1 ring-white/12">
            <Clock className="size-5" aria-hidden />
          </span>
          <span>
            <span className="block text-xs font-semibold uppercase tracking-wider text-navy-100/50">
              Horario
            </span>
            <span className="mt-0.5 block font-medium text-white">
              {contact.schedule}
            </span>
          </span>
        </li>
      </ul>

      <div className="mt-auto pt-8">
        <div className="rounded-2xl border border-forest-300/20 bg-forest-500/10 p-4">
          <p className="text-sm font-semibold text-forest-300">
            {site.tagline}
          </p>
          <p className="mt-1 text-xs text-navy-100/60">
            Encontrar el material correcto de manera más fácil y rápida.
          </p>
        </div>
      </div>
    </aside>
  );
}
