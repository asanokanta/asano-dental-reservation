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
                href="/reserve"
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

        {/* Mobile Menu */}
        <div
          className={`lg:hidden overflow-hidden transition-all duration-300 ${
            menuOpen ? "max-h-96 border-t border-cream-muted" : "max-h-0"
          } bg-cream`}
        >
          <div className="px-3 py-1.5">
            <nav className="flex flex-col">
              {navItems.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  onClick={(e) => { e.preventDefault(); handleNavClick(item.href); }}
                  className="block px-2 py-1 text-warm hover:text-brand hover:bg-accent-light rounded-md transition-colors text-[13px] font-medium leading-tight"
                >
                  {item.label}
                </a>
              ))}
            </nav>
            <div className="mt-1 pt-1 border-t border-cream-muted flex flex-col gap-1">
              <a
                href="tel:03-3913-4618"
                className="flex items-center gap-2 px-2 py-1 text-warm hover:text-brand rounded-md transition-colors text-[13px] leading-tight"
              >
                <Phone className="w-3.5 h-3.5 text-brand shrink-0" />
                <span className="font-bold">03-3913-4618</span>
              </a>
              <a
                href="/reserve"
                className="flex items-center justify-center gap-1.5 bg-brand text-white py-2 rounded-lg font-bold text-[13px] leading-tight"
              >
                <Calendar className="w-4 h-4" />
                24時間ネット予約
              </a>
            </div>
          </div>
        </div>
      </header>
    </>
  );
}
