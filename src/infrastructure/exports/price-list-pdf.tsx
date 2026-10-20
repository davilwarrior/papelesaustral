import { readFile } from "node:fs/promises";
import path from "node:path";
import {
  Document,
  Font,
  Image,
  Page,
  StyleSheet,
  Text,
  View,
  renderToBuffer,
} from "@react-pdf/renderer";
import {
  PRICE_LIST_NOTICE,
  type PriceList,
} from "@/application/use-cases/build-price-list";
import { formatUsd } from "@/application/use-cases/build-quote-message";
import type { Product } from "@/domain/entities/product";

// Sin guiones de corte: en una lista de precios las palabras se leen completas.
Font.registerHyphenationCallback((word) => [word]);

const NAVY = "#0b1f3a";
const NAVY_SOFT = "#4f6fa6";
const GREEN = "#3e7a3e";
const GREEN_TINT = "#eff6ef";
const PAPER = "#f7f6f3";
const RULE = "#e3e0d6";
const MUTED = "#5a6475";

/** Anchos de columna en puntos (A4 útil ≈ 523 pt). */
const COLUMNS = {
  code: 46,
  grammage: 48,
  size: 58,
  sheets: 64,
  price: 70,
} as const;

const styles = StyleSheet.create({
  page: {
    paddingTop: 86,
    paddingBottom: 62,
    paddingHorizontal: 36,
    fontFamily: "Helvetica",
    fontSize: 10,
    color: NAVY,
  },
  header: {
    position: "absolute",
    top: 24,
    left: 36,
    right: 36,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: RULE,
  },
  logo: { height: 26, width: 79 },
  headerRight: { fontSize: 9, color: MUTED, textAlign: "right" },
  repeatedHead: { position: "absolute", top: 66, left: 36, right: 36 },
  closing: {
    marginTop: 22,
    padding: 14,
    backgroundColor: NAVY,
    borderRadius: 4,
    color: "#ffffff",
  },
  closingTitle: { fontFamily: "Helvetica-Bold", fontSize: 13 },
  closingText: { fontSize: 10.5, marginTop: 4, color: "#d8e1ef", lineHeight: 1.35 },
  footer: {
    position: "absolute",
    bottom: 22,
    left: 36,
    right: 36,
    paddingTop: 7,
    borderTopWidth: 1,
    borderTopColor: RULE,
    fontSize: 8,
    color: MUTED,
  },
  footerRow: { flexDirection: "row", justifyContent: "space-between" },
  footerNotice: { marginTop: 2 },

  title: { fontFamily: "Helvetica-Bold", fontSize: 24, color: NAVY },
  subtitle: { fontSize: 12, color: MUTED, marginTop: 4 },
  updated: {
    marginTop: 12,
    alignSelf: "flex-start",
    backgroundColor: GREEN_TINT,
    color: GREEN,
    fontFamily: "Helvetica-Bold",
    fontSize: 11,
    paddingVertical: 5,
    paddingHorizontal: 9,
    borderRadius: 4,
  },
  contactGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: RULE,
    paddingTop: 10,
  },
  contactItem: { width: "50%", marginBottom: 6, paddingRight: 8 },
  contactLabel: { fontSize: 8, color: MUTED, textTransform: "uppercase", letterSpacing: 0.6 },
  contactValue: { fontSize: 11, marginTop: 1 },
  notice: {
    marginTop: 12,
    marginBottom: 18,
    padding: 12,
    backgroundColor: PAPER,
    borderLeftWidth: 3,
    borderLeftColor: GREEN,
  },
  noticeTitle: { fontFamily: "Helvetica-Bold", fontSize: 11, marginBottom: 5 },
  noticeItem: { flexDirection: "row", marginTop: 3 },
  noticeBullet: { width: 10, color: GREEN, fontFamily: "Helvetica-Bold" },
  noticeText: { flex: 1, fontSize: 10, lineHeight: 1.35 },

  familyBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: NAVY,
    color: "#ffffff",
    paddingVertical: 7,
    paddingHorizontal: 10,
    marginTop: 10,
    borderRadius: 3,
  },
  familyName: { fontFamily: "Helvetica-Bold", fontSize: 13, letterSpacing: 0.4 },
  familyCount: { fontSize: 9, color: "#d8e1ef" },
  lineName: {
    fontFamily: "Helvetica-Bold",
    fontSize: 11,
    color: GREEN,
    marginTop: 12,
    marginBottom: 4,
  },
  tableHead: {
    flexDirection: "row",
    borderBottomWidth: 1.2,
    borderBottomColor: NAVY,
    paddingBottom: 4,
    fontFamily: "Helvetica-Bold",
    fontSize: 8.5,
    color: MUTED,
    textTransform: "uppercase",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 5,
    borderBottomWidth: 0.6,
    borderBottomColor: RULE,
  },
  rowAlt: { backgroundColor: "#fbfbfa" },
  cellCode: { width: COLUMNS.code, fontSize: 9, color: MUTED },
  cellName: { flex: 1, paddingRight: 6 },
  cellBrand: { fontSize: 8.5, color: NAVY_SOFT, marginTop: 1 },
  cellNum: { textAlign: "right" },
  cellGrammage: { width: COLUMNS.grammage },
  cellSize: { width: COLUMNS.size, paddingLeft: 10 },
  cellSheets: { width: COLUMNS.sheets },
  cellPrice: { width: COLUMNS.price, fontFamily: "Helvetica-Bold", fontSize: 10.5 },
  consult: { fontFamily: "Helvetica", fontSize: 9.5, color: MUTED },
});

