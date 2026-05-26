import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { fileURLToPath } from "node:url";
import { withLock } from "./fileLock.js";
import {
  generateSlotsForSession,
  getSessionsForDate,
  MAX_PATIENTS_PER_SLOT,
  SLOT_MINUTES,
  type Reservation,
  type TimeSlot,
} from "../shared/booking.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const RESERVATIONS_PATH = path.resolve(__dirname, "..", "data", "reservations.json");

function readReservationsSync(): Reservation[] {
  if (!fs.existsSync(RESERVATIONS_PATH)) {
    fs.writeFileSync(RESERVATIONS_PATH, "[]\n", "utf-8");
    return [];
  }
  const raw = fs.readFileSync(RESERVATIONS_PATH, "utf-8");
  const reservations = JSON.parse(raw) as Reservation[];
  
  // 日付跨ぎ時に前日の予約を自動削除
  cleanupPreviousDayReservations(reservations);
  
  return reservations;
}

async function readReservations(): Promise<Reservation[]> {
  return withLock("reservations.json", () => readReservationsSync());
}

/**
 * 前日の予約を自動削除する（日付跨ぎ時）
 */
function cleanupPreviousDayReservations(reservations: Reservation[]): void {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().slice(0, 10);
  
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().slice(0, 10);
  
  // 前日の予約を除外
  const filtered = reservations.filter(r => r.date !== yesterdayStr);
  
  // 変更があれば保存
  if (filtered.length < reservations.length) {
    writeReservations(filtered);
  }
}

function writeReservationsSync(list: Reservation[]) {
  fs.writeFileSync(RESERVATIONS_PATH, JSON.stringify(list, null, 2) + "\n", "utf-8");
}

async function writeReservations(list: Reservation[]): Promise<void> {
  return withLock("reservations.json", () => writeReservationsSync(list));
}

export async function getReservationsForDate(date: string): Promise<Reservation[]> {
  const reservations = await readReservations();
  return reservations.filter((r) => r.date === date);
}

export async function getAllReservations(): Promise<Reservation[]> {
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
      const available = isAdmin ? true : (count === 0);
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
  return withLock("reservations.json", async () => {
    const list = await readReservations();
  
  // 重複予約チェック（診察券番号がある場合のみ。ただし、新規患者（空または"新規"または"0000"）は除外）
  const isNewPatient = !input.membershipId || input.membershipId === "新規" || input.membershipId === "0000";
  if (!isNewPatient) {
    const existing = list.find(r => r.membershipId === input.membershipId);
    if (existing && !input.force) {
      return { 
        ok: false, 
        error: "already_booked", 
        existing 
      };
    }
  }

  const slots = await getSlotsForDate(input.date, input.isAdmin);
  const targetTimes = (input.times && input.times.length > 0 ? input.times : [input.time ?? ""]).filter(t => !!t);
  if (targetTimes.length === 0) {
    return { ok: false, error: "時間を選択してください。" };
  }
  
  // 確実に "HH:mm" 形式でソートする
  const sortedTimes = [...targetTimes].sort((a, b) => {
    const [ha, ma] = a.split(":").map(Number);
    const [hb, mb] = b.split(":").map(Number);
    return (ha * 60 + ma) - (hb * 60 + mb);
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
  const existingRes = !isNewPatient
    ? list.find(r => r.membershipId === input.membershipId)
    : null;
  const nextList = existingRes ? list.filter(r => r.id !== existingRes.id) : list;

  const reservation: Reservation = {
    id: randomUUID(),
    membershipId: input.membershipId,
    patientName: input.patientName,
    date: input.date,
    time: startTime,
    endTime: targetTimes.length > 1 ? endTime : undefined,
    comment: input.comment,
    createdAt: new Date().toISOString(),
    source: input.isAdmin ? 'admin' : 'web',
  };

    nextList.push(reservation);
    await writeReservations(nextList);

    return { ok: true, reservation };
  });
}

export async function cancelReservation(id: string): Promise<boolean> {
  return withLock("reservations.json", async () => {
    const list = await readReservations();
    const next = list.filter((r) => r.id !== id);
    if (next.length === list.length) return false;
    await writeReservations(next);
    return true;
  });
}

/**
 * 予約の来院ステータスを更新する
 */
export async function updateReservationArrivalStatus(id: string, arrived: boolean): Promise<boolean> {
  return withLock("reservations.json", async () => {
    const list = await readReservations();
    const reservation = list.find(r => r.id === id);
    if (!reservation) return false;
    
    reservation.arrived = arrived;
    await writeReservations(list);
    return true;
  });
}

/**
 * 予約情報を更新する（コメントなど）
 */
export async function updateReservation(id: string, updates: Partial<Reservation>): Promise<boolean> {
  return withLock("reservations.json", async () => {
    const list = await readReservations();
    const index = list.findIndex(r => r.id === id);
    if (index === -1) return false;
    
    list[index] = { ...list[index], ...updates };
    await writeReservations(list);
    return true;
  });
}
