import type { Metadata } from "next";
import { buildWhatsAppQuoteUrl } from "@/application/use-cases/build-whatsapp-quote-url";
import { getProductCatalog } from "@/application/use-cases/get-product-catalog";
import { getSiteConfig } from "@/application/use-cases/get-site-config";
import { productRepository, siteConfigRepository } from "@/infrastructure/container";
import { Header } from "@/presentation/components/layout/header";
import { QuoteTool } from "@/presentation/components/quote/quote-tool";

// La sincronización con el Sheet llama a revalidatePath("/cotizador");
// esto es solo un respaldo por si esa llamada falla.
export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Cotizador de papeles, cartulinas y cartones",
  description:
    "Busca por gramaje, medida, marca o uso, consulta precios por paquete en USD y envía tu pedido por WhatsApp.",
  alternates: { canonical: "/cotizador" },
};

const dateFormat = new Intl.DateTimeFormat("es-EC", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "America/Guayaquil",
});

export default async function QuotePage() {
  const [site, catalog] = await Promise.all([
    getSiteConfig(siteConfigRepository),
    getProductCatalog(productRepository),
  ]);

  return (
    <>
      <Header whatsappUrl={buildWhatsAppQuoteUrl(site.contact.whatsappNumber)} alwaysSolid />
      <main className="pt-18">
        <QuoteTool
          products={catalog.products}
          tags={catalog.tags}
          whatsappNumber={site.contact.whatsappNumber}
          updatedAtLabel={catalog.updatedAt ? dateFormat.format(new Date(catalog.updatedAt)) : null}
        />
      </main>
    </>
  );
}