function formatNumber(value: number | null, suffix = ""): string {
  return value === null ? "—" : `${value.toLocaleString("es-EC")}${suffix}`;
}

function ProductRow({ product, index }: { product: Product; index: number }) {
  return (
    <View style={index % 2 === 1 ? [styles.row, styles.rowAlt] : styles.row} wrap={false}>
      <Text style={styles.cellCode}>{product.code}</Text>
      <View style={styles.cellName}>
        <Text>{product.description}</Text>
        {product.brand && <Text style={styles.cellBrand}>{product.brand}</Text>}
      </View>
      <Text style={[styles.cellGrammage, styles.cellNum]}>
        {formatNumber(product.grammage, " g")}
      </Text>
      <Text style={styles.cellSize}>{product.size ?? "—"}</Text>
      <Text style={[styles.cellSheets, styles.cellNum]}>{formatNumber(product.sheetsPerPack)}</Text>
      <Text style={[styles.cellPrice, styles.cellNum]}>
        {product.pricePerPack === null ? (
          <Text style={styles.consult}>Consultar</Text>
        ) : (
          formatUsd(product.pricePerPack)
        )}
      </Text>
    </View>
  );
}

function TableHead() {
  return (
    <View style={styles.tableHead}>
      <Text style={styles.cellCode}>Código</Text>
      <Text style={styles.cellName}>Producto</Text>
      <Text style={[styles.cellGrammage, styles.cellNum]}>Gramaje</Text>
      <Text style={styles.cellSize}>Medida</Text>
      <Text style={[styles.cellSheets, styles.cellNum]}>Pliegos/paq</Text>
      <Text style={[styles.cellPrice, styles.cellNum, { fontSize: 8.5 }]}>Precio/paq</Text>
    </View>
  );
}

