import { parseCatalog, type CatalogIssue, type ParsedCatalog, type RawCatalogSheets } from "./parse-catalog";

export type SyncTrigger = "manual" | "webhook" | "cron";

export interface CatalogSource {
  fetch(): Promise<RawCatalogSheets>;
}

export interface CatalogStoreResult {
  readonly productsSynced: number;
  readonly productsDeactivated: number;
}

export interface CatalogStore {
  startRun(trigger: SyncTrigger): Promise<number>;
  /** Guarda todo en una sola transacción y desactiva los productos que ya no vienen. */
  save(catalog: ParsedCatalog): Promise<CatalogStoreResult>;
  finishRun(
    runId: number,
    result: { status: "success" | "failed"; issues: readonly CatalogIssue[]; error?: string } & Partial<CatalogStoreResult>,
  ): Promise<void>;
}

export interface SyncCatalogResult extends CatalogStoreResult {
  readonly runId: number;
  readonly rowsExcluded: number;
  readonly issues: readonly CatalogIssue[];
}

/** Sheet -> Neon. Si el catálogo viene vacío o sin encabezados, no toca la base. */
export async function syncCatalog(
  source: CatalogSource,
  store: CatalogStore,
  trigger: SyncTrigger,
): Promise<SyncCatalogResult> {
  const runId = await store.startRun(trigger);
  let issues: readonly CatalogIssue[] = [];
  try {
    const catalog = parseCatalog(await source.fetch());
    issues = catalog.issues;

    if (catalog.products.length === 0) {
      throw new Error("El catálogo no tiene productos válidos. No se modificó la base de datos.");
    }

    const result = await store.save(catalog);
    const rowsExcluded = issues.filter((i) => i.excluded).length;
    await store.finishRun(runId, { status: "success", issues, ...result });
    return { runId, rowsExcluded, issues, ...result };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await store.finishRun(runId, { status: "failed", issues, error: message });
    throw error;
  }
}
