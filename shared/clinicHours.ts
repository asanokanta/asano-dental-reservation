/** あさの歯科 — 診療時間・最終受付・休診（表示・予約で共通） */

export const CONSULTATION_HOURS = {
  morning: { label: "午前", time: "9：30～13：00" },
  afternoon: { label: "午後", time: "14：30～19：30" },
} as const;

export const LAST_RECEPTION = [
  {
    days: "月～水・金曜日",
    morning: "午前12：00まで",
    afternoon: "午後19：00まで",
  },
  {
    days: "木曜日",
    morning: "午前10：00～12：00",
    afternoon: "午後17：00まで",
  },
  {
    days: "土曜日",
    morning: "午前12：00まで",
    afternoon: null as string | null,
  },
] as const;

export const CLOSURE_NOTES = [
  "水曜午前、土曜午後 休診",
  "第2・第4・第5木曜、第1・第3土曜、日曜、祝日 休診",
] as const;

export const WEEKLY_TABLE_NOTES = [
  "木曜の○※ … 診療あり（最終受付は午前10：00～12：00／午後17：00まで）。第2・第4・第5木曜は休診",
  "土曜の△ … 午前のみ診療（最終受付12：00まで）。第1・第3土曜は休診",
] as const;

const days = ["月", "火", "水", "木", "金", "土", "日・祝"] as const;

/** ○ = 診療, △ = 午前のみ, ○※ = 木曜（受付時間に注意）, × = 休診 */
export const WEEKLY_HOURS_TABLE = [
  { time: "午前（9：30～13：00）", slots: ["○", "○", "×", "○※", "○", "△", "×"] as const },
  { time: "午後（14：30～19：30）", slots: ["○", "○", "○", "○※", "○", "×", "×"] as const },
] as const;

export { days as WEEKLY_DAYS };

/** その月の第何週か（1〜5） */
export function getWeekOfMonth(date: Date): number {
  return Math.ceil(date.getDate() / 7);
}

/** 第2・第4・第5木曜、第1・第3土曜、日曜 */
export function isRegularClosedDay(dateStr: string): boolean {
  const d = new Date(`${dateStr}T12:00:00`);
  const day = d.getDay();
  if (day === 0) return true;
  const wom = getWeekOfMonth(d);
  if (day === 4 && (wom === 2 || wom === 4 || wom === 5)) return true;
  if (day === 6 && (wom === 1 || wom === 3)) return true;
  return false;
}

export type DaySession = "morning" | "afternoon";

/** その日に診療がある時間帯 */
export function getSessionsForDate(dateStr: string): DaySession[] {
  if (isRegularClosedDay(dateStr)) return [];
  const day = new Date(`${dateStr}T12:00:00`).getDay();
  if (day === 3) return ["afternoon"]; // 水曜午前休診
  if (day === 6) return ["morning"]; // 土曜午後休診
  return ["morning", "afternoon"];
}

/** 予約可能な最終受付（分）— session ごと */
export function getReceptionWindow(
  dateStr: string,
  session: DaySession
): { startMin: number; endMin: number } | null {
  if (!getSessionsForDate(dateStr).includes(session)) return null;

  const day = new Date(`${dateStr}T12:00:00`).getDay();
  const base =
    session === "morning"
      ? { startMin: 9 * 60 + 30, endMin: 13 * 60 }
      : { startMin: 14 * 60 + 30, endMin: 19 * 60 + 30 };

  if (day === 4) {
    return session === "morning"
      ? { startMin: 10 * 60, endMin: 12 * 60 }
      : { startMin: base.startMin, endMin: 17 * 60 };
  }

  if (session === "morning") {
    return { ...base, endMin: 12 * 60 };
  }

  if (day === 6) {
    return { ...base, endMin: 12 * 60 };
  }

  // 月・火・水・金の午後
  return { ...base, endMin: 19 * 60 };
}
