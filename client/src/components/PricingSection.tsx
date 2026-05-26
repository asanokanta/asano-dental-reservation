import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, Info, Package, Sparkles, Activity, ChevronRight, ChevronDown } from "lucide-react";
import { m } from "@/lib/mobileLayout";

interface PricingItem {
  name: string;
  image?: string;
  material?: string;
  description: string;
  features: string[];
  ratings?: {
    label: string;
    score: number;
  }[];
  price: string;
  note?: string;
  tags?: string[];
}

interface Category {
  id: string;
  label: string;
  icon: React.ReactNode;
  items: PricingItem[];
}

const categories: Category[] = [
  {
    id: "inlay",
    label: "歯の詰め物（インレー）",
    icon: <Sparkles className="w-4 h-4" />,
    items: [
      {
        name: "ジルコニアインレー",
        image: "/images/zirconia-inlay.png",
        material: "ジルコニア",
        description: "金属を使わない最も丈夫な白い詰め物です。身体に優しく安心して使用できます。透明感はありませんが、強度があり、長年使用しても変色がありません。",
        features: ["金属不使用"],
        ratings: [
          { label: "見た目", score: 3 },
          { label: "耐変色性", score: 5 },
          { label: "長持ち", score: 5 },
          { label: "体への影響", score: 5 },
        ],
        price: "66,000円（税別）",
        note: "スキャンでかたどり possible！",
        tags: ["金属不使用"]
      },
      {
        name: "オールセラミックスインレー",
        image: "/images/ceramic-inlay.png",
        material: "ガラス系セラミックス",
        description: "身体に優しく安心して使用できます。長年使用しても変色がありません。どのインレーよりも自然な透明感があり、最も自然な美しさを再現できます。",
        features: ["金属不使用"],
        ratings: [
          { label: "見た目", score: 5 },
          { label: "耐変色性", score: 5 },
          { label: "長持ち", score: 5 },
          { label: "体への影響", score: 5 },
        ],
        price: "71,500円（税別）",
        tags: ["金属不使用"]
      },
      {
        name: "ゴールドインレー",
        image: "/images/gold-inlay.png",
        material: "ゴールド",
        description: "一般的に「金歯」と言われる詰め物です。保険の金属と比べ、身体に優しい金属です。歯になじみやすく、天然の歯に近い硬さなので噛み合う歯も痛めません。",
        features: ["金属使用"],
        ratings: [
          { label: "見た目", score: 2 },
          { label: "耐変色性", score: 5 },
          { label: "長持ち", score: 5 },
          { label: "体への影響", score: 5 },
        ],
        price: "66,000円～（※変動有り）",
        tags: ["金属使用"]
      },
      {
        name: "保険インレー",
        image: "/images/silver-inlay.png",
        material: "保険適用の金属",
        description: "一般的に「銀歯」と呼ばれる、健康保険で出来る詰め物です。安価で治療ができますが、金属色が目立ったり、長年の使用による黒ずみなどの変色が起きたりします。",
        features: ["保険適用", "金属使用"],
        ratings: [
          { label: "見た目", score: 1 },
          { label: "耐変色性", score: 2 },
          { label: "長持ち", score: 3 },
          { label: "体への影響", score: 2 },
        ],
        price: "保険適用に基づく一部負担金",
        tags: ["保険適用", "金属使用"]
      },
      {
        name: "CAD/CAMインレー",
        image: "/images/cadcam-inlay.png",
        material: "保険適用のプラスチックとセラミックの混合",
        description: "セラミックを混ぜ、硬さと美しさを向上させた健康保険適用の白い詰め物です。金属の詰め物より目立ちにくく、保険内でできる最も綺麗な詰め物です。",
        features: ["保険適用", "金属不使用"],
        ratings: [
          { label: "見た目", score: 3 },
          { label: "耐変色性", score: 3 },
          { label: "長持ち", score: 3 },
          { label: "体への影響", score: 3 },
        ],
        price: "保険適用に基づく一部負担金",
        note: "スキャンでかたどり possible！",
        tags: ["保険適用", "金属不使用"]
      }
    ]
  },
  {
    id: "crown",
    label: "歯の被せ物（クラウン）",
    icon: <Sparkles className="w-4 h-4" />,
    items: [
      {
        name: "フルジルコニア",
        image: "/images/full-zirconia-crown.png",
        material: "ジルコニア",
        description: "金属を使わない白い歯です。身体に優しい素材で作られているので安心して使用できます。長年使用しても変色がありません。全ての部位に適応できます。",
        features: ["金属不使用"],
        ratings: [
          { label: "見た目", score: 4 },
          { label: "耐変色性", score: 5 },
          { label: "長持ち", score: 5 },
          { label: "体への影響", score: 5 },
        ],
        price: "110,000円（税別）",
        note: "※インプラントの被せものにも最適、スキャンでかたどり possible！",
        tags: ["金属不使用"]
      },
      {
        name: "オールセラミックス（ジルコニア系）",
        image: "/images/all-ceramic-crown.png",
        material: "ジルコニアセラミックス",
        description: "金属を使わない白い歯です。身体に優しい素材で作られているので安心して使用できます。最も自然な美しさを再現できる被せ物です。",
        features: ["金属不使用"],
        ratings: [
          { label: "見た目", score: 5 },
          { label: "耐変色性", score: 5 },
          { label: "長持ち", score: 5 },
          { label: "体への影響", score: 5 },
        ],
        price: "132,000円（税別）",
        tags: ["金属不使用"]
      },
      {
        name: "メタルボンド",
        image: "/images/metal-bond-crown.png",
        material: "セラミックと金属",
        description: "金属の上にセラミックを盛り、焼き付けて製作した白い歯です。金属を最小限に隠す事ができ、つや感もあるので、美しい見た目です。",
        features: ["金属使用"],
        ratings: [
          { label: "見た目", score: 4 },
          { label: "耐変色性", score: 5 },
          { label: "長持ち", score: 4 },
          { label: "体への影響", score: 3 },
        ],
        price: "93,500円（税別）",
        tags: ["金属使用"]
      },
      {
        name: "ゴールドクラウン",
        image: "/images/gold-crown.png",
        material: "ゴールド",
        description: "金を含む合金で製作する「金歯」と呼ばれる物です。金は金属の中でも柔らかく、噛み合う歯とも馴染みます。身体にも優しい金属の為、安心してご使用いただけます。",
        features: ["金属使用"],
        ratings: [
          { label: "見た目", score: 2 },
          { label: "耐変色性", score: 5 },
          { label: "長持ち", score: 5 },
          { label: "体への影響", score: 5 },
        ],
        price: "88,000円～（※変動有り）",
        tags: ["金属使用"]
      },
      {
        name: "ハイブリッド",
        image: "/images/hybrid-crown.png",
        material: "プラスチックとセラミックと金属の混合",
        description: "プラスチックの硬さとセラミックの美しさを合わせ持った白い歯です。天然の歯と同じくらいの硬さなので噛み合う歯にも安心です。",
        features: ["金属使用"],
        ratings: [
          { label: "見た目", score: 3 },
          { label: "耐変色性", score: 3 },
          { label: "長持ち", score: 3 },
          { label: "体への影響", score: 3 },
        ],
        price: "55,000円（税別）",
        tags: ["金属使用"]
      }
    ]
  },
  {
    id: "denture",
    label: "義歯（入れ歯）",
    icon: <Sparkles className="w-4 h-4" />,
    items: [
      {
        name: "レジン床義歯",
        image: "/images/resin-denture.png",
        material: "プラスチック",
        description: "床が厚くなりやすいため、口の中に違和感がある方もいらっしゃいます。部分入れ歯の場合は金属バネが目立ちます。治療代が安価で壊れても修理しやすいのが利点です。",
        features: ["保険適用", "金属使用"],
        ratings: [
          { label: "長持ち", score: 2 },
          { label: "見た目", score: 2 },
          { label: "つけ心地", score: 2 },
          { label: "噛みやすさ", score: 2 },
        ],
        price: "保険適用に基づく一部負担金",
        tags: ["保険適用", "金属使用"]
      },
      {
        name: "熱可塑性義歯（アクリル）",
        image: "/images/acrylic-denture.png",
        material: "強化プラスチック",
        description: "従来の保険の入れ歯より身体に優しい素材を使用しており、比較的丈夫で汚れ・ニオイがつきにくい利点があります。",
        features: ["保険適用", "金属使用"],
        ratings: [
          { label: "長持ち", score: 3 },
          { label: "見た目", score: 3 },
          { label: "つけ心地", score: 3 },
          { label: "噛みやすさ", score: 3 },
        ],
        price: "保険適用に基づく一部負担金",
        tags: ["保険適用", "金属使用"]
      },
      {
        name: "ノンクラスプデンチャー＋金属フレーム",
        image: "/images/non-clasp-denture.png",
        material: "弾力のある特殊素材＋金属",
        description: "入れ歯の強度を保つため内側に薄く最小限の面積のみ金属を使用しますが、外側には金属色はでません。自然な見た目と壊れにくさ、噛みやすさを兼ね備えた入れ歯です。",
        features: ["金属使用"],
        ratings: [
          { label: "長持ち", score: 4 },
          { label: "見た目", score: 5 },
          { label: "つけ心地", score: 4 },
          { label: "噛みやすさ", score: 4 },
        ],
        price: "275,000円（税別） or 330,000円（税別）",
        tags: ["金属使用"]
      },
      {
        name: "シリコンデンチャー",
        image: "/images/silicone-denture.png",
        material: "金属＋シリコーン",
        description: "歯ぐきと入れ歯の接触部分を柔らかい クッション素材で覆った入れ歯です。歯ぐへの負担をやわらげ、口の中でフィットして入れ歯が安定します。",
        features: ["金属使用"],
        ratings: [
          { label: "長持ち", score: 4 },
          { label: "見た目", score: 3 },
          { label: "つけ心地", score: 5 },
          { label: "噛みやすさ", score: 5 },
        ],
        price: "220,000円（税別）",
        tags: ["金属使用"]
      }
    ]
  },
  {
    id: "implant",
    label: "インプラント",
    icon: <Activity className="w-4 h-4" />,
    items: [
      {
        name: "国産インプラント（京セラ社、AQB社）",
        description: "インプラント体植立＋上部構造（かぶせ物）代が含まれます。",
        features: ["税込表記"],
        ratings: [],
        price: "363,000円",
        tags: ["税込"]
      },
      {
        name: "スイス製インプラント（ストローマン社）",
        description: "インプラント体植立＋上部構造（かぶせ物）代が含まれます。世界シェアの高い信頼のメーカーです。",
        features: ["税込表記"],
        ratings: [],
        price: "484,000円",
        tags: ["税込"]
      },
      {
        name: "GBR（骨誘導再生療法）",
        description: "インプラント治療前提の抜歯時などに失った歯槽骨を再生することにより骨がない部位のインプラント治療の優位性を保ちます。",
        features: ["税込表記"],
        ratings: [],
        price: "60,500円",
        note: "※インプラント治療を希望される場合、植立後の予後を考慮し抜歯の際にGBR処置を行うことをおすすめしております。",
        tags: ["税込"]
      }
    ]
  },
  {
    id: "others",
    label: "その他",
    icon: <Sparkles className="w-4 h-4" />,
    items: [
      {
        name: "ステイン・歯石除去",
        description: "歯の表面の汚れや歯石を取り除きます。",
        features: ["保険内"],
        ratings: [],
        price: "保険内ですので治療によって異なります。",
        tags: ["保険内"]
      },
      {
        name: "ホワイトニング",
        description: "上下前歯16本の施術です。歯を削らずに白くします。",
        features: ["税込表記"],
        ratings: [],
        price: "38,500円",
        note: "ホワイトニング後の効果を保つために専用ペースト（2,750円）のご購入をお勧めいたします。",
        tags: ["税込"]
      },
      {
        name: "ファイバーコア（グラスファイバー）",
        description: "歯の土台として使用する、しなやかで丈夫な素材です。",
        features: ["税込表記"],
        ratings: [],
        price: "6,050円",
        tags: ["税込"]
      }
    ]
  },
  {
    id: "goods",
    label: "デンタルグッズ",
    icon: <Package className="w-4 h-4" />,
    items: [
      { name: "システマ44M", description: "歯ブラシ", features: [], price: "420円" },
      { name: "システマMAXM（成人用）", description: "歯ブラシ", features: [], price: "420円" },
      { name: "歯間ブラシ（4S～Lまで）", description: "各種サイズ", features: [], price: "740円" },
      { name: "ハボンPGSTOP", description: "歯周病予防の薬用はみがきジェル", features: [], price: "1,980円" },
      { name: "ルシェロホワイト", description: "美白歯みがき粉", features: [], price: "2,750円" },
      { name: "PGSTOPダイレクト", description: "歯間ブラシジェル", features: [], price: "1,540円" },
      { name: "システマSP-Tジェル", description: "フッ素濃度1450ppm", features: [], price: "1,650円" },
      { name: "義歯ブラシ", description: "入れ歯専用ブラシ", features: [], price: "610円" },
      { name: "子供用ブラシ チャオ", description: "0才～9才用（在庫限り）", features: [], price: "150円" },
      { name: "子供用ブラシ genkiJ", description: "10才～15才用", features: [], price: "490円" },
      { name: "デキサメタゾン", description: "口内炎の薬", features: [], price: "500円" },
      { name: "スマイルデント", description: "入れ歯洗浄剤", features: [], price: "1,090円" },
      { name: "ファンギゾンシロップ", description: "歯周病のための塗り薬", features: [], price: "1,760円" }
    ]
  }
];


