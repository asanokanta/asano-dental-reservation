import { useEffect, useRef } from "react";
import { Briefcase, Users, Clock, Award, Heart } from "lucide-react";
import { motion } from "framer-motion";
import { m } from "@/lib/mobileLayout";

export default function RecruitSection() {
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
      { threshold: 0.15 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  const positions = [
    { role: "歯科衛生士", icon: <Users className="w-5 h-5" /> },
    { role: "歯科助手", icon: <Briefcase className="w-5 h-5" /> }
  ];

  const salaries = [
    {
      type: "【パート】",
      items: [
        "歯科衛生士：時給1,500円～",
        "歯科助手：時給1,250円～"
      ]
    },
    {
      type: "【正職員】",
      items: [
        "歯科衛生士：月給28万円～",
        "歯科助手：月給22万円～"
      ]
    }
  ];

  const workingHours = [
    "①8:30～13:00",
    "②17:00～19:30",
    "③8:30～17:00（休憩1.5H）"
  ];

  const benefits = [
    "雇用労災保険",
    "交通費全額支給（上限なし）",
    "制服貸与",
    "夏期休暇９日",
    "年末年始休暇８日",
    "慶弔休暇あり",
    "夏季冬季賞与あり",
    "勉強会参加費負担",
    "昼食の支給あり",
    "住宅及び子育て手当（応相談）",
    "住民税の一部負担",
    "退職金（3年以上ご勤務の場合）",
    "復職支援",
    "能力給あり"
  ];

  return (
    <section id="recruit" className={`${m.sectionPy} bg-white`} ref={sectionRef}>
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
        {/* Section Header */}
        <div className={`${m.sectionHead} fade-in-up`}>
          <p className={m.sectionLabel}>Careers</p>
          <h2 className={m.sectionTitle} style={{ fontFamily: "'Noto Serif JP', serif" }}>
            求人案内
          </h2>
          <p className={`${m.sectionLead} mb-3 md:mb-4`}>
            あさの歯科では、患者様のお口の健康を守るため、一緒に働いてくれるスタッフを募集しています。
          </p>
          <div className="w-12 h-1 bg-brand rounded-full mx-auto" />
        </div>

        {/* Positions */}
        <div className={`grid grid-cols-1 md:grid-cols-2 ${m.gapMd} mb-8 md:mb-12 fade-in-up stagger-2`}>
          {positions.map((pos, idx) => (
            <motion.div
              key={pos.role}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className={`bg-gradient-to-br from-brand/5 to-brand/10 rounded-2xl ${m.cardPad} border border-brand/20`}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-brand/20 flex items-center justify-center text-brand">
                  {pos.icon}
                </div>
                <h3 className="text-base md:text-lg font-bold text-warm">{pos.role}</h3>
              </div>
              <p className="text-sm text-warm-muted">未経験者を歓迎致します（経験者は優遇致します）</p>
            </motion.div>
          ))}
        </div>

        {/* Salary Section */}
        <div className={`bg-accent-light rounded-2xl ${m.cardPadLg} md:p-10 mb-8 md:mb-12 fade-in-up stagger-3`}>
          <h3 className="text-xl font-bold text-warm mb-6 flex items-center gap-2">
            <Award className="w-5 h-5 text-brand" />
            給与
          </h3>
          <div className={`grid grid-cols-1 md:grid-cols-2 ${m.gapLg}`}>
            {salaries.map((salary, idx) => (
              <div key={idx}>
                <p className="font-bold text-warm mb-3">{salary.type}</p>
                <ul className="space-y-2">
                  {salary.items.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-warm-muted">
                      <span className="w-1.5 h-1.5 rounded-full bg-brand mt-1.5 flex-shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <p className="text-xs text-warm-muted mt-6 pt-6 border-t border-cream-muted">
            ※試用期間1ヶ月～3か月、随時昇給あり。今までの経験、日々のスキルアップを考慮致します。<br />
            ※細かい手当て等はご相談の上決めさせて頂きます。
          </p>
        </div>

        {/* Working Hours & Schedule */}
        <div className={`grid grid-cols-1 md:grid-cols-2 ${m.gapMd} mb-8 md:mb-12 fade-in-up stagger-4`}>
          {/* Hours */}
          <div className={`bg-white rounded-2xl ${m.cardPadLg} border border-cream-muted`}>
            <h3 className="text-base md:text-lg font-bold text-warm mb-3 md:mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-brand" />
              勤務時間
            </h3>
            <ul className="space-y-2">
              {workingHours.map((hour, idx) => (
                <li key={idx} className="flex items-center gap-2 text-sm text-warm-muted">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand flex-shrink-0" />
                  {hour}
                </li>
              ))}
            </ul>
          </div>

          {/* Schedule */}
          <div className={`bg-white rounded-2xl ${m.cardPadLg} border border-cream-muted`}>
            <h3 className="text-base md:text-lg font-bold text-warm mb-3 md:mb-4">勤務日程</h3>
            <div className="space-y-4 text-sm text-warm-muted">
              <div>
                <p className="font-semibold text-warm mb-2">【パート】</p>
                <ul className="space-y-1 ml-4">
                  <li>• ①②月、火、水、金のうち週2日～OK！</li>
                  <li>• ③土曜日のみ</li>
                </ul>
              </div>
              <div>
                <p className="font-semibold text-warm mb-2">【正職員】</p>
                <ul className="space-y-1 ml-4">
                  <li>• 完全週休２日以上、有給休暇あり（6日間）</li>
                  <li>• 月曜、火曜、水曜、金曜：8時30分～17時30分（休憩90分）と13時30分～19時30分（休憩20分）のローテーション制</li>
                  <li>• 土曜：8時30分～14時00分（休憩30分）</li>
                  <li>• 平均月間残業時間：約3～5時間（時給計算にて支給）</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Benefits */}
        <div className={`bg-gradient-to-br from-brand/10 to-brand/5 rounded-2xl ${m.cardPadLg} md:p-10 mb-8 md:mb-12 fade-in-up stagger-5`}>
          <h3 className="text-base md:text-lg font-bold text-warm mb-4 md:mb-6 flex items-center gap-2">
            <Heart className="w-5 h-5 text-brand" />
            待遇・福利厚生
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {benefits.map((benefit, idx) => (
              <div key={idx} className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-brand mt-2 flex-shrink-0" />
                <span className="text-sm text-warm-muted">{benefit}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Requirements */}
        <div className={`grid grid-cols-1 md:grid-cols-2 ${m.gapMd} mb-8 md:mb-12 fade-in-up stagger-6`}>
          <div className={`bg-white rounded-2xl ${m.cardPadLg} border border-cream-muted`}>
            <h3 className="text-base md:text-lg font-bold text-warm mb-3 md:mb-4">資格</h3>
            <ul className="space-y-2 text-sm text-warm-muted">
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-brand mt-1.5 flex-shrink-0" />
                <span>歯科医療関係未経験者を歓迎致します（経験者は優遇致します）</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-brand mt-1.5 flex-shrink-0" />
                <span>資格所有者（歯科衛生士、管理栄養士、歯科技工士、保育士など）優遇</span>
              </li>
            </ul>
          </div>

          <div className={`bg-white rounded-2xl ${m.cardPadLg} border border-cream-muted`}>
            <h3 className="text-base md:text-lg font-bold text-warm mb-3 md:mb-4">その他</h3>
            <ul className="space-y-2 text-sm text-warm-muted">
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-brand mt-1.5 flex-shrink-0" />
                <span>勤務時間、曜日は応相談</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-brand mt-1.5 flex-shrink-0" />
                <span>未経験者・長期出来る方歓迎！</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Application */}
        <div className={`bg-gradient-to-r from-brand/20 to-brand/10 rounded-2xl ${m.cardPadLg} md:p-10 fade-in-up stagger-7 border border-brand/30`}>
          <h3 className="text-base md:text-lg font-bold text-warm mb-3 md:mb-4">応募方法</h3>
          <p className="text-warm-muted mb-4">
            電話連絡の上、履歴書（写貼）ご持参ください
          </p>
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-warm">担当：</span>
            <span className="text-lg font-bold text-brand">浅野</span>
          </div>
          <div className="mt-6 pt-6 border-t border-brand/20">
            <a
              href="tel:03-3913-4618"
              className="inline-flex items-center gap-1 md:gap-2 px-3 md:px-6 py-2 md:py-3 bg-brand text-white font-semibold text-xs md:text-base rounded-lg hover:bg-brand/90 transition-colors whitespace-nowrap"
            >
              <Briefcase className="w-3 h-3 md:w-4 md:h-4 flex-shrink-0" />
              <span className="hidden sm:inline">お電話でお問い合わせ</span>
              <span className="sm:hidden">お電話で相談</span>
            </a>
          </div>
        </div>

        {/* Closing */}
        <div className="text-center mt-12 fade-in-up stagger-8">
          <p className="text-warm-muted text-sm">
            あさの歯科では、患者様のお口の健康を守るため、<br />
            一緒に働いてくれるスタッフを心よりお待ちしています。
          </p>
        </div>
      </div>
    </section>
  );
}
