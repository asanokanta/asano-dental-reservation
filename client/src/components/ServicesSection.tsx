/**
 * ServicesSection Component — あさの歯科
 * Design: Soft Minimalism × Japanese Breathing Space
 * - 4 service cards in 2x2 grid
 * - Image + title + description
 * - Mint green accent
 * - Scroll-triggered fade-in
 */
import { useEffect, useRef } from "react";
import { Stethoscope, Shield, Sparkles, Zap } from "lucide-react";
import { m } from "@/lib/mobileLayout";

const services = [
  {
    icon: Stethoscope,
    title: "一般歯科",
    subtitle: "General Dentistry",
    description: "虫歯・歯周病・入れ歯など、お口に関するあらゆるお悩みに対応します。痛みの少ない治療を心がけ、患者様のご負担を最小限に抑えます。",
    image: "/images/service-general.png",
    tags: ["虫歯治療", "歯周病", "入れ歯", "抜歯"],
    color: "#66BB6A",
  },
  {
    icon: Shield,
    title: "予防歯科",
    subtitle: "Preventive Dentistry",
    description: "定期検診とプロによるクリーニング（PMTC）で、虫歯・歯周病を未然に防ぎます。健康なお口を長く保つための、最も大切な診療です。",
    image: "/images/service-preventive.png",
    tags: ["定期検診", "PMTC", "フッ素塗布", "口腔指導"],
    color: "#8BC34A",
  },
  {
    icon: Sparkles,
    title: "ホワイトニング",
    subtitle: "Whitening",
    description: "歯を削らずに理想の白さへ。オフィスホワイトニングとホームホワイトニングをご用意。自信あふれる笑顔のために、あなたに合ったプランをご提案します。",
    image: "/images/service-whitening-v2.png",
    tags: ["オフィス", "ホーム", "コンビネーション"],
    color: "#C5A832",
  },
  {
    icon: Zap,
    title: "インプラント",
    subtitle: "Implant",
    description: "3DデジタルCTによる精密な診断で、安全・確実なインプラント治療を提供します。天然歯に近い見た目と噛み心地を実現する「第二の永久歯」です。",
    image: "/images/service-implant-v2.png",
    tags: ["3D-CT診断", "精密治療", "審美性"],
    color: "#66BB6A",
  },
];

export default function ServicesSection() {
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
      { threshold: 0.1 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section id="services" className={`${m.sectionPy} bg-cream-light`} ref={sectionRef}>
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
        {/* Section Header */}
        <div className={`${m.sectionHeadLg} fade-in-up`}>
          <p className={m.sectionLabel}>Services</p>
          <h2 className={m.sectionTitle} style={{ fontFamily: "'Noto Serif JP', serif" }}>
            診療案内
          </h2>
          <p className={m.sectionLead}>
            一般歯科から専門的な治療まで、幅広い診療に対応しています。
          </p>
          <div className="w-12 h-1 bg-brand rounded-full mx-auto mt-3 md:mt-4" />
        </div>

        {/* Service Cards */}
        <div className={`grid grid-cols-1 md:grid-cols-2 ${m.gapMd}`}>
          {services.map((service, i) => {
            const Icon = service.icon;
            return (
              <div
                key={service.title}
                className={`fade-in-up stagger-${i + 1} card-hover bg-card rounded-xl md:rounded-2xl overflow-hidden border border-cream-muted shadow-sm`}
              >
                {/* Image Section */}
                <div className="h-24 sm:h-32 md:h-56 overflow-hidden bg-white">
                  <img
                    src={service.image}
                    alt={service.title}
                    className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                  />
                </div>

                {/* Content */}
                <div className="p-3 md:p-6">
                  <div className="flex items-center gap-1.5 md:gap-3 mb-1.5 md:mb-3">
                    <div
                      className="w-7 h-7 md:w-9 md:h-9 rounded-lg md:rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: service.color + "15" }}
                    >
                      <Icon className="w-3.5 h-3.5 md:w-5 md:h-5" style={{ color: service.color }} />
                    </div>
                    <div className="min-w-0">
                      <h3
                        className="text-xs md:text-lg font-bold text-warm leading-tight"
                        style={{ fontFamily: "'Noto Serif JP', serif" }}
                      >
                        {service.title}
                      </h3>
                      <p className="hidden md:block text-xs font-medium" style={{ color: service.color }}>
                        {service.subtitle}
                      </p>
                    </div>
                  </div>

                  <p className={`${m.body} mb-2 md:mb-4 line-clamp-3 md:line-clamp-none`}>
                    {service.description}
                  </p>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1 md:gap-1.5">
                    {service.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-[10px] md:text-xs px-1.5 py-0.5 md:px-2.5 md:py-1 rounded-full font-medium"
                        style={{
                          backgroundColor: service.color + "15",
                          color: service.color,
                        }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
