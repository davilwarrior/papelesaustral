import type { Audience } from "@/domain/entities/audience";
import type { Category } from "@/domain/entities/category";
import type { CompanyValue } from "@/domain/entities/company-value";
import type { CatalogRepository } from "@/domain/repositories/catalog-repository";
import { audiencesData } from "../data/audiences.data";
import { categoriesData } from "../data/categories.data";
import { companyValuesData } from "../data/company-values.data";

export class StaticCatalogRepository implements CatalogRepository {
  async getCategories(): Promise<readonly Category[]> {
    return categoriesData;
  }

  async getAudiences(): Promise<readonly Audience[]> {
    return audiencesData;
  }

  async getCompanyValues(): Promise<readonly CompanyValue[]> {
    return companyValuesData;
  }
}
