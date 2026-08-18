import type { MetadataRoute } from "next";
import { siteConfigData } from "@/infrastructure/config/site-config.data";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: siteConfigData.url,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 1,
    },
  ];
}