function PriceListDocument({ list, logo }: { list: PriceList; logo: Buffer }) {
  const { contact } = list;
  const site = list.siteUrl.replace(/^https?:\/\//, "");

  return (
    <Document
      title={`Lista de precios ${list.companyName} – ${list.updatedAtLabel}`}
      author={list.companyName}
      subject="Catálogo y lista de precios"
      language="es"
    >
      <Page size="A4" style={styles.page}>
        <View style={styles.header} fixed>
          {/* eslint-disable-next-line jsx-a11y/alt-text -- Image de react-pdf, no es un <img> */}
          <Image src={logo} style={styles.logo} />
          <Text style={styles.headerRight}>
            Lista de precios · Actualizada al {list.updatedAtLabel}
          </Text>
        </View>

        <View>
          <Text style={styles.title}>Catálogo y lista de precios</Text>
          <Text style={styles.subtitle}>
            Papeles, cartulinas y cartones · {list.productCount} productos · Precios por paquete en USD
          </Text>
          <Text style={styles.updated}>Precios actualizados al {list.updatedAtLabel}</Text>

          <View style={styles.contactGrid}>
            {[
              ["WhatsApp", contact.whatsappDisplay],
              ["Correo", contact.email],
              ["Dirección", `${contact.address}, ${contact.city}`],
              ["Horario", contact.schedule],
            ].map(([label, value]) => (
              <View key={label} style={styles.contactItem}>
                <Text style={styles.contactLabel}>{label}</Text>
                <Text style={styles.contactValue}>{value}</Text>
              </View>
            ))}
          </View>

          <View style={styles.notice}>
            <Text style={styles.noticeTitle}>{PRICE_LIST_NOTICE.title}</Text>
            {PRICE_LIST_NOTICE.points.map((point) => (
              <View key={point} style={styles.noticeItem}>
                <Text style={styles.noticeBullet}>•</Text>
                <Text style={styles.noticeText}>{point}</Text>
              </View>
            ))}
            <View style={styles.noticeItem}>
              <Text style={styles.noticeBullet}>•</Text>
              <Text style={styles.noticeText}>
                Consulta la lista siempre actualizada en {site}/cotizador.
              </Text>
            </View>
          </View>
        </View>

        {/* Títulos de columna repetidos desde la segunda página */}
        <View
          style={styles.repeatedHead}
          fixed
          render={({ pageNumber }) => (pageNumber > 1 ? <TableHead /> : null)}
        />

        {list.sections.map((section) => (
          <View key={section.familyName}>
            <View style={styles.familyBar} minPresenceAhead={120} wrap={false}>
              <Text style={styles.familyName}>{section.familyName.toUpperCase()}</Text>
              <Text style={styles.familyCount}>{section.productCount} productos</Text>
            </View>
            {section.lines.map((line) => (
              <View key={line.name}>
                <View minPresenceAhead={70} wrap={false}>
                  <Text style={styles.lineName}>{line.name}</Text>
                  <TableHead />
                </View>
                {line.products.map((product, index) => (
                  <ProductRow key={product.code} product={product} index={index} />
                ))}
              </View>
            ))}
          </View>
        ))}

        <View style={styles.closing} wrap={false}>
          <Text style={styles.closingTitle}>¿Listo para hacer tu pedido?</Text>
          <Text style={styles.closingText}>
            Escríbenos por WhatsApp al {contact.whatsappDisplay} con los códigos y la cantidad de
            paquetes, o arma tu pedido en {site}/cotizador. Un asesor confirmará precios y
            disponibilidad.
          </Text>
        </View>

        <View style={styles.footer} fixed>
          <View style={styles.footerRow}>
            <Text>
              {list.companyName} · WhatsApp {contact.whatsappDisplay} · {site}
            </Text>
            <Text render={({ pageNumber, totalPages }) => `Página ${pageNumber} de ${totalPages}`} />
          </View>
          <Text style={styles.footerNotice}>{PRICE_LIST_NOTICE.short}</Text>
        </View>
      </Page>
    </Document>
  );
}

export async function renderPriceListPdf(list: PriceList): Promise<Buffer> {
  const logo = await readFile(path.join(process.cwd(), "public/images/logo-print.png"));
  return renderToBuffer(<PriceListDocument list={list} logo={logo} />);
}
