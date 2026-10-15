import { and, eq, notInArray, sql } from "drizzle-orm";
import { lineKey, type ParsedCatalog } from "@/application/catalog-sync/parse-catalog";
import type { CatalogStore, SyncTrigger } from "@/application/catalog-sync/sync-catalog";
import { getDb } from "./client";
import { productLines, products, syncRuns, tags } from "./schema";

/** Para upserts: toma el valor que se intentó insertar. */
const excluded = (column: string) => sql.raw(`excluded.${column}`);

export class DrizzleCatalogStore implements CatalogStore {
  private readonly db = getDb();

  async startRun(trigger: SyncTrigger) {
    const [run] = await this.db
      .insert(syncRuns)
      .values({ trigger, status: "running" })
      .returning({ id: syncRuns.id });
    return run.id;
  }

  async save(catalog: ParsedCatalog) {
    const now = new Date();
    const codes = catalog.products.map((p) => p.code);

    const lineRows = catalog.lines.map((line) => ({
      key: lineKey(line.sourceName),
      sourceName: line.sourceName,
      name: line.name,
      familyId: line.familyId,
      sortOrder: line.order,
      updatedAt: now,
    }));

    const tagRows = catalog.tags.map((tag, i) => ({
      name: tag.name,
      description: tag.description,
      sortOrder: i,
      updatedAt: now,
    }));

    const productRows = catalog.products.map((p) => ({
      code: p.code,
      description: p.description,
      lineKey: lineKey(p.line.sourceName),
      brand: p.brand,
      grammage: p.grammage,
      size: p.size,
      caliper: p.caliper,
      thicknessMm: p.thicknessMm,
      sheetsPerPack: p.sheetsPerPack,
      pricePerPack: p.pricePerPack,
      tags: [...p.tags],
      active: true,
      sourceRow: p.sourceRow,
      lastSyncedAt: now,
      updatedAt: now,
    }));

    // neon-http no tiene transacciones interactivas: batch() ejecuta todo en una sola transacción.
    const [, , , , deactivated] = await this.db.batch([
      this.db
        .insert(productLines)
        .values(lineRows)
        .onConflictDoUpdate({
          target: productLines.key,
          set: {
            sourceName: excluded("source_name"),
            name: excluded("name"),
            familyId: excluded("family_id"),
            sortOrder: excluded("sort_order"),
            updatedAt: now,
          },
        }),
      this.db
        .insert(tags)
        .values(tagRows)
        .onConflictDoUpdate({
          target: tags.name,
          set: {
            description: excluded("description"),
            sortOrder: excluded("sort_order"),
            updatedAt: now,
          },
        }),
      this.db.delete(tags).where(notInArray(tags.name, tagRows.map((t) => t.name))),
      this.db
        .insert(products)
        .values(productRows)
        .onConflictDoUpdate({
          target: products.code,
          set: {
            description: excluded("description"),
            lineKey: excluded("line_key"),
            brand: excluded("brand"),
            grammage: excluded("grammage"),
            size: excluded("size"),
            caliper: excluded("caliper"),
            thicknessMm: excluded("thickness_mm"),
            sheetsPerPack: excluded("sheets_per_pack"),
            pricePerPack: excluded("price_per_pack"),
            tags: excluded("tags"),
            active: true,
            sourceRow: excluded("source_row"),
            lastSyncedAt: now,
            updatedAt: now,
          },
        }),
      this.db
        .update(products)
        .set({ active: false, updatedAt: now })
        .where(and(eq(products.active, true), notInArray(products.code, codes)))
        .returning({ code: products.code }),
    ]);

    return { productsSynced: productRows.length, productsDeactivated: deactivated.length };
  }

  async finishRun(
    runId: number,
    result: Parameters<CatalogStore["finishRun"]>[1],
  ) {
    await this.db
      .update(syncRuns)
      .set({
        status: result.status,
        finishedAt: new Date(),
        productsSynced: result.productsSynced ?? 0,
        productsDeactivated: result.productsDeactivated ?? 0,
        rowsExcluded: result.issues.filter((i) => i.excluded).length,
        issues: result.issues,
        error: result.error ?? null,
      })
      .where(eq(syncRuns.id, runId));
  }
}
