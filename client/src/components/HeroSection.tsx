/**
 * HeroSection Component — あさの歯科
 * Design: Soft Minimalism × Japanese Breathing Space
 * - Split layout: left text panel (white bg), right image
 * - Dark text on white background for maximum readability
 * - Mint green accent elements
 */
import { useEffect, useRef } from "react";
import { Phone, Calendar, MapPin, ChevronDown } from "lucide-react";
import { m } from "@/lib/mobileLayout";

const HERO_IMAGE = "https://d2xsxph8kpxj0f.cloudfront.net/310519663691633446/jDB9T7x4VrBkagcFGPCM8B/hero-dental-Vg9RigzfBTwCWGtziPFgk2.webp";

export default function HeroSection() {
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;
    const timer = setTimeout(() => {
      el.querySelectorAll(".fade-in-up").forEach((child, i) => {
        setTimeout(() => child.classList.add("visible"), i * 80);
      });
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <section
      id="top"
      className="relative min-h-0 md:min-h-screen flex flex-col md:flex-row pt-[var(--header-offset-mobile)] md:pt-[var(--header-offset-desktop)] overflow-hidden"
    >
      {/* Left: Text Panel */}
      <div
        ref={contentRef}
        className="relative z-10 flex flex-col justify-center w-full md:w-1/2 lg:w-[52%] bg-cream px-4 sm:px-10 lg:px-16 py-8 md:py-20"
      >
        {/* Badge */}
        <div className="fade-in-up inline-flex items-center gap-1.5 bg-accent-light border border-accent/50 text-brand-dark text-[11px] md:text-xs font-bold px-2.5 py-1 md:px-3 md:py-1.5 rounded-full mb-3 md:mb-5 w-fit">
          <MapPin className="w-3 h-3 md:w-3.5 md:h-3.5" />
          王子神谷駅2番出口から徒歩2分
        </div>

        {/* Clinic Name */}
        <p className="fade-in-up text-brand text-xs md:text-sm font-bold tracking-widest mb-2 md:mb-3 uppercase">
          Asano Dental Clinic
        </p>

        {/* Main Headline */}
        <h1
          className="fade-in-up text-[1.35rem] leading-tight sm:text-4xl lg:text-5xl font-bold text-warm sm:leading-snug mb-3 md:mb-5"
          style={{ fontFamily: "'Noto Serif JP', serif" }}
        >
          <span className="text-brand">王子神谷駅から</span>
          <br />
          <span className="text-brand">徒歩2分。</span>
          <br />
          お口の健康を優しく守る、
          <br />
          街のかかりつけ医
        </h1>

        {/* Sub text */}
        <p className={`fade-in-up ${m.body} mb-5 md:mb-8 max-w-md`}>
          東京都北区王子にある「あさの歯科」は、地域の皆様のお口の健康を
          22年以上にわたってお守りしてきた歯科医院です。
        </p>

        {/* CTA Buttons */}
        <div className="fade-in-up flex flex-col sm:flex-row gap-2.5 md:gap-3 mb-4 md:mb-6">
          <a
            href="/booking"
            className="flex items-center justify-center gap-2 bg-brand hover:bg-brand-dark text-white font-bold px-5 py-3 md:px-6 md:py-3.5 rounded-xl md:rounded-2xl transition-all duration-200 btn-press shadow-lg shadow-brand/25 text-xs md:text-sm"
          >
            <Calendar className="w-4 h-4" />
            24時間ネット予約
          </a>
          <a
            href="tel:03-3913-4618"
            className="flex items-center justify-center gap-2 bg-card hover:bg-accent-light text-warm font-bold px-5 py-3 md:px-6 md:py-3.5 rounded-xl md:rounded-2xl transition-all duration-200 btn-press shadow-md border border-cream-muted text-xs md:text-sm"
          >
            <Phone className="w-4 h-4 text-brand" />
            03-3913-4618
          </a>
        </div>

        {/* Info chips */}
        <div className="fade-in-up flex flex-wrap gap-1.5 md:gap-2">
          {["完全予約制", "3D デジタルCT完備", "口腔内スキャナー導入", "マイクロスコープ完備"].map((tag) => (
            <span
              key={tag}
              className="text-[10px] md:text-xs bg-accent-light border border-cream-muted text-warm-muted px-2 py-0.5 md:px-3 md:py-1 rounded-full font-medium"
            >
              {tag}
            </span>
          ))}
        </div>

        {/* Scroll indicator — desktop only */}
        <div className="hidden md:flex items-center gap-2 mt-10 text-warm-muted/80">
          <ChevronDown className="w-4 h-4 animate-bounce" />
          <span className="text-xs">スクロールして詳細を見る</span>
        </div>
      </div>

      {/* Right: Image Panel */}
      <div className="relative w-full md:w-1/2 lg:w-[48%] h-48 sm:h-80 md:h-auto">
        <img
          src={HERO_IMAGE}
          alt="あさの歯科 院内 歯科衛生士"
          className="w-full h-full object-cover object-center"
        />
        {/* Subtle overlay */}
        <div className="absolute inset-0 bg-gradient-to-l from-transparent to-cream/20" />

        {/* Floating info card */}
        <div className="absolute bottom-4 left-4 right-4 md:bottom-8 md:left-8 md:right-8">
          <div className="bg-card/95 backdrop-blur-sm rounded-xl md:rounded-2xl p-3 md:p-4 shadow-lg border border-cream-muted/80">
            <div className="flex items-center gap-2.5 md:gap-3">
              <div className="w-9 h-9 md:w-10 md:h-10 rounded-xl bg-brand/15 flex items-center justify-center flex-shrink-0">
                <MapPin className="w-4 h-4 md:w-5 md:h-5 text-brand" />
              </div>
              <div>
                <p className="text-[10px] md:text-xs text-warm-muted font-medium">住所</p>
                <p className="text-xs md:text-sm font-bold text-warm">東京都北区王子5-5-3</p>
                <p className="text-[10px] md:text-xs text-warm-muted">シーメゾン王子神谷101</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile scroll indicator */}
      <div className="md:hidden absolute bottom-4 left-1/2 -translate-x-1/2 z-20">
        <ChevronDown className="w-5 h-5 text-brand animate-bounce" />
      </div>
    </section>
  );
}
