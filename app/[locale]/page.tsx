import { setRequestLocale } from "next-intl/server";
import { SiteNav } from "@/components/site/nav";
import { Hero } from "@/components/site/hero";
import { WhoAreWe } from "@/components/site/who-are-we";
import { Solutions } from "@/components/site/solutions";
import { Sectors } from "@/components/site/sectors";
import { CTA } from "@/components/site/cta";
import { SiteFooter } from "@/components/site/footer";

interface HomePageProps {
  params: Promise<{ locale: string }>;
}

export default async function HomePage({ params }: HomePageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <>
      <SiteNav />
      <main className="flex-1">
        <Hero />
        <WhoAreWe />
        <Solutions />
        <Sectors />
        <CTA />
      </main>
      <SiteFooter />
    </>
  );
}
