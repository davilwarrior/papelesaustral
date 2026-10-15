// Verifica la conexión a Neon y la lectura del Google Sheet.
// Uso: npm run check:connections
import { neon } from "@neondatabase/serverless";
import { JWT } from "google-auth-library";

async function checkNeon() {
  const sql = neon(process.env.DATABASE_URL);
  const [row] = await sql`select current_database() as db, version() as version, now() as now`;
  console.log(`✔ Neon: conectado a "${row.db}"`);
  console.log(`  ${row.version.split(",")[0]}`);
}

async function checkSheet() {
  const auth = new JWT({
    email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
  });
  const id = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
  const base = `https://sheets.googleapis.com/v4/spreadsheets/${id}`;

  const meta = await auth.request({ url: `${base}?fields=properties.title,sheets.properties.title` });
  console.log(`✔ Sheets: acceso a "${meta.data.properties.title}"`);
  console.log(`  Pestañas: ${meta.data.sheets.map((s) => s.properties.title).join(", ")}`);

  const range = encodeURIComponent(process.env.GOOGLE_SHEETS_RANGE);
  const { data } = await auth.request({ url: `${base}/values/${range}` });
  const rows = data.values ?? [];
  console.log(`  Rango ${data.range}: ${rows.length} filas (incluye encabezado)`);
  console.log(`  Encabezados: ${JSON.stringify(rows[0] ?? [])}`);
  rows.slice(1, 4).forEach((r, i) => console.log(`  Fila ${i + 2}: ${JSON.stringify(r)}`));
}

let failed = false;
for (const [name, fn] of [["Neon", checkNeon], ["Sheets", checkSheet]]) {
  try {
    await fn();
  } catch (err) {
    failed = true;
    const detail = err.response?.data?.error?.message ?? err.message;
    console.error(`✘ ${name}: ${detail}`);
  }
}
process.exit(failed ? 1 : 0);
