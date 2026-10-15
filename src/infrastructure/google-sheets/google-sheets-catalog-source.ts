import { JWT } from "google-auth-library";
import type { RawCatalogSheets } from "@/application/catalog-sync/parse-catalog";

const SHEETS_API = "https://sheets.googleapis.com/v4/spreadsheets";

const CONFIG_TABS = { lines: "LINEAS", tags: "TAGS", brands: "MARCAS" } as const;

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Falta la variable de entorno ${name}`);
  return value;
}

/** Lee la pestaña de catálogo y las de configuración en una sola llamada. */
export class GoogleSheetsCatalogSource {
  private readonly auth = new JWT({
    email: requireEnv("GOOGLE_SERVICE_ACCOUNT_EMAIL"),
    key: requireEnv("GOOGLE_PRIVATE_KEY").replace(/\\n/g, "\n"),
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
  });

  private readonly spreadsheetId = requireEnv("GOOGLE_SHEETS_SPREADSHEET_ID");
  private readonly catalogRange = requireEnv("GOOGLE_SHEETS_RANGE");

  async fetch(): Promise<RawCatalogSheets> {
    const ranges = [
      this.catalogRange,
      ...Object.values(CONFIG_TABS).map((tab) => `'${tab}'!A1:F`),
    ];
    const query = ranges.map((r) => `ranges=${encodeURIComponent(r)}`).join("&");
    const { data } = await this.auth.request<{
      valueRanges: { values?: string[][] }[];
    }>({ url: `${SHEETS_API}/${this.spreadsheetId}/values:batchGet?${query}` });

    const [catalog, lines, tags, brands] = data.valueRanges.map((r) => r.values ?? []);
    return { catalog, lines, tags, brands };
  }
}
