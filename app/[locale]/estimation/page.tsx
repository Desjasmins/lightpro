import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { SiteNav } from "@/components/site/nav";
import { SiteFooter } from "@/components/site/footer";
import { COOKIE_NAME, verifyGateCookie } from "@/lib/gate/cookie";
import { GateClient } from "@/components/gate/gate-client";

interface EstimationPageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ verify?: string }>;
}

export default async function EstimationGatePage({
  params,
  searchParams,
}: EstimationPageProps) {
  const [{ locale }, { verify }] = await Promise.all([params, searchParams]);
  setRequestLocale(locale);

  // Already verified visitors skip the gate entirely.
  const jar = await cookies();
  if (verifyGateCookie(jar.get(COOKIE_NAME)?.value)) {
    redirect(`/${locale}/estimation/tool`);
  }

  const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? null;

  return (
    <>
      <SiteNav />
      <main className="flex-1">
        <GateClient
          locale={locale === "en" ? "en" : "fr"}
          turnstileSiteKey={turnstileSiteKey}
          verifyStatus={
            verify === "expired" || verify === "invalid" || verify === "error"
              ? verify
              : null
          }
        />
      </main>
      <SiteFooter />
    </>
  );
}
