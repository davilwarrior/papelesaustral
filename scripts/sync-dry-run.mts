// Simula la migración Sheet -> Neon sin escribir en la base de datos.
// Uso: npm run sync:dry-run
import { parseCatalog } from "@/application/catalog-sync/parse-catalog";
import { PRODUCT_FAMILIES } from "@/domain/entities/product";
import { GoogleSheetsCatalogSource } from "@/infrastructure/google-sheets/google-sheets-catalog-source";

const { products, issues, tags } = parseCatalog(await new GoogleSheetsCatalogSource().fetch());

const count = <T,>(items: readonly T[], key: (item: T) => string | null) =>
  items.reduce<Record<string, number>>((acc, item) => {
    const k = key(item) ?? "(sin dato)";
    acc[k] = (acc[k] ?? 0) + 1;
    return acc;
  }, {});

console.log(`\nProductos a migrar: ${products.length}`);
console.log(`  Con precio: ${products.filter((p) => p.pricePerPack !== null).length}`);
console.log(`  Sin precio ("Consultar"): ${products.filter((p) => p.pricePerPack === null).length}`);
console.log(`  Sin pliegos por paquete: ${products.filter((p) => p.sheetsPerPack === null).length}`);

console.log("\nPor familia:");
for (const family of PRODUCT_FAMILIES) {
  console.log(`  ${family.name}: ${products.filter((p) => p.line.familyId === family.id).length}`);
}

console.log("\nPor tag:");
for (const tag of tags) {
  console.log(`  ${tag.name}: ${products.filter((p) => p.tags.includes(tag.name)).length}`);
}

console.log("\nMarcas:", count(products, (p) => p.brand));
console.log("\nMedidas:", count(products, (p) => p.size));
console.log(`\nSin gramaje detectado: ${products.filter((p) => p.grammage === null).map((p) => p.code).join(", ") || "ninguno"}`);

console.log("\nEjemplos:");
for (const code of ["00743", "00801", "00018", "00554", "00140", "00662", "00405"]) {
  const p = products.find((x) => x.code === code);
  if (p) console.log(" ", JSON.stringify({ ...p, line: p.line.name }));
}

console.log(`\nProblemas: ${issues.length} (${issues.filter((i) => i.excluded).length} filas excluidas)`);
console.log(count(issues, (i) => i.kind));
for (const issue of issues.filter((i) => i.kind !== "missing-code")) {
  console.log(`  [${issue.sheet} fila ${issue.row}] ${issue.message}`);
}
