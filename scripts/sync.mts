// Sincroniza el Google Sheet con Neon.
// Uso: npm run sync
import { runCatalogSync } from "@/infrastructure/catalog-sync";

const result = await runCatalogSync("manual");
console.log(`Sincronización #${result.runId} completada`);
console.log(`  Productos sincronizados: ${result.productsSynced}`);
console.log(`  Productos desactivados: ${result.productsDeactivated}`);
console.log(`  Filas excluidas: ${result.rowsExcluded} (ver npm run sync:dry-run)`);
