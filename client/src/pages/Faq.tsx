import { useState } from "react";
import { ChevronDown, ChevronUp, Phone } from "lucide-react";

const CLINIC_PHONE = "03-3913-4618";

type QA = { q: string; a: string };
type Section = { id: string; title: string; emoji: string; color: string; items: QA[] };

const SECTIONS: Section[] = [
  {
    id: "whitening",
    title: "ホワイトニング",
    emoji: "✨",
    color: "bg-yellow-50 border-yellow-200",
    items: [
      {
        q: "ホワイトニングとはどんな治療ですか？",
        a: "歯を削ることなく、歯科用の薬剤を使用して歯を白くする方法です。薬剤が口の中で化学分解することにより、フリーラジカルが発生し、歯のエナメル質や象牙質に浸透して着色部分だけに作用します。歯の構造を変えることなく色調を明るくすることができます。",
      },
      {
        q: "ホワイトニング前に必要なことはありますか？",
        a: "ホワイトニングを始める前に、日頃のセルフケアだけでは不十分になりがちな歯の汚れや歯垢・歯石を除去します。まず歯をきれいな状態にしてからホワイトニングを行います。",
      },
      {
        q: "ホワイトニング後の注意点は？",
        a: "ホワイトニング後は歯の表面を覆う皮膜（ペリクル）が除去された状態になります。12〜24時間かけて再生されるまでは、コーヒーや赤ワインなど色の濃い食べ物・飲み物はお控えください。",
      },
      {
        q: "痛みやしみたりはしませんか？",
        a: "ホワイトニング後に一時的に痛みやしみを伴う場合がございますが、一時的なものですのでご安心ください。",
      },
      {
        q: "保険は使えますか？",
        a: "ホワイトニングは保険外治療（自費診療）となります。",
      },
      {
        q: "どれくらいの期間もちますか？",
        a: "個人の食生活（コーヒーなど色の濃い飲み物を好む方）や喫煙の有無により異なりますが、1〜2年後には再び着色します。定期的なメンテナンスをおすすめします。",
      },
      {
        q: "すべての歯に適用できますか？",
        a: "被せ物をしていない天然歯に対してホワイトニングが可能です。差し歯・被せ物・詰め物には効果がありません。",
      },
    ],
  },
  {
    id: "implant",
    title: "インプラント",
    emoji: "🦷",
    color: "bg-green-50 border-green-200",
    items: [
      {
        q: "インプラントとはどんな治療ですか？",
        a: "失った歯の部分に人工の歯根を顎の骨に埋め込み、その上に人工の歯を作る治療法です。固定式のため入れ歯のようにガタつかず、自分の歯のように強く噛めます。ブリッジと異なり健康な歯を削る必要もありません。",
      },
      {
        q: "誰でも受けられますか？",
        a: "すべての方が受けられるわけではありませんが、健康な方なら基本的に可能です。顎の骨の状態や全身の健康状態によって判断します。まずはご相談ください。",
      },
      {
        q: "インプラントの寿命はどのくらいですか？",
        a: "口の中の衛生状態が良ければ長期にわたって使用できます。逆に清掃が不十分な場合は寿命が短くなります。定期的なメンテナンスが重要です。",
      },
      {
        q: "費用や期間はどのくらいかかりますか？",
        a: "インプラントは埋め込む本数や状態により金額・期間ともに異なります。なお、インプラントは自由診療のため保険を適用することはできません。詳細は診察時にご説明します。",
      },
      {
        q: "手術のときに痛みはありますか？",
        a: "手術は局部麻酔をして行いますので、手術中の痛みはご心配ありません。術後に多少の痛みや腫れが出る場合がありますが、処方薬で対応できます。",
      },
      {
        q: "手術時間はどのくらいかかりますか？",
        a: "滅菌・麻酔を含めて部位や本数により異なりますが、2〜3時間程度の所要時間です。",
      },
    ],
  },
  {
    id: "general",
    title: "診療・料金について",
    emoji: "💡",
    color: "bg-blue-50 border-blue-200",
    items: [
      {
        q: "初めての受診（初診）はどうすればいいですか？",
        a: "初診の方はお電話にてご予約をお願いします。保険証をお持ちの上ご来院ください。保険証をお忘れの場合は自費での対応となりますのでご注意ください。\n📞 03-3913-4618",
      },
      {
        q: "保険診療と自費診療の違いは？",
        a: "虫歯治療・歯周病治療・入れ歯など一般的な治療は保険が適用されます（3割負担）。ホワイトニング・インプラント・審美治療などは保険適用外（自費診療）となり、全額自己負担となります。",
      },
      {
        q: "予約はどうすればできますか？",
        a: "再診（診察券をお持ち）の方はこの公式LINEからご予約いただけます。初診の方はお電話にてご予約ください。\n📞 03-3913-4618",
      },
      {
        q: "急に歯が痛くなりました。当日対応できますか？",
        a: "急患の対応も行っております。まずはお電話でご連絡ください。\n📞 03-3913-4618",
      },
    ],
  },
];

