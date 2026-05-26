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

export const RESERVE_ERROR_MESSAGES = {
  not_found:
    "番号が見つかりません。診察券の番号をお確かめの上、もう一度入力してください。うまくいかない場合はお電話ください。",
  blocked: (phone: string) =>
    `この番号でのネット予約は現在受け付けておりません。お手数ですが、お電話（${phone}）にてお問い合わせください。`,
  empty:
    "番号が見つかりません。診察券の番号をお確かめの上、もう一度入力してください。うまくいかない場合はお電話ください。",
} as const;
