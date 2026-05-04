import { setRequestLocale } from "next-intl/server";
import { useTranslations } from "next-intl";
import { SiteNav } from "@/components/site/nav";
import { SiteFooter } from "@/components/site/footer";
import { Wizard } from "@/components/estimation/wizard";

interface EstimationPageProps {
  params: Promise<{ locale: string }>;
}

function PageHeader() {
  const t = useTranslations("Estimation");
  return (
    <div className="lb-container pt-32 pb-12">
      <p className="lb-eyebrow text-foreground/60 mb-3">Lightpro OM</p>
      <h1 className="lb-h1">{t("title")}</h1>
      <p className="lb-lede mt-3 text-base">{t("subtitle")}</p>
    </div>
  );
}

export default async function EstimationPage({ params }: EstimationPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <>
      <SiteNav />
      <main className="flex-1">
        <PageHeader />
        <Wizard />
      </main>
      <SiteFooter />
    </>
  );
}
