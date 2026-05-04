import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

export function SiteFooter() {
  const t = useTranslations("Footer");
  const year = new Date().getFullYear();

  return (
    <footer className="bg-black text-white border-t border-white/10 pt-16 pb-10">
      <div className="lb-container grid gap-12 md:grid-cols-12">
        <div className="md:col-span-4 space-y-6">
          <Image
            src="/lightbase/logo-light.png"
            alt="Lightbase"
            width={186}
            height={35}
            className="h-7 w-auto"
          />
          <p className="text-sm text-white/60 max-w-xs leading-relaxed">
            {t("address")}
          </p>
        </div>

        <nav className="md:col-span-4 grid grid-cols-1 gap-3 text-sm">
          <Link href="/#solutions" className="text-white/72 hover:text-white">
            Solutions
          </Link>
          <Link href="/#sectors" className="text-white/72 hover:text-white">
            Sectors
          </Link>
          <Link href="/estimation" className="text-white/72 hover:text-white">
            Estimation
          </Link>
        </nav>

        <nav className="md:col-span-4 grid grid-cols-1 gap-3 text-sm">
          <Link href="/legal/privacy" className="text-white/72 hover:text-white">
            {t("privacy")}
          </Link>
          <Link href="/legal/terms" className="text-white/72 hover:text-white">
            {t("terms")}
          </Link>
          <Link href="/legal/data-request" className="text-white/72 hover:text-white">
            {t("dataRequest")}
          </Link>
        </nav>
      </div>

      <div className="lb-container mt-16 border-t border-white/10 pt-6 text-xs text-white/40">
        © {year} Lightbase. {t("rights")}
      </div>
    </footer>
  );
}
