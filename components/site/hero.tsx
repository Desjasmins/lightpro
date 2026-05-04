import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { ArrowRight } from "lucide-react";

export function Hero() {
  const t = useTranslations("Hero");

  return (
    <section className="relative isolate min-h-[88vh] flex items-end overflow-hidden bg-black">
      <Image
        src="/lightbase/hero-image.jpg"
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover opacity-80"
      />
      <div className="absolute inset-0 lb-hero-veil" />
      <div className="lb-container relative z-10 pb-24 pt-32">
        <p className="lb-eyebrow text-white/70 mb-6">{t("eyebrow")}</p>
        <h1 className="lb-display text-white max-w-4xl">{t("title")}</h1>
        <p className="lb-lede text-white/80 mt-6 max-w-2xl">{t("subtitle")}</p>
        <div className="mt-10 flex flex-wrap items-center gap-4">
          <Link
            href="/estimation"
            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-white text-black text-sm font-medium hover:bg-white/90 transition"
          >
            {t("cta")}
            <ArrowRight size={16} />
          </Link>
          <Link
            href="#solutions"
            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full border border-white/40 text-white text-sm font-medium hover:bg-white/10 transition"
          >
            {t("ctaSecondary")}
          </Link>
        </div>
      </div>
    </section>
  );
}
