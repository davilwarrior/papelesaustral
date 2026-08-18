import type { MetadataRoute } from "next";
import { siteConfigData } from "@/infrastructure/config/site-config.data";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: siteConfigData.name,
    short_name: "Austral",
    description: siteConfigData.description,
    start_url: "/",
    display: "standalone",
    background_color: "#0b1f3a",
    theme_color: "#0b1f3a",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
    ],
  };
}
