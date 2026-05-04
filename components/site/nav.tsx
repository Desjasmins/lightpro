"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { useParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { Menu, X } from "lucide-react";

export function SiteNav() {
  const t = useTranslations("Nav");
  const pathname = usePathname();
  const params = useParams<{ locale: string }>();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const otherLocale = params.locale === "fr" ? "en" : "fr";

  return (
    <header
      className={cn(
        "fixed top-0 inset-x-0 z-50 transition-[background-color,backdrop-filter] duration-300",
        scrolled
          ? "bg-black/85 backdrop-blur-md backdrop-saturate-150 border-b border-white/10"
          : "bg-transparent",
      )}
    >
      <div className="lb-container flex items-center justify-between h-16">
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/lightbase/logo-light.png"
            alt="Lightbase"
            width=    {186}
            height={35}
            className="h-7 w-auto invert-0"
            priority
          />
        </Link>

        <nav className="hidden md:flex items-center gap-8 text-sm">
          <Link href="/#solutions" className="text-white/80 hover:text-white transition">
            {t("solutions")}
          </Link>
          <Link href="/#sectors" className="text-white/80 hover:text-white transition">
            {t("sectors")}
          </Link>
          <Link href={pathname} locale={otherLocale} className="text-white/60 hover:text-white transition">
            {t("languageToggle")}
          </Link>
          <Link
            href="/estimation"
            className="inline-flex items-center gap-2 px-5 py-2 rounded-full border border-white text-white text-sm font-medium hover:bg-white hover:text-black transition"
          >
            {t("estimate")}
          </Link>
        </nav>

        <button
          type="button"
          aria-label="Menu"
          onClick={() => setOpen((v) => !v)}
          className="md:hidden text-white"
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {open ? (
        <div className="md:hidden bg-black/95 border-t border-white/10">
          <div className="lb-container py-4 flex flex-col gap-4">
            <Link href="/#solutions" onClick={() => setOpen(false)} className="text-white/80">
              {t("solutions")}
            </Link>
            <Link href="/#sectors" onClick={() => setOpen(false)} className="text-white/80">
              {t("sectors")}
            </Link>
            <Link href={pathname} locale={otherLocale} onClick={() => setOpen(false)} className="text-white/60">
              {t("languageToggle")}
            </Link>
            <Link
              href="/estimation"
              onClick={() => setOpen(false)}
              className="inline-flex items-center justify-center px-5 py-2 rounded-full border border-white text-white"
            >
              {t("estimate")}
            </Link>
          </div>
        </div>
      ) : null}
    </header>
  );
}
