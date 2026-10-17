import type { Metadata, Viewport } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { getSiteConfig } from "@/application/use-cases/get-site-config";
import { siteConfigRepository } from "@/infrastructure/container";
import { ChatWidget } from "@/presentation/components/chat/chat-widget";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  const site = await getSiteConfig(siteConfigRepository);

  return {
    metadataBase: new URL(site.url),
    title: {
      default: `${site.name} | Papeles, cartulinas y cartones en el Austro ecuatoriano`,
      template: `%s | ${site.name}`,
    },
    description: `${site.description} ${site.tagline}`,
    keywords: [
      "papeles",
      "cartulinas",
      "cartones",
      "imprenta",
      "packaging",
      "Cuenca",
      "Ecuador",
      "proveedor de papel",
      site.formerName,
    ],
    openGraph: {
      type: "website",
      locale: "es_EC",
      url: site.url,
      siteName: site.name,
      title: `${site.name} — ${site.tagline}`,
      description: site.description,
    },
    robots: { index: true, follow: true },
    alternates: { canonical: site.url },
  };
}

export const viewport: Viewport = {
  themeColor: "#0b1f3a",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const site = await getSiteConfig(siteConfigRepository);

  return (
    <html
      lang="es"
      className={`${inter.variable} ${spaceGrotesk.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        {children}
        <ChatWidget whatsappNumber={site.contact.whatsappNumber} />
      </body>
    </html>
  );
}
