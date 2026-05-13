import Image from "next/image";
import { useTranslations } from "next-intl";

export function Solutions() {
  const t = useTranslations("Solutions");

  const products = [
    {
      key: "om300",
      img: "/lightbase/lb-solutions-om400-stack.jpg",
      modules: ["SIMPLE", "DOUBLE", "QUADRUPLE"],
      available: true,
    },
    {
      key: "om400",
      img: "/lightbase/lb-solutions-om300-pole.jpg",
      modules: ["SIMPLE"],
      available: true,
    },
  ] as const;

  const specs = [
    t("specs.lifetime"),
    t("specs.warranty"),
    t("specs.efficiency"),
    t("specs.temperature"),
  ];

  return (
    <section id="solutions" className="bg-black text-white py-24 md:py-32">
      <div className="lb-container">
        <div className="grid gap-8 md:grid-cols-12 mb-16">
          <div className="md:col-span-4">
            <p className="lb-eyebrow">{t("eyebrow")}</p>
          </div>
          <div className="md:col-span-8 space-y-4">
            <h2 className="lb-h1">{t("title")}</h2>
            <p className="lb-lede">{t("subtitle")}</p>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 mb-16">
          {products.map((p) => (
            <article key={p.key} className="group">
              <div className="relative aspect-[4/3] overflow-hidden bg-lb-ink-2">
                <Image
                  src={p.img}
                  alt=""
                  fill
                  sizes="(min-width: 768px) 50vw, 100vw"
                  className="object-cover transition duration-700 group-hover:scale-[1.04]"
                />
              </div>
              <div className="pt-6 space-y-2">
                <h3 className="lb-h3 text-white">{t(`${p.key}.name`)}</h3>
                <p className="lb-tagline">{t(`${p.key}.tagline`)}</p>
              </div>
            </article>
          ))}
        </div>

        <hr className="lb-rule" />
        <ul className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-10">
          {specs.map((s) => (
            <li key={s} className="text-sm text-white/72 leading-snug">
              {s}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
