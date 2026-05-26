import { randomUUID } from "node:crypto";
import {
  generateSlotsForSession,
  getSessionsForDate,
  MAX_PATIENTS_PER_SLOT,
  SLOT_MINUTES,
  type Reservation,
  type TimeSlot,
} from "../shared/booking";
import { createClient } from "@supabase/supabase-js";

// Supabaseクライアントの初期化
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("SUPABASE_URL and SUPABASE_ANON_KEY environment variables are required");
}

const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Supabaseから予約データを取得
 */
async function readReservations(): Promise<Reservation[]> {
  const { data, error } = await supabase
    .from("reservations")
    .select("*")
    .order("date", { ascending: true })
    .order("time", { ascending: true });

  if (error) {
    console.error("Error reading reservations:", error);
    return [];
  }

  return (data || []).map((row: any) => ({
    id: row.id,
    membershipId: row.membership_id,
    patientName: row.patient_name,
    date: row.date,
    time: row.time,
    endTime: row.end_time,
    comment: row.comment,
    arrived: row.arrived,
    createdAt: row.created_at,
    source: row.source,
  }));
}

/**
 * Supabaseに予約データを保存
 */
async function writeReservation(reservation: Reservation): Promise<void> {
  const { error } = await supabase.from("reservations").upsert({
    id: reservation.id,
    membership_id: reservation.membershipId,
    patient_name: reservation.patientName,
    date: reservation.date,
    time: reservation.time,
    end_time: reservation.endTime,
    comment: reservation.comment,
    arrived: reservation.arrived || false,
    created_at: reservation.createdAt,
    source: reservation.source,
  });

  if (error) {
    throw new Error(`Failed to write reservation: ${error.message}`);
  }
}

/**
 * Supabaseから予約を削除
 */
async function deleteReservation(id: string): Promise<void> {
  const { error } = await supabase.from("reservations").delete().eq("id", id);

  if (error) {
    throw new Error(`Failed to delete reservation: ${error.message}`);
  }
}

/**
 * 前日以前の予約を自動削除
 */
async function cleanupOldReservations(): Promise<void> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().slice(0, 10);

  const { error } = await supabase
    .from("reservations")
    .delete()
    .lt("date", todayStr);

  if (error) {
    console.error("Error cleaning up old reservations:", error);
  }
}

export async function getReservationsForDate(date: string): Promise<Reservation[]> {
  await cleanupOldReservations();
  const reservations = await readReservations();
  return reservations.filter((r) => r.date === date);
}

export async function getAllReservations(): Promise<Reservation[]> {
  await cleanupOldReservations();
  const reservations = await readReservations();
  return reservations.sort((a, b) => {
    const da = `${a.date}T${a.time}`;
    const db = `${b.date}T${b.time}`;
    return da.localeCompare(db);
  });
}

export async function getSlotsForDate(date: string, isAdmin: boolean = false): Promise<TimeSlot[]> {
  const reservations = await getReservationsForDate(date);
  const bookedCountMap = new Map<string, number>();

  for (const r of reservations) {
    if (r.endTime) {
      // 複数枠の場合、開始時間から終了時間までの全スロットをカウント
      const [h1, m1] = r.time.split(":").map(Number);
      const [h2, m2] = r.endTime.split(":").map(Number);
      let currentMins = h1 * 60 + m1;
      const endMins = h2 * 60 + m2;

      while (currentMins < endMins) {
        const timeStr = `${String(Math.floor(currentMins / 60)).padStart(2, "0")}:${String(currentMins % 60).padStart(2, "0")}`;
        bookedCountMap.set(timeStr, (bookedCountMap.get(timeStr) ?? 0) + 1);
        currentMins += SLOT_MINUTES;
      }
    } else {
      bookedCountMap.set(r.time, (bookedCountMap.get(r.time) ?? 0) + 1);
    }
  }

  const sessions = getSessionsForDate(date);
  const slots: TimeSlot[] = [];

  for (const session of sessions) {
    for (const time of generateSlotsForSession(date, session)) {
      const count = bookedCountMap.get(time) ?? 0;
      // 患者側は1名でもいれば不可、医院側は常に可能（無制限）
      const available = isAdmin ? true : count === 0;
      slots.push({
        time,
        label: time,
        available,
      });
    }
  }

  return slots;
}