export default function PricingSection() {
  const [openCategories, setOpenCategories] = useState<string[]>([]);

  const toggleCategory = (id: string) => {
    setOpenCategories((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  };

  return (
    <section id="pricing" className={`${m.sectionPy} bg-accent-light`}>
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
        <div className={`${m.sectionHead} fade-in-up`}>
          <p className={m.sectionLabel}>自費・保険診療 料金一覧</p>
          <h2 className={m.sectionTitle} style={{ fontFamily: "'Noto Serif JP', serif" }}>
            価格表 <span className="text-gray-400 font-light text-2xl ml-2">Cost</span>
          </h2>
          <p className={m.sectionLead}>
            当院では患者様に安心して治療を受けていただけるよう、料金体系を明確にしております。<br className="hidden md:block" />
            ご不明な点はお気軽にご相談ください。
          </p>
        </div>

        {/* Accordion */}
        <div className="flex flex-col gap-0 mb-8 md:mb-12 border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
          {categories.map((category, index) => {
            const isOpen = openCategories.includes(category.id);
            const isGoodsCategory = category.id === "goods";
            return (
              <div key={category.id} className={index > 0 ? "border-t border-gray-200" : ""}>
                {/* Accordion Header */}
                <button
                  onClick={() => toggleCategory(category.id)}
                  className={`w-full flex items-center gap-3 px-4 md:px-6 py-4 md:py-5 text-left transition-colors duration-200 ${
                    isOpen ? "bg-brand text-white" : "bg-white text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  {/* Toggle chevron icon */}
                  <span className={`flex-shrink-0 transition-transform duration-300 ${isOpen ? "rotate-0" : "-rotate-90"}`}>
                    <ChevronDown className={`w-5 h-5 ${isOpen ? "text-white" : "text-brand"}`} />
                  </span>
                  {/* Category icon */}
                  <span className={`flex-shrink-0 ${isOpen ? "text-white/80" : "text-brand/70"}`}>
                    {category.icon}
                  </span>
                  {/* Label */}
                  <span className={`font-bold text-sm md:text-base ${isOpen ? "text-white" : "text-gray-800"}`}>
                    {category.label}
                  </span>
                </button>

                {/* Accordion Content */}
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      key={category.id + "-content"}
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                      style={{ overflow: "hidden" }}
                    >
                      <div className="bg-white px-4 md:px-6 py-4 md:py-6">
                        <div className={isGoodsCategory ? "space-y-0 divide-y divide-gray-200 border-t border-b border-gray-200" : "grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8"}>
                          {category.items.map((item) => (
                            <motion.div
                              key={item.name}
                              className={isGoodsCategory
                                ? "flex items-center justify-between py-3 md:py-4 px-2 bg-white hover:bg-gray-50 transition-colors"
                                : "group relative flex flex-col bg-white rounded-2xl overflow-hidden border border-gray-100 hover:shadow-xl transition-all duration-500"
                              }
                            >
                              {!isGoodsCategory && item.image && (
                                <div className="overflow-hidden bg-gradient-to-b from-gray-50 to-white h-48 md:h-64">
                                  <img
                                    src={item.image}
                                    alt={item.name}
                                    className="w-full h-full object-contain p-5 group-hover:scale-105 transition-transform duration-500"
                                  />
                                </div>
                              )}

                              <div className={isGoodsCategory ? "flex flex-row items-center justify-between w-full" : "flex flex-col flex-grow p-4 md:p-8"}>
                                <div className={isGoodsCategory ? "flex flex-col" : "mb-4"}>
                                  <h3 className={`font-bold text-gray-900 leading-tight ${isGoodsCategory ? "text-sm md:text-xl" : "text-base md:text-2xl mb-1"}`}>
                                    {item.name}
                                  </h3>
                                  {item.description && (
                                    <p className={`text-gray-500 leading-tight ${isGoodsCategory ? "text-[11px] md:text-sm mt-0.5" : "text-sm md:text-base mt-2"}`}>
                                      {item.description}
                                    </p>
                                  )}
                                </div>

                                {!isGoodsCategory && item.ratings && item.ratings.length > 0 && (
                                  <div className="hidden md:block space-y-3 my-6 bg-gray-50 p-4 rounded-xl">
                                    {item.ratings.map((rating) => (
                                      <div key={rating.label} className="flex items-center justify-between">
                                        <span className="text-xs font-bold text-gray-500">{rating.label}</span>
                                        <div className="flex gap-0.5">
                                          {[...Array(5)].map((_, i) => (
                                            <Star key={i} className={`w-3 h-3 ${i < rating.score ? "fill-yellow-400 text-yellow-400" : "fill-gray-200 text-gray-200"}`} />
                                          ))}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}

                                <div className={isGoodsCategory ? "flex flex-col items-end ml-4" : "mt-auto pt-4 md:pt-8 border-t border-gray-100"}>
                                  {!isGoodsCategory && (
                                    <span className="text-[10px] md:text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">
                                      価格（税込）
                                    </span>
                                  )}
                                  <span className={`font-black text-gray-900 leading-none ${isGoodsCategory ? "text-sm md:text-2xl" : "text-xl md:text-3xl"}`}>
                                    {item.price}
                                  </span>
                                </div>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mt-10 md:mt-16 p-4 md:p-6 bg-primary/5 rounded-2xl border border-primary/10 text-center"
        >
          <p className="text-xs md:text-sm text-gray-600 leading-normal md:leading-relaxed">
            ※ 症状や治療部位、使用する材料の量によって費用が前後する場合がございます。<br />
            ※ 健康保険の負担割合により、お支払い金額が異なります。<br />
            ※ 詳細な見積もりについては、診断後にご提示させていただきます。
          </p>
        </motion.div>
      </div>
    </section>
  );
}
