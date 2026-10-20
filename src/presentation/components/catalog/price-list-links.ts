import { FileSpreadsheet, FileText } from "lucide-react";

/** Rutas generadas en src/app/lista-de-precios.{pdf,xlsx}. */
export const PRICE_LIST_DOWNLOADS = [
  {
    id: "pdf",
    href: "/lista-de-precios.pdf",
    icon: FileText,
    title: "PDF para imprimir",
    description: "Listo para imprimir o guardar en tu computadora.",
    newTab: true,
  },
  {
    id: "xlsx",
    href: "/lista-de-precios.xlsx",
    icon: FileSpreadsheet,
    title: "Excel",
    description: "Para filtrar, ordenar o armar tus propios cálculos.",
    newTab: false,
  },
] as const;

export const PRICE_LIST_NOTICE_SHORT =
  "Precios en USD vigentes a la fecha de actualización. Algunos valores pueden cambiar según la llegada de mercadería; un asesor los confirma antes de tu pedido.";
