import type { MetadataRoute } from "next";
import { siteConfigData } from "@/infrastructure/config/site-config.data";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: `${siteConfigData.url}/sitemap.xml`,
  };
}
