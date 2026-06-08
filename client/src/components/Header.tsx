/**
 * Header Component — あさの歯科
 * Design: Premium Dental Brand × Modern Elegance
 * - White background with forest green accent
 * - Logo (professional lion badge) left, phone + CTA button right
 * - Sticky on scroll with subtle shadow
 * - Mobile: hamburger menu
 */
import { useState, useEffect } from "react";
import { Phone, Menu, X, Calendar } from "lucide-react";

const navItems = [
  { label: "お知らせ", href: "#news" },
  { label: "当院の特徴", href: "#features" },
  { label: "診療案内", href: "#services" },
  { label: "料金表", href: "#pricing" },
  { label: "診療時間", href: "#hours" },
  { label: "院長紹介", href: "#doctor" },
  { label: "求人案内", href: "#recruit" },
  { label: "アクセス", href: "#access" },
];

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleNavClick = (href: string) => {
    setMenuOpen(false);
    const el = document.querySelector(href);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <>
      <header
        className={`site-header fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled ? "bg-cream shadow-md shadow-brand/5" : "bg-cream/95 backdrop-blur-sm"
        }`}
      >
        <div className="max-w-[1200px] mx-auto px-0 sm:px-6 md:px-6">
          <div className="flex items-end md:items-center justify-between min-h-[var(--header-mobile-bar)] md:h-20 pl-3 pr-3 sm:px-0 max-md:pb-1">
            {/* Logo + Title（モバイルは左詰め・少し下寄せ） */}
            <a
              href="#top"
              onClick={(e) => {
                e.preventDefault();
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className="flex items-center justify-start gap-2 md:gap-3 group min-w-0 shrink mr-2 max-md:pt-0.5"
            >
              <img
                src="/images/asano-logo.png"
                alt="あさの歯科 ロゴ"
                className="h-9 w-9 md:h-14 md:w-14 flex-shrink-0 rounded-full object-cover ring-2 ring-brand/15"
              />
              <span
                className="font-bold text-brand text-[0.9375rem] md:text-2xl tracking-wide leading-none whitespace-nowrap group-hover:text-brand-dark transition-colors"
                style={{ fontFamily: "'Zen Maru Gothic', sans-serif" }}
              >
                あさの歯科
              </span>
            </a>

            {/* Desktop Nav */}
            <nav className="hidden lg:flex items-center gap-6">
              {navItems.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  onClick={(e) => { e.preventDefault(); handleNavClick(item.href); }}
                  className="text-sm text-warm-muted hover:text-brand transition-colors duration-200 font-medium relative group"
                >
                  {item.label}
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-brand transition-all duration-200 group-hover:w-full" />
                </a>
              ))}
            </nav>

            {/* Right: Phone + CTA */}
            <div className="flex items-center gap-2 md:gap-3">
              <a
                href="tel:03-3913-4618"
                className="hidden sm:flex items-center gap-1.5 text-warm hover:text-brand transition-colors"
              >
                <Phone className="w-4 h-4 text-brand" />
                <span className="text-sm font-bold tracking-wide">03-3913-4618</span>
              </a>
              <a
                href="/booking"
                className="hidden sm:flex items-center gap-1.5 bg-brand hover:bg-brand-dark text-white text-sm font-bold px-4 py-2 rounded-full transition-all duration-200 btn-press shadow-sm"
              >
                <Calendar className="w-4 h-4" />
                24時間ネット予約
              </a>

              {/* Mobile menu toggle */}
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="lg:hidden p-2 rounded-lg text-warm-muted hover:text-brand hover:bg-cream-light transition-colors"
                aria-label="メニュー"
              >
                {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

      </header>

      {/* Mobile Menu — full-bg overlay, content ends at 90vh */}
      <div
        className={`lg:hidden fixed inset-0 z-40 bg-cream transition-opacity duration-300 ${
          menuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        style={{ paddingTop: "var(--header-offset-mobile)" }}
      >
        {/* コンテンツ領域：90vh - ヘッダー高さ に収める */}
        <div
          className="flex flex-col px-5 overflow-hidden"
          style={{ height: "calc(90vh - var(--header-offset-mobile))" }}
        >
          {/* Nav links — 均等に伸縮 */}
          <nav className="flex flex-col flex-1 justify-evenly py-2">
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={(e) => { e.preventDefault(); handleNavClick(item.href); }}
                className="flex items-center px-3 py-0 text-[1.05rem] font-bold text-warm hover:text-brand hover:bg-accent-light rounded-xl transition-colors border-b border-cream-muted last:border-none min-h-[2.75rem]"
              >
                {item.label}
              </a>
            ))}
          </nav>

          {/* Bottom CTAs */}
          <div className="flex flex-col gap-2.5 pb-4">
            <a
              href="tel:03-3913-4618"
              className="flex items-center justify-center gap-2.5 py-3.5 bg-card border border-cream-muted rounded-2xl text-warm font-bold text-[1rem] hover:bg-accent-light transition-colors"
              onClick={() => setMenuOpen(false)}
            >
              <Phone className="w-5 h-5 text-brand flex-shrink-0" />
              03-3913-4618
            </a>
            <a
              href="/booking"
              className="flex items-center justify-center gap-2.5 py-3.5 bg-brand hover:bg-brand-dark text-white rounded-2xl font-bold text-[1rem] transition-colors shadow-lg shadow-brand/25"
              onClick={() => setMenuOpen(false)}
            >
              <Calendar className="w-5 h-5 flex-shrink-0" />
              24時間ネット予約
            </a>
          </div>
        </div>
      </div>
    </>
  );
}
