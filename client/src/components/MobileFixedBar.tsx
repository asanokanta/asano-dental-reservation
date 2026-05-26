/**
 * MobileFixedBar Component — あさの歯科
 * Design: Premium Dental Brand × Modern Elegance
 * - Fixed bottom bar on mobile only
 * - "電話をかける" (left) + "ネット予約" (right)
 * - Appears after scrolling past hero
 */
import { useEffect, useState } from "react";
import { Phone, Calendar } from "lucide-react";

export default function MobileFixedBar() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setVisible(window.scrollY > 300);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      {/* Mobile Fixed Bottom Bar */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-50 md:hidden transition-transform duration-300 ${
          visible ? "translate-y-0" : "translate-y-full"
        }`}
      >
        {/* Safe area padding for iOS */}
        <div className="bg-cream border-t border-cream-muted shadow-2xl pb-safe">
          <div className="flex">
            <a
              href="tel:03-3913-4618"
              className="flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5 bg-card hover:bg-accent-light active:bg-cream-muted transition-colors border-r border-cream-muted"
            >
              <Phone className="w-5 h-5 text-brand" />
              <span className="text-xs font-bold text-warm">電話をかける</span>
              <span className="text-[10px] text-warm-muted/80">03-3913-4618</span>
            </a>
            <a
              href="/reserve"
              className="flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5 bg-brand hover:bg-brand-dark active:bg-brand-dark transition-colors"
            >
              <Calendar className="w-5 h-5 text-white" />
              <span className="text-xs font-bold text-white">ネット予約</span>
              <span className="text-[10px] text-white/80">24時間受付</span>
            </a>
          </div>
        </div>
      </div>

      {/* Spacer to prevent content from being hidden behind fixed bar on mobile */}
      <div className="h-16 md:hidden" />
    </>
  );
}