function QAItem({ qa }: { qa: QA }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-gray-100 last:border-none">
      <button
        className="w-full text-left py-4 flex items-start justify-between gap-3"
        onClick={() => setOpen(!open)}
      >
        <span className="text-sm font-bold text-[#5C5748] leading-snug flex-1">
          Q. {qa.q}
        </span>
        {open
          ? <ChevronUp className="w-4 h-4 text-[#66BB6A] flex-shrink-0 mt-0.5" />
          : <ChevronDown className="w-4 h-4 text-[#8A8575] flex-shrink-0 mt-0.5" />
        }
      </button>
      {open && (
        <div className="pb-4 pl-3 border-l-2 border-[#66BB6A] ml-1 mb-2">
          <p className="text-sm text-[#5C5748] leading-relaxed whitespace-pre-line">
            {qa.a}
          </p>
        </div>
      )}
    </div>
  );
}

export default function Faq() {
  const [activeSection, setActiveSection] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-[#FEF9E7]">
      {/* ヘッダー */}
      <div className="bg-[#66BB6A] text-white px-5 py-6 text-center">
        <p className="text-xs font-bold tracking-widest uppercase opacity-80 mb-1">Asano Dental Clinic</p>
        <h1 className="text-xl font-bold" style={{ fontFamily: "'Zen Maru Gothic', sans-serif" }}>
          🦷 よくあるご質問
        </h1>
        <p className="text-xs opacity-80 mt-1">タップして回答を表示</p>
      </div>

      <div className="px-4 py-6 space-y-4 max-w-lg mx-auto">
        {SECTIONS.map((section) => (
          <div key={section.id} className={`rounded-2xl border-2 overflow-hidden ${section.color}`}>
            {/* セクションヘッダー */}
            <button
              className="w-full flex items-center justify-between px-5 py-4"
              onClick={() => setActiveSection(activeSection === section.id ? null : section.id)}
            >
              <span className="font-bold text-[#5C5748] flex items-center gap-2">
                <span className="text-xl">{section.emoji}</span>
                {section.title}
                <span className="text-xs text-[#8A8575] font-normal">{section.items.length}件</span>
              </span>
              {activeSection === section.id
                ? <ChevronUp className="w-5 h-5 text-[#66BB6A]" />
                : <ChevronDown className="w-5 h-5 text-[#8A8575]" />
              }
            </button>

            {/* Q&Aリスト */}
            {activeSection === section.id && (
              <div className="bg-white px-5 pb-2">
                {section.items.map((qa, i) => (
                  <QAItem key={i} qa={qa} />
                ))}
              </div>
            )}
          </div>
        ))}

        {/* お電話案内 */}
        <div className="bg-white rounded-2xl border border-[#EDE4C8] p-5 text-center">
          <p className="text-sm text-[#8A8575] mb-3">
            ご不明な点はお気軽にお電話ください
          </p>
          <a
            href={`tel:${CLINIC_PHONE.replace(/-/g, "")}`}
            className="inline-flex items-center gap-2 bg-[#66BB6A] text-white font-bold px-6 py-3 rounded-xl"
          >
            <Phone className="w-4 h-4" />
            {CLINIC_PHONE}
          </a>
        </div>

        {/* ホームページリンク */}
        <div className="text-center pb-4">
          <a
            href="https://www.asano-dc.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-[#66BB6A] underline"
          >
            あさの歯科 公式ホームページ →
          </a>
        </div>
      </div>
    </div>
  );
}
