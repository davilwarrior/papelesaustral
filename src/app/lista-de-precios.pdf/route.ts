import { renderPriceListPdf } from "@/infrastructure/exports/price-list-pdf";
import { loadPriceList } from "@/infrastructure/price-list";

// Se genera una vez y se reutiliza; la sincronización con el Sheet lo revalida.
export const dynamic = "force-static";
export const revalidate = 3600;

export async function GET() {
  const list = await loadPriceList();
  const pdf = await renderPriceListPdf(list);
  const filename = `lista-de-precios-papeles-austral-${list.fileDate}.pdf`;

  return new Response(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      // inline: se abre en el visor del navegador, listo para imprimir o guardar
      "Content-Disposition": `inline; filename="${filename}"`,
    },
  });
}
