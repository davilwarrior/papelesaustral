import type { Audience } from "@/domain/entities/audience";

export const audiencesData: readonly Audience[] = [
  {
    id: "imprentas",
    name: "Imprentas",
    description:
      "Disponibilidad real y formatos estándar para que tu producción no se detenga.",
    icon: "printer",
  },
  {
    id: "disenadores",
    name: "Diseñadores",
    description:
      "Variedad de texturas, gramajes y acabados para que tus ideas se vean como las imaginaste.",
    icon: "pen-tool",
  },
  {
    id: "editoriales",
    name: "Editoriales",
    description:
      "Papeles para libros, revistas y publicaciones, con consistencia entre tirajes.",
    icon: "book-open",
  },
  {
    id: "papelerias",
    name: "Papelerías",
    description:
      "Productos de rotación constante y asesoría para surtir tu negocio sin complicaciones.",
    icon: "store",
  },
  {
    id: "packaging",
    name: "Empresas de packaging",
    description:
      "Cartulinas y cartones con la rigidez y calidad que tus empaques necesitan.",
    icon: "box",
  },
];
