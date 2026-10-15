import { defineConfig } from "drizzle-kit";

process.loadEnvFile?.(".env");

export default defineConfig({
  schema: "./src/infrastructure/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  // Conexión directa (sin pooler) para migraciones
  dbCredentials: { url: process.env.DATABASE_URL_UNPOOLED! },
});
