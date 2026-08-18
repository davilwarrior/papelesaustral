import type { Category } from "@/domain/entities/category";
import type { CatalogRepository } from "@/domain/repositories/catalog-repository";

export async function getCategories(
  repository: CatalogRepository,
): Promise<readonly Category[]> {
  return repository.getCategories();
}
