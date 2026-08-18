import { getAudiences } from "@/application/use-cases/get-audiences";
import { getCategories } from "@/application/use-cases/get-categories";
import { getCompanyValues } from "@/application/use-cases/get-company-values";
import { getSiteConfig } from "@/application/use-cases/get-site-config";
import { buildWhatsAppQuoteUrl } from "@/application/use-cases/build-whatsapp-quote-url";
import {
  catalogRepository,
  siteConfigRepository,
} from "@/infrastructure/container";
import { Footer } from "@/presentation/components/layout/footer";
import { Header } from "@/presentation/components/layout/header";
import { Audiences } from "@/presentation/components/sections/audiences";
import { Categories } from "@/presentation/components/sections/categories";
import { Contact } from "@/presentation/components/sections/contact";
import { Hero } from "@/presentation/components/sections/hero";
import { Logistics } from "@/presentation/components/sections/logistics";
import { RebrandBanner } from "@/presentation/components/sections/rebrand-banner";
import { Values } from "@/presentation/components/sections/values";

export default async function HomePage() {
  const [site, categories, audiences, values] = await Promise.all([
    getSiteConfig(siteConfigRepository),
    getCategories(catalogRepository),
    getAudiences(catalogRepository),
    getCompanyValues(catalogRepository),
  ]);

  const whatsappUrl = buildWhatsAppQuoteUrl(site.contact.whatsappNumber);

  return (
    <>
      <Header whatsappUrl={whatsappUrl} />
      <main>
        <Hero site={site} />
        <RebrandBanner formerName={site.formerName} name={site.name} />
        <Categories categories={categories} />
        <Audiences audiences={audiences} />
        <Values values={values} />
        <Logistics />
        <Contact site={site} />
      </main>
      <Footer site={site} />
    </>
  );
}
