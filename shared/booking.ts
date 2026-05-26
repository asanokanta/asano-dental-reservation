/** 自作予約システム — 診療時間・枠のルール */

import {
  getReceptionWindow,
  getSessionsForDate,
  isRegularClosedDay,
} from "./clinicHours";

export const SLOT_MINUTES = 30;
export const MAX_PATIENTS_PER_SLOT = 2;
export const BOOKING_DAYS_AHEAD_PATIENT = 180; // 6ヶ月
export const BOOKING_DAYS_AHEAD_ADMIN = 365; // 1年

/** 1日の診療枠（診療時間） */
export const SESSIONS = {
  morning: { start: "09:30", end: "13:00", label: "午前" },
  afternoon: { start: "14:30", end: "19:30", label: "午後" },
} as const;

export type Reservation = {
  id: string;
  membershipId: string;
  patientName: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  endTime?: string; // HH:mm (複数枠の場合の終了時間)
  createdAt: string;
  arrived?: boolean; // 来院済みフラグ
  comment?: string; // 予約コメント
  source?: 'web' | 'admin'; // 予約種別: 'web'=Web予約, 'admin'=電話・窓口予約
};

export type TimeSlot = {
  time: string;
  label: string;
  available: boolean;
};

/** 予約種別の表示ラベル */
export function getSourceLabel(source?: string): string {
  return source === 'web' ? 'Web予約' : source === 'admin' ? '電話・窓口' : '不明';
}

export { getSessionsForDate, isRegularClosedDay };

/** 日付が予約可能か */
export function isBookableDate(dateStr: string): boolean {
  return getSessionsForDate(dateStr).length > 0;
}

function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

function fromMinutes(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/** セッション内の予約枠一覧（最終受付を反映） */
export function generateSlotsForSession(
  dateStr: string,
  session: keyof typeof SESSIONS
): string[] {
  const window = getReceptionWindow(dateStr, session);
  if (!window) return [];

  const { start, end } = SESSIONS[session];
  const clinicStart = toMinutes(start);
  const clinicEnd = toMinutes(end);
  const slots: string[] = [];

  for (let t = clinicStart; t < clinicEnd; t += SLOT_MINUTES) {
    if (t < window.startMin || t > window.endMin) continue;
    slots.push(fromMinutes(t));
  }
  return slots;
}

export function getAvailableDates(isAdmin = false): string[] {
  const dates: string[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const startOffset = isAdmin ? 0 : 1;
  const daysAhead = isAdmin ? BOOKING_DAYS_AHEAD_ADMIN : BOOKING_DAYS_AHEAD_PATIENT;

  for (let i = startOffset; i <= daysAhead; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    const iso = d.toISOString().slice(0, 10);
    if (isBookableDate(iso)) dates.push(iso);
  }
  return dates;
}

export function formatDateJa(dateStr: string): string {
  const d = new Date(`${dateStr}T12:00:00`);
  const weekdays = ["日", "月", "火", "水", "木", "金", "土"];
  return `${d.getMonth() + 1}月${d.getDate()}日（${weekdays[d.getDay()]}）`;
}

/**
 * "HH:mm" 形式の時間を "HH:mm〜HH:mm" の範囲形式に変換する
 */
export function formatTimeRange(timeStr: string, endTimeStr?: string): string {
  if (!timeStr) return "";
  if (endTimeStr) {
    return `${timeStr}〜${endTimeStr}`;
  }
  const startMins = toMinutes(timeStr);
  const endMins = startMins + SLOT_MINUTES;
  return `${timeStr}〜${fromMinutes(endMins)}`;
}
