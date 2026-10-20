import { renderPriceListXlsx } from "@/infrastructure/exports/price-list-xlsx";
import { loadPriceList } from "@/infrastructure/price-list";

// Se genera una vez y se reutiliza; la sincronización con el Sheet lo revalida.
export const dynamic = "force-static";
export const revalidate = 3600;

export async function GET() {
  const list = await loadPriceList();
  const xlsx = await renderPriceListXlsx(list);
  const filename = `lista-de-precios-papeles-austral-${list.fileDate}.xlsx`;

  return new Response(new Uint8Array(xlsx), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
