import Image from "next/image";
import { useTranslations } from "next-intl";

const sectors = [
  { key: "education", img: "/lightbase/sector-education.png" },
  { key: "healthcare", img: "/lightbase/sector-healthcare.jpg" },
  { key: "hospitality", img: "/lightbase/sector-hospitality.png" },
  { key: "agriculture", img: "/lightbase/sector-agriculture.jpg" },
  { key: "industrial", img: "/lightbase/sector-industrial.jpg" },
  { key: "public", img: "/lightbase/sector-public.png" },
  { key: "residential", img: "/lightbase/sector-residential.jpg" },
  { key: "retail", img: "/lightbase/sector-retail.png" },
] as const;

export function Sectors() {
  const t = useTranslations("Sectors");

  return (
    <section id="sectors" className="bg-black text-white py-24 md:py-32 border-t border-white/10">
      <div className="lb-container">
        <div className="grid gap-8 md:grid-cols-12 mb-12">
          <div className="md:col-span-4">
            <p className="lb-eyebrow">{t("eyebrow")}</p>
          </div>
          <div className="md:col-span-8">
            <h2 className="lb-h1">{t("title")}</h2>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {sectors.map((s) => (
            <article key={s.key} className="group">
              <div className="relative aspect-square overflow-hidden bg-lb-ink-2">
                <Image
                  src={s.img}
                  alt=""
                  fill
                  sizes="(min-width: 768px) 25vw, 50vw"
                  className="object-cover transition duration-700 group-hover:scale-[1.04]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                <div className="absolute bottom-0 inset-x-0 p-4">
                  <h3 className="text-white text-sm font-medium tracking-tight">
                    {t(s.key)}
                  </h3>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
