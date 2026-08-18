import type { Audience } from "../entities/audience";
import type { Category } from "../entities/category";
import type { CompanyValue } from "../entities/company-value";

export interface CatalogRepository {
  getCategories(): Promise<readonly Category[]>;
  getAudiences(): Promise<readonly Audience[]>;
  getCompanyValues(): Promise<readonly CompanyValue[]>;
}
