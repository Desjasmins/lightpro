import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

const LIGHTBASE_URL = "https://www.lightbase.ca/";

export function SiteFooter() {
  const t = useTranslations("Footer");
  const year = new Date().getFullYear();

  return (
    <footer className="bg-black text-white border-t border-white/10 pt-16 pb-10">
      <div className="lb-container grid gap-12 md:grid-cols-12">
        <div className="md:col-span-4 space-y-6">
          <a
            href={LIGHTBASE_URL}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Lightbase"
          >
            <Image
              src="/lightbase/logo-light.png"
              alt="Lightbase"
              width={186}
              height={35}
              className="h-7 w-auto"
            />
          </a>
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
          <a
            href={LIGHTBASE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-white/72 hover:text-white"
          >
            {t("privacy")}
          </a>
          <a
            href={LIGHTBASE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-white/72 hover:text-white"
          >
            {t("terms")}
          </a>
          <a
            href={LIGHTBASE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-white/72 hover:text-white"
          >
            {t("dataRequest")}
          </a>
        </nav>
      </div>

      <div className="lb-container mt-16 border-t border-white/10 pt-6 text-xs text-white/40">
        ©{" "}
        <a
          href={LIGHTBASE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-white/60"
        >
          {year} Lightbase
        </a>
        . {t("rights")}
      </div>
    </footer>
  );
}
