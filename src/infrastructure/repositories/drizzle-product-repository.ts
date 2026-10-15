import { asc, desc, eq } from "drizzle-orm";
import { PRODUCT_FAMILIES } from "@/domain/entities/product";
import type {
  ProductCatalog,
  ProductRepository,
} from "@/domain/repositories/product-repository";
import { getDb } from "../db/client";
import { productLines, products, syncRuns, tags } from "../db/schema";

const familyOrder = new Map<string, number>(PRODUCT_FAMILIES.map((f, i) => [f.id, i]));

export class DrizzleProductRepository implements ProductRepository {
  async getCatalog(): Promise<ProductCatalog> {
    const db = getDb();
    const [rows, tagRows, [lastRun]] = await Promise.all([
      db
        .select()
        .from(products)
        .innerJoin(productLines, eq(products.lineKey, productLines.key))
        .where(eq(products.active, true))
        .orderBy(asc(productLines.sortOrder), asc(products.sourceRow)),
      db.select().from(tags).orderBy(asc(tags.sortOrder)),
      db
        .select({ finishedAt: syncRuns.finishedAt })
        .from(syncRuns)
        .where(eq(syncRuns.status, "success"))
        .orderBy(desc(syncRuns.finishedAt))
        .limit(1),
    ]);

    const sorted = rows.sort(
      (a, b) =>
        (familyOrder.get(a.product_lines.familyId) ?? 99) -
        (familyOrder.get(b.product_lines.familyId) ?? 99),
    );

    return {
      products: sorted.map(({ products: p, product_lines: line }) => ({
        code: p.code,
        description: p.description,
        line: {
          sourceName: line.sourceName,
          name: line.name,
          familyId: line.familyId,
          order: line.sortOrder,
        },
        brand: p.brand,
        grammage: p.grammage,
        size: p.size,
        caliper: p.caliper,
        thicknessMm: p.thicknessMm,
        sheetsPerPack: p.sheetsPerPack,
        pricePerPack: p.pricePerPack,
        tags: p.tags,
      })),
      tags: tagRows.map((t) => ({ name: t.name, description: t.description })),
      updatedAt: lastRun?.finishedAt?.toISOString() ?? null,
    };
  }
}
