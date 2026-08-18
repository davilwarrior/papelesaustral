import type { SiteConfig } from "@/domain/entities/site-config";
import type { SiteConfigRepository } from "@/domain/repositories/site-config-repository";
import { siteConfigData } from "../config/site-config.data";

export class StaticSiteConfigRepository implements SiteConfigRepository {
  async getSiteConfig(): Promise<SiteConfig> {
    return siteConfigData;
  }
}
