import Image from "next/image";
import { useTranslations } from "next-intl";

const sectors = [
  { key: "soccer", img: "/lightbase/lb-sector-soccer.png" },
  { key: "soccerAerial", img: "/lightbase/lb-sector-soccer-aerial.png" },
  { key: "soccerPark", img: "/lightbase/lb-sector-soccer-park.png" },
  { key: "pickleball", img: "/lightbase/lb-sector-pickleball.png" },
  { key: "pickleballPark", img: "/lightbase/lb-sector-pickleball-park.png" },
  { key: "schoolFields", img: "/lightbase/lb-sector-school-fields.png" },
  { key: "schoolComplex", img: "/lightbase/lb-sector-school-complex.png" },
  { key: "nightFields", img: "/lightbase/lb-sector-night-fields.png" },
  { key: "multiField", img: "/lightbase/lb-sector-multi-field.png" },
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
                {/* Subtle gradient just under the label for readability —
                    keeps the image largely unobscured. */}
                <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/40 to-transparent" />
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
