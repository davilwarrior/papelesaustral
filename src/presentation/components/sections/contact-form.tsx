"use client";

import { MessageCircle } from "lucide-react";
import { useState, type FormEvent } from "react";
import { buildWhatsAppQuoteUrl } from "@/application/use-cases/build-whatsapp-quote-url";

const materialOptions = [
  "Papeles",
  "Cartulinas",
  "Cartones",
  "Materiales especializados",
  "Aún no lo tengo claro",
];

const inputClasses =
  "w-full rounded-xl border border-navy-800/12 bg-paper-50 px-4 py-3 text-sm text-navy-900 placeholder:text-navy-800/40 transition-colors focus:border-forest-500 focus:outline-none focus:ring-2 focus:ring-forest-500/20";

interface ContactFormProps {
  whatsappNumber: string;
}

export function ContactForm({ whatsappNumber }: ContactFormProps) {
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [material, setMaterial] = useState(materialOptions[0]);
  const [message, setMessage] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const lines = [
      `Hola, soy ${name}${company ? ` de ${company}` : ""}.`,
      `Me interesa: ${material}.`,
      message.trim() ? message.trim() : "",
      "¿Me pueden ayudar con una cotización?",
    ].filter(Boolean);

    const url = buildWhatsAppQuoteUrl(whatsappNumber, lines.join("\n"));
    window.open(url, "_blank", "noopener,noreferrer");
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-3xl border border-navy-800/8 bg-paper-50 p-7 shadow-sm shadow-navy-950/5 sm:p-9"
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label
            htmlFor="contact-name"
            className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-navy-800/60"
          >
            Nombre *
          </label>
          <input
            id="contact-name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Tu nombre"
            className={inputClasses}
          />
        </div>
        <div>
          <label
            htmlFor="contact-company"
            className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-navy-800/60"
          >
            Empresa
          </label>
          <input
            id="contact-company"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            placeholder="Imprenta, editorial, negocio…"
            className={inputClasses}
          />
        </div>
      </div>

      <div className="mt-5">
        <label
          htmlFor="contact-material"
          className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-navy-800/60"
        >
          ¿Qué material buscas?
        </label>
        <select
          id="contact-material"
          value={material}
          onChange={(e) => setMaterial(e.target.value)}
          className={inputClasses}
        >
          {materialOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-5">
        <label
          htmlFor="contact-message"
          className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-navy-800/60"
        >
          Detalles del proyecto
        </label>
        <textarea
          id="contact-message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={4}
          placeholder="Ej: 500 cartulinas dúplex 300g, tamaño 70x100, para empaques…"
          className={inputClasses}
        />
      </div>

      <button
        type="submit"
        className="mt-7 inline-flex w-full items-center justify-center gap-2 rounded-full bg-forest-500 px-7 py-3.5 text-base font-semibold text-white shadow-lg shadow-forest-500/25 transition-all hover:-translate-y-0.5 hover:bg-forest-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest-500"
      >
        <MessageCircle className="size-5" aria-hidden />
        Enviar cotización por WhatsApp
      </button>
      <p className="mt-3 text-center text-xs text-navy-800/50">
        Se abrirá WhatsApp con tu mensaje listo para enviar.
      </p>
    </form>
  );
}
