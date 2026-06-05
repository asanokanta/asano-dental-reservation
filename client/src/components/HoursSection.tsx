/**
 * HoursSection Component — あさの歯科
 * Design: Soft Minimalism × Japanese Breathing Space
 */
import { useEffect, useRef } from "react";
import { Clock, Phone, Calendar } from "lucide-react";
import { m } from "@/lib/mobileLayout";
import {
  CLOSURE_NOTES,
  CONSULTATION_HOURS,
  LAST_RECEPTION,
  WEEKLY_DAYS,
  WEEKLY_HOURS_TABLE,
  WEEKLY_TABLE_NOTES,
} from "@shared/clinicHours";

export default function HoursSection() {
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const els = entry.target.querySelectorAll(".fade-in-up");
            els.forEach((el) => el.classList.add("visible"));
          }
        });
      },
      { threshold: 0.1 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  const getSlotStyle = (slot: string) => {
    if (slot === "○" || slot === "○※")
      return { text: slot, color: "text-brand", bg: "bg-brand/10", fw: "font-bold" };
    if (slot === "△")
      return { text: "△", color: "text-amber-600", bg: "bg-amber-50", fw: "font-bold" };
    return { text: "×", color: "text-warm-muted", bg: "bg-cream-light", fw: "font-medium" };
  };

  return (
    <section id="hours" className={`${m.sectionPy} bg-cream-light`} ref={sectionRef}>
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
        <div className={`${m.sectionHead} fade-in-up`}>
          <p className={m.sectionLabel}>Hours</p>
          <h2 className={m.sectionTitle} style={{ fontFamily: "'Noto Serif JP', serif" }}>
            診療時間・休診日
          </h2>
          <div className="w-12 h-1 bg-brand rounded-full mx-auto" />
        </div>

        <div className={`grid grid-cols-1 lg:grid-cols-5 ${m.gapLg} items-start`}>
          <div className={`lg:col-span-3 ${m.stackMd} fade-in-up stagger-1`}>
            {/* 診療時間 */}
            <div className={`bg-card rounded-2xl border border-cream-muted shadow-sm ${m.cardPadLg}`}>
              <h3 className="text-sm md:text-base font-bold text-warm mb-3 md:mb-4 flex items-center gap-2">
                <Clock className="w-4 h-4 text-brand" />
                診療時間
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                <div className="bg-cream-light/80 rounded-xl p-3 md:p-4 border border-cream-muted">
                  <p className="text-xs font-bold text-brand mb-1">【午前】</p>
                  <p className="text-base md:text-lg font-bold text-warm tracking-wide">
                    {CONSULTATION_HOURS.morning.time}
                  </p>
                </div>
                <div className="bg-cream-light/80 rounded-xl p-3 md:p-4 border border-cream-muted">
                  <p className="text-xs font-bold text-brand mb-1">【午後】</p>
                  <p className="text-base md:text-lg font-bold text-warm tracking-wide">
                    {CONSULTATION_HOURS.afternoon.time}
                  </p>
                </div>
              </div>
            </div>

            {/* 最終受付 */}
            <div className={`bg-card rounded-2xl border border-cream-muted shadow-sm ${m.cardPadLg}`}>
              <h3 className="text-sm md:text-base font-bold text-warm mb-3 md:mb-4">最終受付</h3>
              <div className={m.stackSm}>
                {LAST_RECEPTION.map((row) => (
                  <div
                    key={row.days}
                    className="rounded-xl border border-cream-muted bg-cream-light/50 px-3 py-2.5 md:px-4 md:py-3"
                  >
                    <p className="text-xs md:text-sm font-bold text-warm mb-1.5 md:mb-2">【{row.days}】</p>
                    <div className="space-y-0.5 md:space-y-1 text-xs md:text-sm text-warm-muted">
                      <p>{row.morning}</p>
                      {row.afternoon && <p>{row.afternoon}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 休診 */}
            <div className="bg-card rounded-2xl border border-cream-muted shadow-sm px-4 py-4">
              <p className="text-xs text-warm-muted font-medium mb-2">休診</p>
              <ul className="space-y-1 md:space-y-1.5">
                {CLOSURE_NOTES.map((note) => (
                  <li key={note} className="text-xs md:text-sm text-warm flex items-start gap-2">
                    <span className="text-brand mt-0.5 flex-shrink-0">•</span>
                    {note}
                  </li>
                ))}
              </ul>
            </div>

            {/* 曜日別早見表 */}
            <div className="bg-card rounded-2xl border border-cream-muted shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-cream-muted bg-brand/5">
                <p className="text-sm font-bold text-warm">曜日別 診療の目安</p>
                <p className="text-xs text-warm-muted mt-0.5">
                  ○ 診療（空）　△ 土曜午前のみ（普）　○※ 木曜（混）　× 休診（満）
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-brand/10">
                      <th className="text-left px-4 py-3 text-xs font-bold text-warm w-40">
                        時間帯
                      </th>
                      {WEEKLY_DAYS.map((day) => (
                        <th
                          key={day}
                          className={`px-2 py-3 text-center text-sm font-bold w-10 ${
                            day === "日・祝"
                              ? "text-red-400"
                              : day === "土"
                                ? "text-blue-500"
                                : "text-warm"
                          }`}
                        >
                          {day}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {WEEKLY_HOURS_TABLE.map((row, ri) => (
                      <tr key={row.time} className={ri % 2 === 0 ? "bg-card" : "bg-cream-light/50"}>
                        <td className="px-4 py-4 text-xs text-warm-muted font-medium leading-snug">
                          {row.time}
                        </td>
                        {row.slots.map((slot, si) => {
                          const style = getSlotStyle(slot);
                          return (
                            <td key={si} className="px-1 py-4 text-center">
                              <span
                                className={`inline-flex items-center justify-center w-8 h-8 rounded-lg text-xs ${style.color} ${style.bg} ${style.fw}`}
                              >
                                {style.text}
                              </span>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="px-4 py-3 border-t border-cream-muted bg-cream-light/50">
                <ul className="space-y-1">
                  {WEEKLY_TABLE_NOTES.map((note) => (
                    <li key={note} className="text-xs text-warm-muted flex items-start gap-1.5">
                      <span className="text-brand mt-0.5">※</span>
                      {note}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Contact Info */}
          <div className={`lg:col-span-2 space-y-3 md:space-y-4 fade-in-up stagger-2`}>
            <div className={`bg-accent-light rounded-2xl ${m.cardPad} border border-brand/20`}>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-brand/20 flex items-center justify-center">
                  <Phone className="w-5 h-5 text-brand" />
                </div>
                <div>
                  <p className="text-xs text-warm-muted font-medium">お電話でのご予約・お問い合わせ</p>
                  <p className="text-lg md:text-xl font-bold text-warm tracking-wide">03-3913-4618</p>
                </div>
              </div>
              <a
                href="tel:03-3913-4618"
                className="w-full flex items-center justify-center gap-2 bg-brand hover:bg-brand-dark text-white font-bold py-3 rounded-xl transition-colors btn-press text-sm"
              >
                <Phone className="w-4 h-4" />
                電話をかける
              </a>
            </div>

            <div className={`bg-card rounded-2xl ${m.cardPad} border border-cream-muted shadow-sm`}>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-xs text-warm-muted font-medium">24時間いつでも</p>
                  <p className="text-base font-bold text-warm">ネット予約</p>
                </div>
              </div>
              <a
                href="/reserve"
                className="w-full flex items-center justify-center gap-2 bg-brand hover:bg-brand-dark text-white font-bold py-3 rounded-xl transition-colors btn-press text-sm"
              >
                <Calendar className="w-4 h-4" />
                24時間ネット予約はこちら
              </a>
            </div>

            <div className="bg-cream-light rounded-2xl p-4 md:p-5 border border-cream-muted">
              <div className="flex items-center gap-2 mb-2 md:mb-3">
                <Clock className="w-4 h-4 text-brand" />
                <p className="text-sm font-bold text-warm">診療時間まとめ</p>
              </div>
              <div className={`${m.stackSm} text-xs md:text-sm text-warm-muted`}>
                <div>
                  <p className="text-xs font-bold text-brand mb-1">診療時間</p>
                  <p>午前 {CONSULTATION_HOURS.morning.time}</p>
                  <p>午後 {CONSULTATION_HOURS.afternoon.time}</p>
                </div>
                <div className="pt-2 border-t border-cream-muted">
                  <p className="text-xs font-bold text-brand mb-1">最終受付</p>
                  {LAST_RECEPTION.map((row) => (
                    <p key={row.days} className="text-xs leading-relaxed mb-1">
                      <span className="font-medium text-warm">{row.days}</span>
                      <br />
                      {row.morning}
                      {row.afternoon ? `／${row.afternoon}` : ""}
                    </p>
                  ))}
                </div>
                <div className="pt-2 border-t border-cream-muted">
                  <p className="text-xs leading-relaxed">{CLOSURE_NOTES.join("　")}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
