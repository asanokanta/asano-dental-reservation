import { z } from "zod";

/**
 * 診察券番号のバリデーション
 * - 4桁の数字のみ
 * - または "新規"
 */
export const membershipIdSchema = z.union([
  z.literal("新規"),
  z.literal("0000"),
  z.string().regex(/^\d{4}$/, "診察券番号は4桁の数字である必要があります"),
]);

/**
 * 患者名のバリデーション
 * - 1文字以上50文字以下
 * - 空白のみは不可
 */
export const patientNameSchema = z
  .string()
  .min(1, "患者名は必須です")
  .max(50, "患者名は50文字以下である必要があります")
  .refine((val) => val.trim().length > 0, "患者名は空白のみでは登録できません");

/**
 * 日付のバリデーション
 * - YYYY-MM-DD形式
 * - 有効な日付
 */
export const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "日付はYYYY-MM-DD形式である必要があります")
  .refine((val) => {
    const date = new Date(`${val}T00:00:00`);
    return !isNaN(date.getTime());
  }, "無効な日付です");

/**
 * 時刻のバリデーション
 * - HH:mm形式
 * - 00:00〜23:59
 */
export const timeSchema = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "時刻はHH:mm形式（00:00〜23:59）である必要があります");

/**
 * Web予約の入力バリデーション
 */
export const webReservationSchema = z.object({
  membershipId: membershipIdSchema.optional(),
  patientName: patientNameSchema.optional(),
  date: dateSchema,
  time: timeSchema,
});

/**
 * 管理者予約の入力バリデーション
 */
export const adminReservationSchema = z.object({
  membershipId: z.string().min(1, "診察券番号は必須です"),
  patientName: patientNameSchema,
  date: dateSchema,
  times: z.array(timeSchema).min(1, "時間を選択してください"),
  comment: z.string().optional(),
  force: z.boolean().optional(),
});

/**
 * バリデーション結果の型
 */
export type ValidationResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

/**
 * バリデーション実行ヘルパー
 */
export function validate<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): ValidationResult<T> {
  try {
    const result = schema.parse(data);
    return { ok: true, data: result };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const message = error.issues[0]?.message || "入力値が不正です";
      return { ok: false, error: message };
    }
    return { ok: false, error: "予期しないエラーが発生しました" };
  }
}
