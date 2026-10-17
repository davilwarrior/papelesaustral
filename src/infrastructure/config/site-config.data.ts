import type { SiteConfig } from "@/domain/entities/site-config";

// TODO: reemplazar con los datos reales de contacto del negocio.
export const siteConfigData: SiteConfig = {
  name: "Papeles Austral",
  legalName: "Papeles Austral S.A.S.",
  formerName: "PCC Austral",
  domain: "papelesaustral.com",
  url: "https://papelesaustral.com",
  tagline: "El material correcto, cuando lo necesitas.",
  description:
    "Proveedor especializado de papeles, cartulinas y cartones para imprentas, diseñadores, editoriales, papelerías y empresas de packaging en el Austro ecuatoriano.",
  contact: {
    whatsappNumber: "593962247520",
    whatsappDisplay: "+593 96 224 7520",
    email: "ventas@papelesaustral.com",
    address: "Calle Huacas 1-37 y Calle Rumiloma",
    city: "Cuenca, Ecuador",
    schedule: "Lunes a viernes · 8h30 a 17h30",
  },
};
