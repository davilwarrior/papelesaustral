import type { SiteConfig } from "@/domain/entities/site-config";
import type { SiteConfigRepository } from "@/domain/repositories/site-config-repository";

export async function getSiteConfig(
  repository: SiteConfigRepository,
): Promise<SiteConfig> {
  return repository.getSiteConfig();
}
