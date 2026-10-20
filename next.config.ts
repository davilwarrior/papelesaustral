import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Generadores de PDF y Excel: se ejecutan en Node sin pasar por el bundler.
  serverExternalPackages: ["@react-pdf/renderer", "exceljs"],
  // El logo se lee del disco al generar las descargas.
  outputFileTracingIncludes: {
    "/lista-de-precios.pdf": ["./public/images/logo-print.png"],
    "/lista-de-precios.xlsx": ["./public/images/logo-print.png"],
  },
};

export default nextConfig;
