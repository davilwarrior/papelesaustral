import { readFile } from "node:fs/promises";
import path from "node:path";
import ExcelJS from "exceljs";
import {
  PRICE_LIST_NOTICE,
  type PriceList,
} from "@/application/use-cases/build-price-list";

const NAVY = "FF0B1F3A";
const GREEN = "FF3E7A3E";
const GREEN_TINT = "FFEFF6EF";
const PAPER = "FFF7F6F3";
const MUTED = "FF5A6475";
const RULE = "FFE3E0D6";

const COLUMNS = [
  { header: "Familia", key: "family", width: 22 },
  { header: "Línea", key: "line", width: 34 },
  { header: "Código", key: "code", width: 10 },
  { header: "Producto", key: "description", width: 52 },
  { header: "Marca", key: "brand", width: 16 },
  { header: "Gramaje (g)", key: "grammage", width: 12 },
  { header: "Medida", key: "size", width: 11 },
  { header: "Calibre", key: "caliper", width: 9 },
  { header: "Pliegos por paquete", key: "sheets", width: 12 },
  { header: "Precio por paquete (USD)", key: "price", width: 14 },
  { header: "Precio por pliego (USD)", key: "pricePerSheet", width: 13 },
] as const;

/** Fila donde empieza la tabla (después del encabezado y el aviso). */
const HEADER_ROW = 9;

export async function renderPriceListXlsx(list: PriceList): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = list.companyName;
  workbook.title = `Lista de precios ${list.companyName}`;
  workbook.created = new Date();

  const sheet = workbook.addWorksheet("Lista de precios", {
    views: [{ state: "frozen", ySplit: HEADER_ROW, xSplit: 0, showGridLines: false }],
    pageSetup: {
      paperSize: 9, // A4
      orientation: "landscape",
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
      printTitlesRow: `${HEADER_ROW}:${HEADER_ROW}`,
      margins: { left: 0.4, right: 0.4, top: 0.5, bottom: 0.6, header: 0.2, footer: 0.3 },
    },
    headerFooter: {
      oddFooter: `&L${list.companyName} · Precios al ${list.updatedAtLabel}&RPágina &P de &N`,
    },
  });
  sheet.columns = COLUMNS.map(({ key, width }) => ({ key, width }));
  const lastColumn = COLUMNS.length;

  // Logo
  const logo = await readFile(path.join(process.cwd(), "public/images/logo-print.png"));
  const imageId = workbook.addImage({ base64: logo.toString("base64"), extension: "png" });
  sheet.addImage(imageId, { tl: { col: 0, row: 0.2 }, ext: { width: 150, height: 50 } });

  // Encabezado
  sheet.mergeCells(1, 2, 1, lastColumn);
  Object.assign(sheet.getCell(1, 2), {
    value: "Catálogo y lista de precios",
    font: { name: "Calibri", size: 20, bold: true, color: { argb: NAVY } },
  });
  sheet.mergeCells(2, 2, 2, lastColumn);
  Object.assign(sheet.getCell(2, 2), {
    value: `Precios actualizados al ${list.updatedAtLabel} · ${list.productCount} productos · Precios por paquete en USD`,
    font: { size: 12, bold: true, color: { argb: GREEN } },
  });
  sheet.mergeCells(3, 2, 3, lastColumn);
  Object.assign(sheet.getCell(3, 2), {
    value: `WhatsApp ${list.contact.whatsappDisplay} · ${list.contact.email} · ${list.contact.address}, ${list.contact.city} · ${list.contact.schedule}`,
    font: { size: 11, color: { argb: MUTED } },
  });
  sheet.getRow(1).height = 30;
  sheet.getRow(2).height = 18;

  // Aviso de precios
  sheet.mergeCells(5, 1, 7, lastColumn);
  const notice = sheet.getCell(5, 1);
  notice.value = {
    richText: [
      { text: `${PRICE_LIST_NOTICE.title}\n`, font: { bold: true, size: 11, color: { argb: NAVY } } },
      {
        text: PRICE_LIST_NOTICE.points.map((point) => `• ${point}`).join("\n"),
        font: { size: 10, color: { argb: NAVY } },
      },
    ],
  };
  notice.alignment = { wrapText: true, vertical: "top" };
  notice.fill = { type: "pattern", pattern: "solid", fgColor: { argb: PAPER } };
  notice.border = { left: { style: "thick", color: { argb: GREEN } } };
  for (const row of [5, 6, 7]) sheet.getRow(row).height = 26;

  // Tabla
  const header = sheet.getRow(HEADER_ROW);
  header.values = COLUMNS.map((c) => c.header);
  header.height = 32;
  header.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 10 };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: NAVY } };
    cell.alignment = { vertical: "middle", wrapText: true };
  });

  let rowNumber = HEADER_ROW;
  for (const section of list.sections) {
    for (const line of section.lines) {
      for (const product of line.products) {
        rowNumber += 1;
        const row = sheet.addRow({
          family: section.familyName,
          line: line.name,
          code: product.code,
          description: product.description,
          brand: product.brand ?? "",
          grammage: product.grammage ?? "",
          size: product.size ?? "",
          caliper: product.caliper ?? "",
          sheets: product.sheetsPerPack ?? "",
          price: product.pricePerPack ?? "Consultar",
          pricePerSheet:
            product.pricePerPack !== null && product.sheetsPerPack
              ? { formula: `J${rowNumber}/I${rowNumber}` }
              : "",
        });
        row.font = { size: 10.5, color: { argb: NAVY } };
        row.alignment = { vertical: "middle" };
        row.getCell("code").numFmt = "@";
        row.getCell("price").numFmt = '"$"#,##0.00';
        row.getCell("price").font = { bold: true, size: 10.5, color: { argb: NAVY } };
        row.getCell("pricePerSheet").numFmt = '"$"#,##0.000';
        row.getCell("sheets").numFmt = "#,##0";
        if (product.pricePerPack === null) {
          row.getCell("price").font = { italic: true, size: 10, color: { argb: MUTED } };
          row.getCell("price").alignment = { horizontal: "right" };
        }
        if (rowNumber % 2 === 0) {
          row.eachCell({ includeEmpty: true }, (cell) => {
            cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFBFBFA" } };
          });
        }
        row.eachCell({ includeEmpty: true }, (cell) => {
          cell.border = { bottom: { style: "hair", color: { argb: RULE } } };
        });
        row.getCell("line").font = { size: 10, color: { argb: GREEN } };
      }
    }
  }

  sheet.autoFilter = {
    from: { row: HEADER_ROW, column: 1 },
    to: { row: rowNumber, column: lastColumn },
  };

  // Hoja con el aviso completo, por si se imprime solo la tabla
  const about = workbook.addWorksheet("Aviso de precios");
  about.getColumn(1).width = 110;
  about.addRow([PRICE_LIST_NOTICE.title]).font = { bold: true, size: 14, color: { argb: NAVY } };
  for (const point of PRICE_LIST_NOTICE.points) {
    const row = about.addRow([`• ${point}`]);
    row.alignment = { wrapText: true };
    row.font = { size: 11 };
  }
  about.addRow([]);
  about.addRow([`Lista siempre actualizada: ${list.siteUrl}/cotizador`]).font = {
    size: 11,
    color: { argb: GREEN },
    bold: true,
  };
  about.getCell("A1").fill = { type: "pattern", pattern: "solid", fgColor: { argb: GREEN_TINT } };

  return Buffer.from(await workbook.xlsx.writeBuffer());
}