export async function createReservation(input: {
  membershipId: string;
  patientName: string;
  date: string;
  time?: string;
  times?: string[];
  comment?: string;
  force?: boolean;
  isAdmin?: boolean;
}): Promise<{ ok: true; reservation: Reservation } | { ok: false; error: string; existing?: Reservation }> {
  const list = await readReservations();

  // 重複予約チェック（診察券番号がある場合のみ。ただし、新規患者（空または"新規"または"0000"）は除外）
  const isNewPatient = !input.membershipId || input.membershipId === "新規" || input.membershipId === "0000";
  if (!isNewPatient) {
    const existing = list.find((r) => r.membershipId === input.membershipId);
    if (existing && !input.force) {
      return {
        ok: false,
        error: "already_booked",
        existing,
      };
    }
  }

  const slots = await getSlotsForDate(input.date, input.isAdmin);
  const targetTimes = (input.times && input.times.length > 0 ? input.times : [input.time ?? ""]).filter((t) => !!t);
  if (targetTimes.length === 0) {
    return { ok: false, error: "時間を選択してください。" };
  }

  // 確実に "HH:mm" 形式でソートする
  const sortedTimes = [...targetTimes].sort((a, b) => {
    const [ha, ma] = a.split(":").map(Number);
    const [hb, mb] = b.split(":").map(Number);
    return ha * 60 + ma - (hb * 60 + mb);
  });

  const startTime = sortedTimes[0];
  const lastTime = sortedTimes[sortedTimes.length - 1];

  // 複数枠の場合、連続性をチェック
  if (sortedTimes.length > 1) {
    for (let i = 0; i < sortedTimes.length - 1; i++) {
      const currentParts = sortedTimes[i].split(":").map(Number);
      const nextParts = sortedTimes[i + 1].split(":").map(Number);
      const currentMins = currentParts[0] * 60 + currentParts[1];
      const nextMins = nextParts[0] * 60 + nextParts[1];

      if (nextMins !== currentMins + SLOT_MINUTES) {
        return { ok: false, error: "選択した時間帯が連続していません。連続した時間を選択してください。" };
      }
    }
  }

  // 終了時間を計算 (最後の枠の開始時間 + SLOT_MINUTES)
  const lastTimeParts = lastTime.split(":").map(Number);
  if (lastTimeParts.length !== 2 || isNaN(lastTimeParts[0]) || isNaN(lastTimeParts[1])) {
    return { ok: false, error: "時間の形式が不正です。" };
  }
  const endMins = lastTimeParts[0] * 60 + lastTimeParts[1] + SLOT_MINUTES;

  // 24時間を越える場合はエラー
  if (endMins >= 24 * 60) {
    return { ok: false, error: "選択した時間が営業時間を超えています。" };
  }

  const endTime = `${String(Math.floor(endMins / 60)).padStart(2, "0")}:${String(endMins % 60).padStart(2, "0")}`;

  for (const t of targetTimes) {
    const slot = slots.find((s) => s.time === t);
    if (!slot) {
      return { ok: false, error: `選択した日時（${t}）は予約できません。` };
    }
    if (!input.isAdmin && !slot.available) {
      return { ok: false, error: `この時間帯（${t}）はすでに予約が入っています。` };
    }
  }

  // 既存の予約がある場合は削除（置き換え）。新規患者は置き換え対象にしない
  const existingRes = !isNewPatient ? list.find((r) => r.membershipId === input.membershipId) : null;

  if (existingRes) {
    await deleteReservation(existingRes.id);
  }

  const reservation: Reservation = {
    id: randomUUID(),
    membershipId: input.membershipId,
    patientName: input.patientName,
    date: input.date,
    time: startTime,
    endTime: targetTimes.length > 1 ? endTime : undefined,
    comment: input.comment,
    createdAt: new Date().toISOString(),
    source: input.isAdmin ? "admin" : "web",
  };

  await writeReservation(reservation);

  return { ok: true, reservation };
}

export async function cancelReservation(id: string): Promise<boolean> {
  const list = await readReservations();
  const exists = list.find((r) => r.id === id);
  if (!exists) return false;

  await deleteReservation(id);
  return true;
}

/**
 * 予約の来院ステータスを更新する
 */
export async function updateReservationArrivalStatus(id: string, arrived: boolean): Promise<boolean> {
  const list = await readReservations();
  const reservation = list.find((r) => r.id === id);
  if (!reservation) return false;

  reservation.arrived = arrived;
  await writeReservation(reservation);
  return true;
}

/**
 * 予約情報を更新する（コメントなど）
 */
export async function updateReservation(id: string, updates: Partial<Reservation>): Promise<boolean> {
  const list = await readReservations();
  const reservation = list.find((r) => r.id === id);
  if (!reservation) return false;

  const updated = { ...reservation, ...updates };
  await writeReservation(updated);
  return true;
}
