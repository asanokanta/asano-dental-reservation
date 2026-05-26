/**
 * FeaturesSection Component — あさの歯科
 * Design: Soft Minimalism × Japanese Breathing Space
 * - 3 feature cards with editorial photo crops
 * - Icon + title + description
 * - Mint green accent icons
 * - Scroll-triggered fade-in animation
 */
import { useEffect, useRef } from "react";
import { MapPin, Microscope, CalendarCheck } from "lucide-react";
import { m } from "@/lib/mobileLayout";

const features = [
  {
    icon: MapPin,
    title: "アクセス抜群",
    subtitle: "通いやすい立地",
    description:
      "東京メトロ南北線「王子神谷駅」2番出口から徒歩わずか2分。お仕事帰りや買い物のついでにも、無理なく通院いただけます。黄色いライオンの看板が目印です。",
    color: "#66BB6A",
    bg: "#F1F8E9",
    image: "/images/features/entrance.png",
    imagePosition: "center 55%",
    alt: "あさの歯科の入り口 — 黄色いライオンの看板",
  },
  {
    icon: Microscope,
    title: "最新のデジタル設備",
    subtitle: "精密な治療を提供",
    description:
      "3DデジタルCTや口腔内スキャナー、マイクロスコープを完備。最先端のデジタル技術を駆使することで、より正確で精密な診断・治療を実現しています。",
    color: "#7CB87A",
    bg: "#F5FAF0",
    image: "/images/features/digital-equipment.png",
    imagePosition: "center center",
    alt: "デジタル診療設備 — CT・モニター完備の診療室",
  },
  {
    icon: CalendarCheck,
    title: "安心の完全予約制",
    subtitle: "一人ひとりに丁寧な診療",
    description:
      "患者様お一人おひとりの診療時間をしっかり確保するため、完全アポイント制を採用。待ち時間を最小限に抑え、ゆったりとした環境で治療を受けていただけます。",
    color: "#8BC34A",
    bg: "#F5FBE9",
    image: "/images/features/reception.png",
    imagePosition: "72% center",
    alt: "受付カウンター — 清潔で落ち着いた院内",
  },
];

export default function FeaturesSection() {
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const cards = entry.target.querySelectorAll(".fade-in-up");
            cards.forEach((card) => card.classList.add("visible"));
          }
        });
      },
      { threshold: 0.15 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section id="features" className={`${m.sectionPy} bg-cream`} ref={sectionRef}>
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
        {/* Section Header */}
        <div className={`${m.sectionHeadLg} fade-in-up`}>
          <p className={m.sectionLabel}>Our Features</p>
          <h2 className={m.sectionTitle} style={{ fontFamily: "'Noto Serif JP', serif" }}>
            当院の3つの特徴
          </h2>
          <div className="w-12 h-1 bg-brand rounded-full mx-auto" />
        </div>

        {/* Feature Cards */}
        <div className={`grid grid-cols-1 md:grid-cols-3 ${m.gapMd} md:gap-8`}>
          {features.map((feature, i) => {
            const Icon = feature.icon;
            return (
              <article
                key={feature.title}
                className={`fade-in-up stagger-${i + 1} group card-hover flex flex-col overflow-hidden rounded-2xl border border-cream-muted/80 bg-white shadow-sm shadow-warm/5`}
              >
                {/* Photo */}
                <div className="relative aspect-[4/3] md:aspect-[5/4] overflow-hidden bg-cream-muted">
                  <img
                    src={feature.image}
                    alt={feature.alt}
                    className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
                    style={{ objectPosition: feature.imagePosition }}
                    loading="lazy"
                    decoding="async"
                  />
                  <div
                    className="pointer-events-none absolute inset-0 bg-gradient-to-t from-warm/50 via-warm/10 to-transparent"
                    aria-hidden
                  />
                  <div
                    className="absolute left-4 top-4 flex h-11 w-11 items-center justify-center rounded-xl bg-white/90 shadow-md backdrop-blur-sm"
                    style={{ color: feature.color }}
                  >
                    <Icon className="h-5 w-5" strokeWidth={2.25} />
                  </div>
                  <p
                    className="absolute bottom-3 left-4 text-xs font-bold tracking-widest text-white/90"
                    style={{ textShadow: "0 1px 8px rgba(0,0,0,0.35)" }}
                  >
                    0{i + 1}
                  </p>
                </div>

                {/* Text */}
                <div className="flex flex-1 flex-col p-4 md:p-7" style={{ backgroundColor: feature.bg }}>
                  <h3
                    className="text-base md:text-xl font-bold text-warm mb-0.5 md:mb-1"
                    style={{ fontFamily: "'Noto Serif JP', serif" }}
                  >
                    {feature.title}
                  </h3>
                  <p className="text-xs md:text-sm font-medium mb-2 md:mb-3" style={{ color: feature.color }}>
                    {feature.subtitle}
                  </p>
                  <p className={`${m.body} flex-1`}>
                    {feature.description}
                  </p>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
