import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { useTranslations } from "next-intl";
import { SiteNav } from "@/components/site/nav";
import { SiteFooter } from "@/components/site/footer";
import { Wizard } from "@/components/estimation/wizard";
import { COOKIE_NAME, verifyGateCookie } from "@/lib/gate/cookie";
import { ConfidentialWatermark } from "@/components/gate/confidential-watermark";
import { recordEstimationView } from "@/lib/gate/tracking";

interface ToolPageProps {
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

export default async function EstimationToolPage({ params }: ToolPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const jar = await cookies();
  const payload = verifyGateCookie(jar.get(COOKIE_NAME)?.value);
  if (!payload) {
    redirect(`/${locale}/estimation`);
  }

  // Best-effort audit log. Failures swallowed inside the helper so a
  // tracking blip never breaks the wizard.
  void recordEstimationView({ email: payload.e });

  const watermarkName = payload.n ?? payload.e;
  const watermarkDate = new Date().toISOString().slice(0, 10);

  return (
    <>
      <SiteNav />
      <main className="flex-1">
        <PageHeader />
        <Wizard
          prefillEmail={payload.e}
          prefillName={payload.n ?? null}
          prefillMunicipality={payload.o ?? null}
        />
      </main>
      <SiteFooter />
      <ConfidentialWatermark
        name={watermarkName}
        email={payload.e}
        date={watermarkDate}
      />
    </>
  );
}
