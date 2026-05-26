// shared/clinicHours.ts のコピー（Vercel bundleのため）
export function getWeekOfMonth(date: Date): number {
  return Math.ceil(date.getDate() / 7);
}
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
export function getSessionsForDate(dateStr: string): DaySession[] {
  if (isRegularClosedDay(dateStr)) return [];
  const day = new Date(`${dateStr}T12:00:00`).getDay();
  if (day === 3) return ["afternoon"];
  if (day === 6) return ["morning"];
  return ["morning", "afternoon"];
}
export function getReceptionWindow(dateStr: string, session: DaySession): { startMin: number; endMin: number } | null {
  if (!getSessionsForDate(dateStr).includes(session)) return null;
  const day = new Date(`${dateStr}T12:00:00`).getDay();
  const base = session === "morning"
    ? { startMin: 9 * 60 + 30, endMin: 13 * 60 }
    : { startMin: 14 * 60 + 30, endMin: 19 * 60 + 30 };
  if (day === 4) return session === "morning" ? { startMin: 10 * 60, endMin: 12 * 60 } : { ...base, endMin: 17 * 60 };
  if (session === "morning") return { ...base, endMin: 12 * 60 };
  if (day === 6) return { ...base, endMin: 12 * 60 };
  return { ...base, endMin: 19 * 60 };
}

// shared/booking.ts のコピー
export const SLOT_MINUTES = 30;
export const BOOKING_DAYS_AHEAD_PATIENT = 180;
export const BOOKING_DAYS_AHEAD_ADMIN = 365;
export const SESSIONS = {
  morning: { start: "09:30", end: "13:00", label: "午前" },
  afternoon: { start: "14:30", end: "19:30", label: "午後" },
} as const;

function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}
function fromMinutes(mins: number): string {
  return `${String(Math.floor(mins / 60)).padStart(2, "0")}:${String(mins % 60).padStart(2, "0")}`;
}
export function generateSlotsForSession(dateStr: string, session: keyof typeof SESSIONS): string[] {
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
    if (getSessionsForDate(iso).length > 0) dates.push(iso);
  }
  return dates;
}

// shared/apiResponse.ts のコピー
export type ApiErrorCode = "VALIDATION_ERROR" | "AUTHENTICATION_ERROR" | "AUTHORIZATION_ERROR" | "NOT_FOUND" | "CONFLICT" | "INTERNAL_ERROR" | "LOCK_TIMEOUT";
export function createErrorResponse(message: string, code: ApiErrorCode = "INTERNAL_ERROR") {
  return { ok: false as const, error: message, code };
}
export function createSuccessResponse<T>(data: T) {
  return { ok: true as const, data };
}
export function getHttpStatus(code?: ApiErrorCode): number {
  switch (code) {
    case "VALIDATION_ERROR": return 400;
    case "AUTHENTICATION_ERROR": return 401;
    case "AUTHORIZATION_ERROR": return 403;
    case "NOT_FOUND": return 404;
    case "CONFLICT": return 409;
    default: return 500;
  }
}

// shared/validation.ts のコピー
import { z } from "zod";
export const webReservationSchema = z.object({
  membershipId: z.string().optional(),
  patientName: z.string().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
});
export const adminReservationSchema = z.object({
  membershipId: z.string().min(1),
  patientName: z.string().min(1).max(50),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  times: z.array(z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/)).min(1),
  comment: z.string().optional(),
  force: z.boolean().optional(),
});
export function validate<T>(schema: z.ZodSchema<T>, data: unknown): { ok: true; data: T } | { ok: false; error: string } {
  try {
    return { ok: true, data: schema.parse(data) };
  } catch (e) {
    if (e instanceof z.ZodError) return { ok: false, error: e.issues[0]?.message || "入力値が不正です" };
    return { ok: false, error: "予期しないエラーが発生しました" };
  }
}
