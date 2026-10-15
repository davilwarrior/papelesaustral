import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

function createDb() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("Falta la variable de entorno DATABASE_URL");
  return drizzle(neon(url), { schema });
}

let instance: ReturnType<typeof createDb> | undefined;

/** Cliente de Neon por HTTP, creado al primer uso. */
export function getDb() {
  instance ??= createDb();
  return instance;
}
