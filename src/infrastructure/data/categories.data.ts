import type { Category } from "@/domain/entities/category";

export const categoriesData: readonly Category[] = [
  {
    id: "papeles",
    name: "Papeles",
    tagline: "Para impresión offset y digital",
    description:
      "Bond, couché, opalina, adhesivos y más. Papeles confiables para que cada impresión salga como la planificaste.",
    examples: ["Bond", "Couché", "Opalina", "Adhesivos"],
    icon: "file-stack",
  },
  {
    id: "cartulinas",
    name: "Cartulinas",
    tagline: "Estructura para tus piezas",
    description:
      "Cartulinas de buena rigidez, recomendadas para carpetas, empaques y piezas que necesitan mayor estructura.",
    examples: ["Folderadas", "Bristol", "Dúplex", "De colores"],
    icon: "layers",
  },
  {
    id: "cartones",
    name: "Cartones",
    tagline: "Base sólida para empaques",
    description:
      "Cartones grises, kraft y compactos para empaques, troquelados, encuadernación y trabajos de armado.",
    examples: ["Gris", "Kraft", "Compacto", "Microcorrugado"],
    icon: "package",
  },
  {
    id: "especializados",
    name: "Materiales especializados",
    tagline: "Para proyectos que piden algo distinto",
    description:
      "Papeles texturizados, metalizados y de gramajes especiales. Si tu proyecto es diferente, aquí encuentras el material.",
    examples: ["Texturizados", "Metalizados", "Percalinas", "Gramajes especiales"],
    icon: "sparkles",
  },
];
