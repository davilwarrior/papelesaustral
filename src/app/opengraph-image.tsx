import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { siteConfigData } from "@/infrastructure/config/site-config.data";

export const alt = `${siteConfigData.name} — ${siteConfigData.tagline}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpenGraphImage() {
  const logoData = await readFile(
    join(process.cwd(), "public/images/logo.png"),
  );
  const logoSrc = `data:image/png;base64,${logoData.toString("base64")}`;

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        backgroundColor: "#08172b",
        backgroundImage:
          "radial-gradient(circle at 85% 15%, rgba(62,122,62,0.35), transparent 55%)",
        padding: 72,
      }}
    >
      <div
        style={{
          display: "flex",
          backgroundColor: "white",
          borderRadius: 999,
          padding: "18px 36px",
          alignSelf: "flex-start",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={logoSrc} width={340} height={112} alt={siteConfigData.name} />
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <p
          style={{
            color: "#8abd8d",
            fontSize: 26,
            fontWeight: 700,
            letterSpacing: 6,
            textTransform: "uppercase",
            margin: 0,
          }}
        >
          Papeles · Cartulinas · Cartones
        </p>
        <h1
          style={{
            color: "white",
            fontSize: 68,
            fontWeight: 700,
            lineHeight: 1.08,
            letterSpacing: -2,
            margin: 0,
            maxWidth: 900,
          }}
        >
          {siteConfigData.tagline}
        </h1>
        <p style={{ color: "#b0c2de", fontSize: 26, margin: 0 }}>
          {siteConfigData.domain}
        </p>
      </div>
    </div>,
    size,
  );
}
