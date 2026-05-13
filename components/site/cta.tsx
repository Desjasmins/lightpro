import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { ArrowRight } from "lucide-react";

export function CTA() {
  const t = useTranslations("CTA");

  return (
    <section className="relative isolate overflow-hidden bg-black text-white py-32 md:py-40">
      <Image
        src="/lightbase/lb-cta-pickleball-night.jpg"
        alt=""
        fill
        sizes="100vw"
        className="object-cover opacity-60"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-black/30" />
      <div className="lb-container relative z-10 max-w-3xl">
        <h2 className="lb-h1">{t("title")}</h2>
        <p className="lb-lede mt-6">{t("subtitle")}</p>
        <Link
          href="/estimation"
          className="mt-10 inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-white text-black text-sm font-medium hover:bg-white/90 transition"
        >
          {t("button")}
          <ArrowRight size={16} />
        </Link>
      </div>
    </section>
  );
}
