/**
 * DoctorSection Component — あさの歯科
 * Design: Soft Minimalism × Japanese Breathing Space
 * - Doctor portrait + greeting message
 * - Asymmetric layout: image left, text right
 * - Warm, approachable tone
 */
import { useEffect, useRef } from "react";
import { Quote } from "lucide-react";
import { m } from "@/lib/mobileLayout";

const DOCTOR_IMAGE = "https://d2xsxph8kpxj0f.cloudfront.net/310519663691633446/jDB9T7x4VrBkagcFGPCM8B/dental-doctor-5Vwad48FPKdk2CwWV4dx35.webp";

export default function DoctorSection() {
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

  return (
    <section id="doctor" className={`${m.sectionPy} bg-accent-light`} ref={sectionRef}>
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
        {/* Section Header */}
        <div className={`${m.sectionHead} fade-in-up`}>
          <p className={m.sectionLabel}>About Doctor</p>
          <h2 className={m.sectionTitle} style={{ fontFamily: "'Noto Serif JP', serif" }}>
            院長・スタッフ紹介
          </h2>
          <div className="w-12 h-1 bg-brand rounded-full mx-auto" />
        </div>

        {/* Doctor Card */}
        <div className="bg-card rounded-2xl md:rounded-3xl overflow-hidden shadow-sm border border-cream-muted">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
            {/* Image */}
            <div className="relative overflow-hidden h-52 md:h-auto">
              <img
                src={DOCTOR_IMAGE}
                alt="院長 淺野 栄之"
                className="w-full h-full object-cover object-top fade-in-up"
              />
              {/* Overlay gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent md:bg-gradient-to-r md:from-transparent md:to-white/10" />
            </div>

            {/* Content */}
            <div className="p-5 md:p-10 lg:p-12 flex flex-col justify-center fade-in-up stagger-2">
              {/* Quote icon */}
              <div className="w-9 h-9 md:w-10 md:h-10 rounded-xl bg-brand/10 flex items-center justify-center mb-4 md:mb-6">
                <Quote className="w-4 h-4 md:w-5 md:h-5 text-brand" />
              </div>

              {/* Greeting */}
              <blockquote className={`text-warm text-xs md:text-lg ${m.body} mb-5 md:mb-8`} style={{ fontFamily: "'Noto Serif JP', serif" }}>
                「あさの歯科は東京都北区の王子神谷駅近くにある歯医者です。皆様の健康的な歯の維持、虫歯の予防のお手伝いにより地域貢献をすることをモットーとしております。
                <br /><br />
                歯医者というとどうしても、虫歯になった歯が痛い、歯が欠けたなど症状が出てから行くイメージがあると思います。そこで治療終了後も予防・歯石除去など定期的にチェック(当院では半年後、または一年後)することにより早期発見、早期治療で一生ご自分の歯で食事ができるようになればと思っております。
                <br /><br />
                また近年、歯槽膿漏や虫歯の原因菌が心臓病と因果関係にあるとも言われています。慢性的な頭痛、肩こりなどは噛み合わせの不調和によることもあります。体が疲れるとなんとなくうずいたり熱いものがしみるなどのご経験はありませんか？歯は健康のバロメーターなのです。
                <br /><br />
                また、当院では画像により治療、方針、計画などを説明してから治療を進めていくことを心掛けております。噛み合わせ、より美しい白い歯にしてほしいなどのご相談にも応対しておりますので気軽にご相談、ご来院ください。
                <br /><br />
                最後になりますが、当院では治療、説明を丁寧にすることを心掛けておりますので治療は予約制とさせて頂いております。初診の患者様や次回の治療を予約される患者様のお約束が必ずしもご希望に添えないことがあります。特に最近、夕方の時間と土曜日が大変混みあっており、ご迷惑をおかけすることがあると思いますが、ご理解のほどどうぞ宜しくお願いいたします。」
              </blockquote>

              {/* Doctor Info */}
              <div className="border-t border-cream-muted pt-4 md:pt-6">
                <div className="flex items-center gap-3 md:gap-4">
                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-brand/15 flex items-center justify-center flex-shrink-0">
                    <span className="text-brand font-bold text-xs md:text-sm">院長</span>
                  </div>
                  <div>
                    <p className="text-lg md:text-xl font-bold text-warm" style={{ fontFamily: "'Noto Serif JP', serif" }}>
                      淺野 栄之
                    </p>
                    <p className="text-sm text-warm-muted">あさの えいじ</p>
                    <p className="text-xs text-brand font-medium mt-0.5">あさの歯科 院長</p>
                  </div>
                </div>

                {/* Career highlights */}
                <div className="mt-4 md:mt-5 space-y-1.5 md:space-y-2 text-xs md:text-sm text-warm-muted">
                  <p className="font-semibold text-warm mb-1.5 md:mb-2">経歴</p>
                  <div className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-brand mt-1 flex-shrink-0" />
                    <span>1990年 千葉県立千葉南高等学校卒業</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-brand mt-1 flex-shrink-0" />
                    <span>1991年～1997年 日本大学松戸歯学部在学</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-brand mt-1 flex-shrink-0" />
                    <span>1997年～1999年 医療法人弘進会宮田歯科勤務</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-brand mt-1 flex-shrink-0" />
                    <span>1999年～2000年 王子神谷歯科クリニック勤務</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-brand mt-1 flex-shrink-0" />
                    <span>2001年 あさの歯科開院</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-brand mt-1 flex-shrink-0" />
                    <span>現在に至る</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
