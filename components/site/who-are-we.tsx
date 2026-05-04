import { useTranslations } from "next-intl";

export function WhoAreWe() {
  const t = useTranslations("WhoAreWe");

  return (
    <section className="lb-light-section py-24 md:py-32">
      <div className="lb-container grid gap-12 md:grid-cols-12">
        <div className="md:col-span-4">
          <p className="lb-eyebrow">{t("eyebrow")}</p>
        </div>
        <div className="md:col-span-8 space-y-6">
          <h2 className="lb-h1">{t("title")}</h2>
          <p className="lb-lede">{t("body")}</p>
        </div>
      </div>
    </section>
  );
}
