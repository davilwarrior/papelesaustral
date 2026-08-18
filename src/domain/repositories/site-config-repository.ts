import type { SiteConfig } from "../entities/site-config";

export interface SiteConfigRepository {
  getSiteConfig(): Promise<SiteConfig>;
}
