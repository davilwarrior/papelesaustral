import type { CompanyValue } from "@/domain/entities/company-value";

export const companyValuesData: readonly CompanyValue[] = [
  {
    id: "especializacion",
    name: "Especialización",
    description:
      "Dominio técnico y comercial de papeles, cartulinas y cartones. Es lo único que hacemos, y lo hacemos bien.",
    icon: "crosshair",
  },
  {
    id: "honestidad",
    name: "Honestidad",
    description:
      "Información transparente sobre características, disponibilidad, precios y tiempos de entrega.",
    icon: "shield-check",
  },
  {
    id: "servicio",
    name: "Servicio",
    description:
      "Acompañamiento ágil para identificar la alternativa adecuada para cada trabajo.",
    icon: "handshake",
  },
  {
    id: "innovacion",
    name: "Innovación",
    description:
      "Incorporamos materiales, herramientas y nuevas formas de comercialización para el sector gráfico.",
    icon: "lightbulb",
  },
  {
    id: "mejora-continua",
    name: "Mejora continua",
    description:
      "Evolución constante de calidad, logística, conocimiento y procesos.",
    icon: "trending-up",
  },
];
