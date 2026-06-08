import { ArrowLeft, Bell, CalendarDays, Megaphone, Globe, Phone, AlertCircle } from "lucide-react";

const LIFF_URL = "https://liff.line.me/2010286249-p0zTCLo7";

export default function Booking() {
  return (
    <div className="min-h-screen bg-cream flex flex-col">
      {/* Header */}
      <div className="bg-card border-b border-cream-muted px-4 py-4">
        <a href="/" className="flex items-center gap-1.5 text-warm-muted hover:text-warm transition-colors text-sm font-medium">
          <ArrowLeft className="w-4 h-4" />
          トップへ戻る
        </a>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-5 py-10">
        <div className="w-full max-w-sm">

          {/* 再診のみ */}
          <div className="flex items-start gap-2.5 bg-amber-50 border border-amber-200 rounded-xl p-3.5 mb-8">
            <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-amber-800">診察券をお持ちの再診の方のみご利用いただけます。</p>
              <p className="text-xs text-amber-700 mt-0.5">
                初診の方は
                <a href="tel:03-3913-4618" className="font-bold underline ml-1">03-3913-4618</a>
                へお電話ください。
              </p>
            </div>
          </div>

          {/* LINE予約カード（メイン） */}
          <div className="bg-card border border-cream-muted rounded-2xl shadow-sm overflow-hidden mb-6">
            {/* おすすめバー */}
            <div className="bg-[#06C755] px-4 py-2 flex items-center gap-2">
              <span className="text-white text-xs font-bold tracking-wide">✦ おすすめの予約方法</span>
            </div>

            <div className="p-6">
              {/* アイコン＋タイトル */}
              <div className="flex items-center gap-3 mb-5">
                <div className="w-12 h-12 bg-[#06C755]/10 rounded-2xl flex items-center justify-center flex-shrink-0">
                  <svg viewBox="0 0 24 24" className="w-7 h-7 fill-[#06C755]">
                    <path d="M12 2C6.48 2 2 6.02 2 11c0 3.16 1.66 5.95 4.23 7.72L5.5 22l3.44-1.8A10.8 10.8 0 0 0 12 20.5c5.52 0 10-4.02 10-9s-4.48-9-10-9z"/>
                  </svg>
                </div>
                <div>
                  <p className="font-bold text-warm text-lg leading-tight">LINEで予約</p>
                  <p className="text-warm-muted text-xs mt-0.5">カレンダーをタップするだけ</p>
                </div>
              </div>

              {/* メリットリスト */}
              <ul className="space-y-3 mb-6">
                {[
                  { icon: Bell, text: "予約前日に自動でリマインド通知が届く" },
                  { icon: CalendarDays, text: "カレンダーから空き日時をタップして予約" },
                  { icon: Megaphone, text: "休診のお知らせなどもLINEで受け取れる" },
                ].map(({ icon: Icon, text }) => (
                  <li key={text} className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-[#06C755]/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Icon className="w-3.5 h-3.5 text-[#06C755]" />
                    </div>
                    <p className="text-sm text-warm leading-snug">{text}</p>
                  </li>
                ))}
              </ul>

              {/* ボタン */}
              <a
                href={LIFF_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full bg-[#06C755] hover:bg-[#05a848] text-white text-center font-bold py-4 rounded-xl transition-colors text-base"
              >
                LINEで予約する →
              </a>
            </div>
          </div>

          {/* 区切り */}
          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-px bg-cream-muted" />
            <p className="text-xs text-warm-muted">またはブラウザから</p>
            <div className="flex-1 h-px bg-cream-muted" />
          </div>

          {/* Web予約（サブ） */}
          <a
            href="/reserve"
            className="flex items-center gap-3 w-full hover:bg-accent-light rounded-xl px-4 py-3 transition-colors group"
          >
            <Globe className="w-5 h-5 text-warm-muted group-hover:text-brand transition-colors flex-shrink-0" />
            <p className="text-sm font-medium text-warm-muted group-hover:text-warm transition-colors flex-1">
              Webブラウザで予約する
            </p>
            <span className="text-warm-muted group-hover:text-brand text-sm transition-colors">→</span>
          </a>

          {/* 初診電話 */}
          <div className="mt-8 text-center">
            <p className="text-xs text-warm-muted mb-2">初診のご予約はお電話で</p>
            <a href="tel:03-3913-4618" className="inline-flex items-center gap-2 text-brand font-bold hover:text-brand-dark transition-colors">
              <Phone className="w-4 h-4" />
              03-3913-4618
            </a>
          </div>

        </div>
      </div>
    </div>
  );
}
