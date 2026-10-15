import { syncCatalog, type SyncTrigger } from "@/application/catalog-sync/sync-catalog";
import { DrizzleCatalogStore } from "./db/drizzle-catalog-store";
import { GoogleSheetsCatalogSource } from "./google-sheets/google-sheets-catalog-source";

/** Composition root de la sincronización Sheet -> Neon. */
export function runCatalogSync(trigger: SyncTrigger) {
  return syncCatalog(new GoogleSheetsCatalogSource(), new DrizzleCatalogStore(), trigger);
}
