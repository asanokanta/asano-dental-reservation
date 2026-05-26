/**
 * Footer Component — あさの歯科
 * Design: Soft Minimalism × Japanese Breathing Space
 * - Clean footer with clinic info
 * - Copyright + privacy policy link
 * - Mint green accent
 */
import { Phone, MapPin, Clock } from "lucide-react";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-footer text-warm-muted">
      {/* Main Footer */}
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-8 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-12">
          {/* Clinic Info */}
          <div>
            <div className="flex items-center gap-2 mb-3 md:mb-4">
              <div className="w-8 h-8 rounded-full bg-brand flex items-center justify-center flex-shrink-0">
                <svg viewBox="0 0 24 24" fill="white" className="w-5 h-5">
                  <path d="M12 2C8.5 2 6 4.5 6 7c0 1.5.5 2.8 1.3 3.8C6.5 12 6 13.5 6 15c0 3.3 2.7 6 6 6s6-2.7 6-6c0-1.5-.5-3-1.3-4.2C17.5 9.8 18 8.5 18 7c0-2.5-2.5-5-6-5zm0 2c2.2 0 4 1.8 4 3 0 1-.4 1.8-1 2.4-.3.3-.5.7-.5 1.1 0 .4.2.8.5 1.1.6.6 1 1.5 1 2.4 0 2.2-1.8 4-4 4s-4-1.8-4-4c0-.9.4-1.8 1-2.4.3-.3.5-.7.5-1.1 0-.4-.2-.8-.5-1.1C8.4 8.8 8 8 8 7c0-1.2 1.8-3 4-3z"/>
                </svg>
              </div>
              <div>
                <p className="text-white font-bold text-base md:text-lg" style={{ fontFamily: "'Noto Serif JP', serif" }}>
                  あさの歯科
                </p>
                <p className="text-warm-muted/80 text-xs">Asano Dental Clinic</p>
              </div>
            </div>
            <p className="text-warm-muted/80 text-xs md:text-sm leading-normal md:leading-relaxed">
              東京都北区王子にある地域密着型の歯科医院です。
              一般歯科から予防歯科、インプラント、ホワイトニングまで
              幅広い診療に対応しています。
            </p>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-white font-bold mb-3 md:mb-4 text-sm tracking-wide">診療情報</h3>
            <div className="space-y-2 md:space-y-3">
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-brand mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm text-warm-muted">東京都北区王子5-5-3</p>
                  <p className="text-sm text-warm-muted">シーメゾン王子神谷101</p>
                </div>
              </div>
              <div className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-brand flex-shrink-0" />
                <a href="tel:03-3913-4618" className="text-sm text-warm-muted hover:text-brand transition-colors">
                  03-3913-4618
                </a>
              </div>
              <div className="flex items-start gap-2.5">
                <Clock className="w-4 h-4 text-brand mt-0.5 flex-shrink-0" />
                <div className="text-sm text-warm-muted">
                  <p>午前 9：30～13：00</p>
                  <p>午後 14：30～19：30</p>
                  <p className="text-warm-muted text-xs mt-1">水曜午前・土曜午後 休診</p>
                  <p className="text-warm-muted text-xs">
                    第2・第4・第5木曜、第1・第3土曜、日曜・祝日 休診
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div>
            <h3 className="text-white font-bold mb-4 text-sm tracking-wide">メニュー</h3>
            <ul className="space-y-2">
              {[
                { label: "お知らせ", href: "#news" },
                { label: "当院の特徴", href: "#features" },
                { label: "診療案内", href: "#services" },
                { label: "料金表", href: "#pricing" },
                { label: "診療時間", href: "#hours" },
                { label: "院長紹介", href: "#doctor" },
                { label: "求人案内", href: "#recruit" },
                { label: "アクセス", href: "#access" },
              ].map((item) => (
                <li key={item.href}>
                  <a
                    href={item.href}
                    onClick={(e) => {
                      e.preventDefault();
                      document.querySelector(item.href)?.scrollIntoView({ behavior: "smooth" });
                    }}
                    className="text-sm text-warm-muted/80 hover:text-brand transition-colors flex items-center gap-1.5"
                  >
                    <span className="w-1 h-1 rounded-full bg-brand" />
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-brand-dark/30">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-warm-muted text-xs">
            © {currentYear} あさの歯科 All Rights Reserved.
          </p>
          <a
            href="/privacy-policy"
            className="text-warm-muted hover:text-brand text-xs transition-colors"
            onClick={(e) => {
              e.preventDefault();
              alert("プライバシーポリシーのページは準備中です。");
            }}
          >
            プライバシーポリシー
          </a>
        </div>
      </div>
    </footer>
  );
}
