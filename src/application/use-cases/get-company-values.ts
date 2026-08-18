import type { CompanyValue } from "@/domain/entities/company-value";
import type { CatalogRepository } from "@/domain/repositories/catalog-repository";

export async function getCompanyValues(
  repository: CatalogRepository,
): Promise<readonly CompanyValue[]> {
  return repository.getCompanyValues();
}
