export type AnnouncementCategory =
  | "お知らせ"
  | "休診"
  | "設備・DX"
  | "価格"
  | "保険"
  | "感染対策"
  | "当院からのご案内"
  | "ごあいさつ"
  | "求人";

export type AnnouncementImage = {
  src: string;
  alt: string;
  caption?: string;
};

export type Announcement = {
  id: string;
  sortKey: string;
  dateLabel: string;
  category: AnnouncementCategory;
  title: string;
  signature?: string;
  paragraphs: string[];
  bullets?: string[];
  subSections?: { heading?: string; bullets: string[] }[];
  images?: AnnouncementImage[];
  link?: { href: string; label: string };
  isNew?: boolean;
};

export const ANNOUNCEMENT_CATEGORIES: AnnouncementCategory[] = [
  "お知らせ",
  "休診",
  "設備・DX",
  "価格",
  "保険",
  "感染対策",
  "当院からのご案内",
  "ごあいさつ",
  "求人",
];

const announcementList: Announcement[] = [
  {
    id: "price-revision-2025",
    sortKey: "2025-08",
    dateLabel: "令和7年8月",
    category: "価格",
    title: "自由診療等価格改定のお知らせ",
    signature: "あさの歯科　院長",
    isNew: true,
    paragraphs: [
      "当院では患者様のお口の健康を第一に考慮し、自由診療の価格を最大限抑えて参りましたが、近年の材料費代、歯科技工代、諸費用の価格高騰により、令和7年9月より自由診療、歯ブラシ、歯磨き粉などの価格を10%値上げさせていただくことになりました。",
      "患者様には大変申し訳なく思っておりますが、ご理解ご協力のほどよろしくお願いいたします。",
    ],
  },
  {
    id: "closed-may-2026",
    sortKey: "2026-05",
    dateLabel: "令和8年5月",
    category: "休診",
    title: "5月の休診日",
    signature: "あさの歯科　淺野",
    paragraphs: ["5月は下記の通り休診させて頂きます。"],
    bullets: [
      "5月9日（土）：休診",
      "5月14日（木）：休診",
      "5月20日（水）：午前休診",
      "5月23日（土）：休診",
      "5月28日（木）：休診",
    ],
  },
  {
    id: "myna-insurance-2025",
    sortKey: "2025-08-01",
    dateLabel: "令和7年8月",
    category: "保険",
    title: "マイナ保険証・資格確認について",
    signature: "あさの歯科　院長",
    paragraphs: [
      "令和7年8月1日より、保険診療を受けられる際には以下のいずれかが必要となります。",
      "「資格確認のお知らせ」単体では受診できませんので、ご確認をお願い致します。",
    ],
    bullets: [
      "マイナ保険証（マイナンバーカード）",
      "有効期限内の保険証",
      "資格確認証",
    ],
  },
  {
    id: "medical-dx-2025",
    sortKey: "2025-04",
    dateLabel: "令和7年4月",
    category: "設備・DX",
    title: "医療DX推進体制整備加算について",
    signature: "あさの歯科　院長　淺野栄之",
    paragraphs: [
      "当院では、令和6年6月の診療報酬改定に伴う医療DX推進体制整備について以下のように対応します。",
    ],
    bullets: [
      "オンライン請求を行っており、オンライン資格確認を行なう体制を有しています。",
      "医師がオンライン資格確認を利用して取得した診療情報を、診療を行う診療室において閲覧または活用できる体制を有しています。",
      "電子処方箋を発行する体制については、電子カルテメーカーと協議中です。",
      "マイナンバーカードの健康保険証利用について、一定程度の実績を有しています。",
      "医療DX推進体制に関する事項および、質の高い診療を実施するための十分な情報を取得・活用して診療を行うことについて、院内の見やすい場所およびホームページ上に掲示しております。",
    ],
  },
  {
    id: "ct-scan-2019",
    sortKey: "2019-02-21",
    dateLabel: "2019.2.21",
    category: "設備・DX",
    title: "CT撮影装置導入のお知らせ",
    signature: "平成31年2月　あさの歯科 院長　淺野栄之",
    paragraphs: [
      "患者様へ",
      "当院では平成31年1月より、数年検討しておりましたCT撮影（コンピュータ断層撮影）の装置を導入いたしました。",
      "同装置を使用することにより、顎骨全体を広い範囲でより早く、より詳細な画像で見ることが可能になります。",
      "従来までのインプラント治療術前診断のみならず、術後の予後診断、経過観察及び治療診断をするうえで、より精度の必要な場合など、今後幅広く使用していければと考えております。",
      "当院では急患を除き、ひとりひとりの患者様の診療時間の確保の為、完全アポイント制にて診療を行わせていただいております。",
      "ここ最近、患者様のご希望の日時にてご予約がお取りすることが出来ず、ご迷惑をお掛けしております。",
      "虫歯や痛みで苦しんでおられる患者様を優先に拝見したい為、次回のアポイントの変更・キャンセル等は、わかりましたらなるべく早めに御連絡を下さる様、御協力をお願い致します。",
      "また、お体の調子がすぐれない時は遠慮なくスタッフにお申し出ください。よろしくお願い致します。",
    ],
    images: [
      {
        src: "/images/news/ct-device-1.jpg",
        alt: "導入されたCT撮影装置",
        caption: "CT撮影装置（コンピュータ断層撮影）",
      },
      {
        src: "/images/news/ct-device-2.jpg",
        alt: "CTによる3次元診断の案内",
        caption: "より最新の3次元診断へ",
      },
    ],
  },
  {
    id: "handpiece-sterilizer-2018",
    sortKey: "2018-02-16",
    dateLabel: "2018.2.16",
    category: "設備・DX",
    title: "ハンドピースの滅菌器を導入致しました",
    paragraphs: [
      "この度新しくハンドピースの滅菌器を院内に導入致しました。",
    ],
    images: [
      {
        src: "/images/news/handpiece-sterilizer.png",
        alt: "導入されたハンドピース滅菌器",
        caption: "ハンドピース滅菌器",
      },
    ],
  },
  {
    id: "office-hours-change-2017",
    sortKey: "2017-10-03",
    dateLabel: "2017.10.3",
    category: "お知らせ",
    title: "診療時間変更のお知らせ",
    paragraphs: [
      "下記の通り、診療時間を変更させていただきます。",
      "変更後は、診療開始時間が15分早まり、診療終了時間が30分早まります。",
    ],
    subSections: [
      {
        heading: "【診療時間】",
        bullets: [
          "午前：9:45～13:00 → 9:30～13:00（15分早まります）",
          "午後：14:30～20:00 → 14:30～19:30（30分早まります）",
        ],
      },
      {
        heading: "【最終受付】",
        bullets: [
          "月～水・金曜日：午前12:00まで、午後19:30まで → 午前12:00まで、午後19:00まで",
          "その他の曜日は変更ありません",
        ],
      },
    ],
  },
  {
    id: "dental-chairs-2016",
    sortKey: "2016-07-26",
    dateLabel: "2016.7.26",
    category: "設備・DX",
    title: "歯科診療台を2台新規導入しました",
    paragraphs: [
      "歯科診療台を2台新規導入しました。",
    ],
  },
  {
    id: "third-saturday-closed-2015",
    sortKey: "2015-06-05",
    dateLabel: "2015.6.5",
    category: "休診",
    title: "第3土曜日の午後休診について",
    paragraphs: [
      "2015年9月より第3土曜日の午後を休診と致します。",
    ],
  },
  {
    id: "whitening-price-2014",
    sortKey: "2014-02-25",
    dateLabel: "2014.2.25",
    category: "価格",
    title: "ホワイトニングの費用を変更いたしました",
    paragraphs: [
      "ホワイトニングの費用を変更いたしました。詳細はお気軽にお問い合わせください。",
    ],
  },
  {
    id: "xray-equipment-2012",
    sortKey: "2012-02",
    dateLabel: "2012.2",
    category: "設備・DX",
    title: "レントゲン機材を新しくしました",
    paragraphs: [
      "レントゲン機材を新しくしました。",
    ],
  },
  {
    id: "intraoral-scanner-2024",
    sortKey: "2024-11",
    dateLabel: "令和6年11月",
    category: "設備・DX",
    title: "口腔内スキャナーを導入致しました",
    signature: "あさの歯科　淺野",
    paragraphs: [
      "この装置は被せもの、詰め物など従来は口腔内で型取りをしていたものを画像を撮影することにより、より正確に迅速に製作物を作ることを可能にし、デジタル化を進めております。",
    ],
    images: [
      {
        src: "/images/news/scanner-yoshida.png",
        alt: "口腔内スキャナーとデジタル設備（YOSHIDA）",
        caption: "口腔内スキャナー導入",
      },
      {
        src: "/images/news/scanner-monitor.png",
        alt: "スキャン画像を表示するモニター",
        caption: "デジタル印象・設計",
      },
    ],
  },
  {
    id: "price-revision-2024",
    sortKey: "2024-08",
    dateLabel: "令和6年8月",
    category: "価格",
    title: "価格改正のお知らせ（8月1日より）",
    signature: "あさの歯科　淺野",
    paragraphs: [
      "これまで価格の維持に努めてまいりましたが、昨今の物価上昇と金属価格の高騰に伴い、8月1日から価格を改正させて頂きます。",
      "何卒、ご理解を賜りますようお願い申し上げます。",
    ],
    link: { href: "/#pricing", label: "価格表のページはこちら" },
  },
  {
    id: "appointment-wait-2024",
    sortKey: "2024-01",
    dateLabel: "令和6年1月",
    category: "お知らせ",
    title: "ご予約・お待ちいただく場合について",
    signature: "あさの歯科　淺野",
    paragraphs: [
      "予約の際、急患や院内の混雑状況により、予約をして頂いたにも関わらずお待たせする場合がございます。",
      "また、お電話にて日程調整のご案内、または症状等について当院より確認のご連絡をさせて頂く場合もございますが、あらかじめご了承下さいます様お願い申し上げます。",
    ],
    images: [
      {
        src: "/images/news/appointment-notice.png",
        alt: "患者様へのご案内（院内掲示）",
      },
    ],
  },
  {
    id: "air-purifier-office-2022",
    sortKey: "2022-06",
    dateLabel: "令和4年6月",
    category: "設備・DX",
    title: "待合室・診療室への空気清浄機設置",
    signature: "あさの歯科　淺野",
    paragraphs: [
      "今年も半分を過ぎ、徐々に暑さを感じる日々が増えている季節となりました。まだまだ皆様におかれましても、心身ともに多大なる気遣いやストレスを感じておられる方も多くいらっしゃると思います。",
      "このような状況下でも当院へご来院してくださる患者様へ感謝すると共に、少しでも安心してご通院、そして診療を受けることが出来る様に、一昨年の天井への業務用空気清浄機の設置に続き、待合室、診療室奥へ置き型のオフィス用空気清浄機の設置をいたしました。",
      "それにより、多少圧迫感を感じられるとは思いますが、宜しくお願い致します。",
    ],
  },
  {
    id: "covid-measures",
    sortKey: "2020-03",
    dateLabel: "新型コロナウイルス対策",
    category: "感染対策",
    title: "新型コロナウイルス対策について",
    signature: "あさの歯科　淺野",
    paragraphs: ["当院では新型コロナウイルス対策に以下のことを取り組んでいます。"],
    subSections: [
      {
        heading: "院内感染予防に普段から行っている取り組み",
        bullets: [
          "マスクとグローブ（医療用手袋）、ゴーグルの着用",
          "グローブを患者様ごとに交換",
          "患者様用コップの使い捨て",
          "治療器具のドリル等、ハンドピースの消毒、滅菌",
          "スタッフが行う頻繁な手洗いと手指消毒",
          "診療室内、待合室での空気清浄機の稼働",
          "診療台や操作パネル等の消毒液による清拭",
        ],
      },
      {
        heading: "新型コロナウイルス対策として追加で行っている取り組み",
        bullets: [
          "玄関、待合室への消毒液の設置",
          "ドアノブや取っ手、手すりなどの消毒液による清拭",
          "待合室ソファー、洗口台の消毒液による清拭",
          "定期的な換気",
          "待合室の雑誌等カバーなどのスプレー消毒",
        ],
      },
      {
        heading: "患者様へのお願い",
        bullets: [
          "診療中以外はマスクの着用をお願い致します。",
          "診療室入室前や受付をされる前に、アルコールで手指の消毒をして下さい。",
          "体調について問診をさせて頂くことがございます。",
          "受付にシールド板を設定させて頂いております。",
        ],
      },
    ],
  },
  {
    id: "aero-ceiling-2021",
    sortKey: "2021-01-15",
    dateLabel: "令和3年1月15日",
    category: "設備・DX",
    title: "診療室天井への医療用空気清浄装置の設置",
    signature: "あさの歯科　淺野",
    paragraphs: [
      "当院では、院内の換気口やドア開けなど定期的な換気を行っておりましたが、さらに皆様の不安を少しでも解消できればと、この度令和2年12月よりエアロサービス社製の医療施設用大型空気清浄装置を診療室内の天井に設置いたしました。",
      "この装置は、国立病院や大学病院など多くの医療施設で空気感染や飛沫感染対策に採用されているシステムで、毎分35㎡の空気清浄力を持つ本格的な業務用空気清浄機で、市販の一般的な置き型タイプの約7～10倍の清浄能力を持つと言われております。",
      "常により安全でクリーンな空気環境を作ることに努めております。",
    ],
    images: [
      {
        src: "/images/news/aero-ceiling.png",
        alt: "診療室天井に設置したエアロサービス製空気清浄装置",
        caption: "エアロサービス社製 医療施設用空気清浄装置",
      },
    ],
  },
  {
    id: "clinic-guidance-points",
    sortKey: "2023-04-01",
    dateLabel: "令和5年4月1日～12月末",
    category: "当院からのご案内",
    title: "当医院からのご案内（診療点数の変更）",
    signature: "あさの歯科　院長",
    paragraphs: [
      "令和5年4月1日から12月末まで、以下の診療項目について点数が変更となります。",
      "患者さんにはご負担おかけいたしますが、ご理解いただきますようお願い申し上げます。",
      "【医療情報・システム基盤整備体制充実加算１・２・３】マイナンバーカードの有無により点数が異なります。詳細は下記掲示をご確認ください。",
    ],
    images: [
      {
        src: "/images/news/medical-points-notice.png",
        alt: "当医院からのご案内（診療点数変更の掲示）",
      },
    ],
  },
  {
    id: "greeting",
    sortKey: "0000-00",
    dateLabel: "ごあいさつ",
    category: "ごあいさつ",
    title: "院長ごあいさつ",
    paragraphs: [
      "この度は私達のホームページをご覧頂きましてありがとうございます。",
      "東京メトロ南北線王子神谷駅近くに開院してから、早いもので22年目を迎えました。最近では東京都北区王子・東十条・また豊島を中心に、豊島区、足立区、板橋区、文京区、新宿区、川口市、さいたま市、戸田市などからも患者様に来院していただけるようになりました。",
      "今後もその期待にそうために、日々新しい知識・技術を身につけられるよう、また新しい医療を患者様に提供できるよう、院長、スタッフ一同歯科治療に取り組んでいます。これからも患者様に満足して頂けるよう努力してゆきたいと思います。",
    ],
  },
  {
    id: "winter-2023",
    sortKey: "2023-11-14",
    dateLabel: "2023.11.14",
    category: "休診",
    title: "冬季休暇のお知らせ（令和5年）",
    signature: "あさの歯科　院長",
    paragraphs: [
      "令和5年12月28日（木）～令和6年1月4日（木）を冬季休暇とさせて頂きます。宜しくお願い致します。",
    ],
  },
  {
    id: "summer-2023",
    sortKey: "2023-08-09",
    dateLabel: "2023.8.9",
    category: "休診",
    title: "夏季休暇のお知らせ（令和5年）",
    signature: "あさの歯科　院長",
    paragraphs: [
      "令和5年8月14日（月）～8月17日（木）を夏季休暇とさせて頂きます。",
      "ご迷惑をお掛けしますが、宜しくお願い致します。",
    ],
  },
  {
    id: "recruit-2023",
    sortKey: "2023-04-19",
    dateLabel: "2023.4.19",
    category: "求人",
    title: "求人案内を改訂いたしました",
    link: { href: "/#recruit", label: "求人案内を見る" },
    paragraphs: ["スタッフ募集の内容を更新しました。詳細は求人案内をご覧ください。"],
  },
  {
    id: "winter-2022",
    sortKey: "2022-12-14",
    dateLabel: "2022.12.14",
    category: "休診",
    title: "冬季休暇のお知らせ（令和4年）",
    signature: "あさの歯科　院長",
    paragraphs: [
      "令和4年12月29日（木）～令和5年1月5日（木）を冬季休暇とさせて頂きます。",
      "1月6日（金）より通常通り診療いたします。",
    ],
  },
  {
    id: "summer-2022",
    sortKey: "2022-05-13",
    dateLabel: "2022.5.13",
    category: "休診",
    title: "夏季休暇のお知らせ（令和4年）",
    signature: "あさの歯科　院長",
    paragraphs: [
      "令和4年7月28日（木）～7月30日（土）、令和4年8月15日（月）～8月18日（木）を夏季休暇とさせて頂きます。",
      "ご迷惑をお掛けしますが、宜しくお願い致します。",
    ],
  },
  {
    id: "winter-2021",
    sortKey: "2021-12-17",
    dateLabel: "2021.12.17",
    category: "休診",
    title: "冬季休暇のお知らせ（令和3年）",
    signature: "あさの歯科　院長",
    paragraphs: [
      "令和3年12月30日（木）～令和4年1月6日（木）を冬季休暇とさせて頂きます。",
      "1月7日（金）より通常通り診療いたします。",
    ],
  },
  {
    id: "director-health-2019",
    sortKey: "2019-08-29",
    dateLabel: "2019.8.29",
    category: "お知らせ",
    title: "診療時間短縮のお知らせ（院長体調）",
    signature: "あさの歯科　院長",
    paragraphs: [
      "当院院長の体調不良により、令和元年6月中旬より診療時間を一時的に短縮し、診療をさせて頂いておりますが、お陰様で少しずつ体調が良くなってきております。",
      "9月以降におきましても、しばらくは体調の様子を見ながら、時間を短縮した診療を行っていきたいと考えております。",
      "患者様には大変ご迷惑をお掛け致しますが、ご理解の程、宜しくお願い致します。",
    ],
  },
];

export const announcements = [...announcementList].sort((a, b) =>
  b.sortKey.localeCompare(a.sortKey)
);

export const categoryStyles: Record<
  AnnouncementCategory,
  { bg: string; text: string }
> = {
  お知らせ: { bg: "bg-accent-light", text: "text-amber-800" },
  休診: { bg: "bg-red-50", text: "text-red-600" },
  "設備・DX": { bg: "bg-brand/10", text: "text-brand-dark" },
  価格: { bg: "bg-sky-50", text: "text-sky-800" },
  保険: { bg: "bg-blue-50", text: "text-blue-800" },
  感染対策: { bg: "bg-violet-50", text: "text-violet-800" },
  当院からのご案内: { bg: "bg-cream-muted", text: "text-warm" },
  ごあいさつ: { bg: "bg-brand/15", text: "text-brand-dark" },
  求人: { bg: "bg-emerald-50", text: "text-emerald-800" },
};
