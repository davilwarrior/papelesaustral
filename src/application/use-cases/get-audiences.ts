import type { Audience } from "@/domain/entities/audience";
import type { CatalogRepository } from "@/domain/repositories/catalog-repository";

export async function getAudiences(
  repository: CatalogRepository,
): Promise<readonly Audience[]> {
  return repository.getAudiences();
}
