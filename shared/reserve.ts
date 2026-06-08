/** ネット予約の共通設定 */
export const CLINIC_PHONE = "03-3913-4618";
export const CLINIC_PHONE_DISPLAY = "03-3913-4618";

/** 外部予約（JMDC）へ飛ばす場合のみ使用。自作予約では未使用 */
export const RESERVE_REDIRECT_URL =
  "https://www.jmdc.co.jp/yoyaku/asano-dental";

export type PatientStatus = "normal" | "blocked";

export type PatientRecord = {
  id: string;
  name: string;
  status: PatientStatus;
};

export type ReserveValidationResult =
  | { ok: true; patient: { id: string; name: string } }
  | { ok: false; error: "not_found" | "blocked" | "empty" };

/** ネット予約：来院理由（メニュー）の選択肢 */
export type ReserveMenuItem = {
  id: string;
  label: string;
  description: string;
};

export const RESERVE_MENU_ITEMS: ReserveMenuItem[] = [
  { id: "toothache", label: "歯が痛い", description: "急な痛みやしみる症状について診察します。" },
  { id: "filling-came-off", label: "詰め物・かぶせ物が取れた", description: "外れた詰め物やかぶせ物の再装着・治療を行います。" },
  { id: "gum-pain", label: "歯茎が痛い・腫れる", description: "歯ぐきの痛み・腫れ・出血について診察します。" },
  { id: "jaw-pain", label: "顎が痛い", description: "顎の痛みや開閉時の違和感について診察します。" },
  { id: "denture-fit", label: "入れ歯が合わない", description: "入れ歯の調整やお困りごとについてご相談ください。" },
  { id: "wisdom-tooth", label: "親知らずを抜きたい", description: "親知らずの状態確認・抜歯についてご相談ください。" },
  { id: "checkup", label: "検診をしてほしい", description: "むし歯・歯周病など全体的なチェックを行います。" },
  { id: "cleaning", label: "お口の掃除をしたい", description: "歯石除去・クリーニングをご希望の方はこちら。" },
  { id: "bad-breath", label: "口臭が気になる", description: "口臭の原因確認や対策についてご相談ください。" },
  { id: "tooth-color", label: "歯の色が気になる", description: "変色・着色など歯の色のお悩みについてご相談ください。" },
  { id: "whitening", label: "ホワイトニング相談", description: "ホワイトニングの内容や進め方についてご相談ください。" },
  { id: "alignment", label: "歯並びが気になる", description: "歯並び・噛み合わせについてのご相談です。" },
  { id: "implant", label: "インプラント相談", description: "インプラント治療についてのご相談です。" },
  { id: "other", label: "その他", description: "上記に当てはまらないご相談・ご要望はこちら。" },
];

export const RESERVE_ERROR_MESSAGES = {
  not_found:
    "番号が見つかりません。診察券の番号をお確かめの上、もう一度入力してください。うまくいかない場合はお電話ください。",
  blocked: (phone: string) =>
    `この番号でのネット予約は現在受け付けておりません。お手数ですが、お電話（${phone}）にてお問い合わせください。`,
  empty:
    "番号が見つかりません。診察券の番号をお確かめの上、もう一度入力してください。うまくいかない場合はお電話ください。",
} as const;
