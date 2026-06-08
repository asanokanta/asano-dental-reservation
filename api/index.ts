import express from "express";
import { randomUUID } from "node:crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import {
  getAvailableDates,
  getSessionsForDate,
  generateSlotsForSession,
  SLOT_MINUTES,
  BOOKING_DAYS_AHEAD_PATIENT,
  createErrorResponse,
  createSuccessResponse,
  getHttpStatus,
  validate,
  webReservationSchema,
  adminReservationSchema,
} from "./lib.js";

// ---- Types ----
type PatientStatus = "normal" | "blocked";
type PatientRecord = { id: string; name: string; status: PatientStatus };
type ReserveValidationResult =
  | { ok: true; patient: { id: string; name: string } }
  | { ok: false; error: "not_found" | "blocked" | "empty" };
type Reservation = {
  id: string;
  membershipId: string;
  patientName: string;
  date: string;
  time: string;
  endTime?: string;
  comment?: string;
  arrived?: boolean;
  createdAt: string;
  source?: "web" | "admin";
  archived?: boolean;
};
type TimeSlot = { time: string; label: string; available: boolean };

// ---- Supabase lazy init ----
let _supabase: SupabaseClient | null = null;
function getSupabase(): SupabaseClient {
  if (!_supabase) {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_ANON_KEY;
    if (!url || !key) throw new Error("SUPABASE_URL and SUPABASE_ANON_KEY are required");
    _supabase = createClient(url, key);
  }
  return _supabase;
}

// ---- Patient store (Supabase) ----
let cachedPatients: PatientRecord[] | null = null;
let cacheTime = 0;
const CACHE_DURATION = 5000;

async function loadPatients(): Promise<PatientRecord[]> {
  const now = Date.now();
  if (cachedPatients && now - cacheTime < CACHE_DURATION) return cachedPatients;
  const { data, error } = await getSupabase().from("patients").select("*").order("id", { ascending: true });
  if (error) { console.error("Error loading patients:", error); return []; }
  cachedPatients = (data || []).map((row: any) => ({ id: row.id, name: row.name, status: row.status || "normal" }));
  cacheTime = now;
  return cachedPatients!;
}

async function upsertPatient(patient: PatientRecord): Promise<void> {
  const { error } = await getSupabase().from("patients").upsert({ id: patient.id, name: patient.name, status: patient.status });
  if (error) throw new Error(`Failed to upsert patient: ${error.message}`);
  cachedPatients = null;
}

async function deletePatient(id: string): Promise<boolean> {
  const { error } = await getSupabase().from("patients").delete().eq("id", id);
  if (error) { console.error("Error deleting patient:", error); return false; }
  cachedPatients = null;
  return true;
}

async function listPatients(): Promise<PatientRecord[]> {
  return loadPatients();
}

async function validateMembershipNumber(raw: string | undefined | null): Promise<ReserveValidationResult> {
  const id = (raw ?? "").trim().replace(/\D/g, "");
  if (!id) return { ok: false, error: "empty" };
  const formattedId = id.padStart(4, "0").slice(-4);
  const patients = await loadPatients();
  const patient = patients.find((p) => p.id === formattedId);
  if (!patient) return { ok: false, error: "not_found" };
  if (patient.status === "blocked") return { ok: false, error: "blocked" };
  return { ok: true, patient: { id: patient.id, name: patient.name } };
}

// ---- Reservation store (Supabase) ----
function rowToReservation(row: any): Reservation {
  return {
    id: row.id,
    membershipId: row.membership_id,
    patientName: row.patient_name,
    date: row.date,
    time: (row.time as string).slice(0, 5),       // "09:30:00" → "09:30"
    endTime: row.end_time ? (row.end_time as string).slice(0, 5) : undefined,
    comment: row.comment,
    arrived: row.arrived,
    createdAt: row.created_at,
    source: row.source,
    archived: row.archived ?? false,
  };
}

// アクティブな予約のみ（archived=false）
async function readReservations(): Promise<Reservation[]> {
  const { data, error } = await getSupabase().from("reservations").select("*").eq("archived", false).order("date", { ascending: true }).order("time", { ascending: true });
  if (error) { console.error("Error reading reservations:", error); return []; }
  return (data || []).map(rowToReservation);
}

// 全予約（archived含む・古い順）
async function readAllReservations(): Promise<Reservation[]> {
  const { data, error } = await getSupabase().from("reservations").select("*").order("date", { ascending: true }).order("time", { ascending: true });
  if (error) { console.error("Error reading all reservations:", error); return []; }
  return (data || []).map(rowToReservation);
}

async function writeReservation(reservation: Reservation): Promise<void> {
  const { error } = await getSupabase().from("reservations").upsert({
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
  if (error) throw new Error(`Failed to write reservation: ${error.message}`);
}

async function deleteReservation(id: string): Promise<void> {
  const { error } = await getSupabase().from("reservations").delete().eq("id", id);
  if (error) throw new Error(`Failed to delete reservation: ${error.message}`);
}

async function cleanupOldReservations(): Promise<void> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().slice(0, 10);
  // 削除ではなくアーカイブ化
  await getSupabase().from("reservations").update({ archived: true }).lt("date", todayStr).eq("archived", false);
}

async function getAllReservations(): Promise<Reservation[]> {
  await cleanupOldReservations();
  const reservations = await readReservations();
  return reservations.sort((a, b) => `${a.date}T${a.time}`.localeCompare(`${b.date}T${b.time}`));
}

async function getReservationsForDate(date: string): Promise<Reservation[]> {
  await cleanupOldReservations();
  const reservations = await readReservations();
  return reservations.filter((r) => r.date === date);
}

async function getSlotsForDate(date: string, isAdmin: boolean = false): Promise<TimeSlot[]> {
  const reservations = await getReservationsForDate(date);
  const bookedCountMap = new Map<string, number>();

  for (const r of reservations) {
    if (r.endTime) {
      const [h1, m1] = r.time.split(":").map(Number);
      const [h2, m2] = r.endTime.split(":").map(Number);
      let cur = h1 * 60 + m1;
      const end = h2 * 60 + m2;
      while (cur < end) {
        const t = `${String(Math.floor(cur / 60)).padStart(2, "0")}:${String(cur % 60).padStart(2, "0")}`;
        bookedCountMap.set(t, (bookedCountMap.get(t) ?? 0) + 1);
        cur += SLOT_MINUTES;
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
      slots.push({ time, label: time, available: isAdmin ? true : count === 0 });
    }
  }
  return slots;
}

type DateAvailability = "available" | "low" | "full" | "closed";
const LOW_AVAILABILITY_THRESHOLD = 3;

// カレンダー表示用：月内の各日の空き状況レベル（○ 余裕あり / ⚠ 残り少し / × 空きなし / 休 休診日）
async function getMonthAvailability(month: string): Promise<Record<string, DateAvailability>> {
  const [y, mo] = month.split("-").map(Number);
  if (!y || !mo) return {};
  const daysInMonth = new Date(y, mo, 0).getDate();

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const earliest = new Date(today);
  earliest.setDate(earliest.getDate() + 1);
  const latest = new Date(today);
  latest.setDate(latest.getDate() + BOOKING_DAYS_AHEAD_PATIENT);

  await cleanupOldReservations();
  const reservations = await readReservations();
  const bookedCountByKey = new Map<string, number>();
  for (const r of reservations) {
    if (r.endTime) {
      const [h1, m1] = r.time.split(":").map(Number);
      const [h2, m2] = r.endTime.split(":").map(Number);
      let mins = h1 * 60 + m1;
      const end = h2 * 60 + m2;
      while (mins < end) {
        const time = `${String(Math.floor(mins / 60)).padStart(2, "0")}:${String(mins % 60).padStart(2, "0")}`;
        const key = `${r.date}|${time}`;
        bookedCountByKey.set(key, (bookedCountByKey.get(key) ?? 0) + 1);
        mins += SLOT_MINUTES;
      }
    } else {
      const key = `${r.date}|${r.time}`;
      bookedCountByKey.set(key, (bookedCountByKey.get(key) ?? 0) + 1);
    }
  }

  const result: Record<string, DateAvailability> = {};
  for (let day = 1; day <= daysInMonth; day++) {
    const iso = `${y}-${String(mo).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const dateObj = new Date(`${iso}T00:00:00`);
    if (dateObj < earliest || dateObj > latest) continue;

    const sessions = getSessionsForDate(iso);
    if (sessions.length === 0) {
      result[iso] = "closed";
      continue;
    }

    let total = 0;
    let available = 0;
    for (const session of sessions) {
      for (const time of generateSlotsForSession(iso, session)) {
        total++;
        if ((bookedCountByKey.get(`${iso}|${time}`) ?? 0) === 0) available++;
      }
    }

    if (total === 0 || available === 0) result[iso] = "full";
    else if (available <= LOW_AVAILABILITY_THRESHOLD) result[iso] = "low";
    else result[iso] = "available";
  }

  return result;
}

async function createReservation(input: {
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
  const isNewPatient = !input.membershipId || input.membershipId === "新規" || input.membershipId === "0000";

  if (!isNewPatient) {
    const existing = list.find((r) => r.membershipId === input.membershipId);
    if (existing && !input.force) return { ok: false, error: "already_booked", existing };
  }

  const slots = await getSlotsForDate(input.date, input.isAdmin);
  const targetTimes = (input.times && input.times.length > 0 ? input.times : [input.time ?? ""]).filter((t) => !!t);
  if (targetTimes.length === 0) return { ok: false, error: "時間を選択してください。" };

  const sortedTimes = [...targetTimes].sort((a, b) => {
    const [ha, ma] = a.split(":").map(Number);
    const [hb, mb] = b.split(":").map(Number);
    return ha * 60 + ma - (hb * 60 + mb);
  });

  if (sortedTimes.length > 1) {
    for (let i = 0; i < sortedTimes.length - 1; i++) {
      const [hc, mc] = sortedTimes[i].split(":").map(Number);
      const [hn, mn] = sortedTimes[i + 1].split(":").map(Number);
      if (hn * 60 + mn !== hc * 60 + mc + SLOT_MINUTES) {
        return { ok: false, error: "選択した時間帯が連続していません。連続した時間を選択してください。" };
      }
    }
  }

  const lastTime = sortedTimes[sortedTimes.length - 1];
  const [lh, lm] = lastTime.split(":").map(Number);
  if (isNaN(lh) || isNaN(lm)) return { ok: false, error: "時間の形式が不正です。" };
  const endMins = lh * 60 + lm + SLOT_MINUTES;
  if (endMins >= 24 * 60) return { ok: false, error: "選択した時間が営業時間を超えています。" };
  const endTime = `${String(Math.floor(endMins / 60)).padStart(2, "0")}:${String(endMins % 60).padStart(2, "0")}`;

  for (const t of targetTimes) {
    const slot = slots.find((s) => s.time === t);
    if (!slot) return { ok: false, error: `選択した日時（${t}）は予約できません。` };
    if (!input.isAdmin && !slot.available) return { ok: false, error: `この時間帯（${t}）はすでに予約が入っています。` };
  }

  // force=true の場合は既存予約を残したまま追加（削除しない）

  const reservation: Reservation = {
    id: randomUUID(),
    membershipId: input.membershipId,
    patientName: input.patientName,
    date: input.date,
    time: sortedTimes[0],
    endTime: targetTimes.length > 1 ? endTime : undefined,
    comment: input.comment,
    createdAt: new Date().toISOString(),
    source: input.isAdmin ? "admin" : "web",
  };

  await writeReservation(reservation);
  return { ok: true, reservation };
}

async function cancelReservation(id: string): Promise<boolean> {
  const list = await readReservations();
  if (!list.find((r) => r.id === id)) return false;
  await deleteReservation(id);
  return true;
}

async function updateReservationArrivalStatus(id: string, arrived: boolean): Promise<boolean> {
  const list = await readReservations();
  const res = list.find((r) => r.id === id);
  if (!res) return false;
  res.arrived = arrived;
  await writeReservation(res);
  return true;
}

async function updateReservation(id: string, updates: Partial<Reservation>): Promise<boolean> {
  const list = await readReservations();
  const res = list.find((r) => r.id === id);
  if (!res) return false;
  await writeReservation({ ...res, ...updates });
  return true;
}

// ---- Express app ----
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "asano-admin";
const app = express();
app.use(express.json());

function isAdminReq(req: express.Request): boolean {
  return req.headers.authorization === `Bearer ${ADMIN_PASSWORD}`;
}

// 患者向け: 診察券番号検証
app.post("/api/reserve/validate", async (req, res) => {
  const result = await validateMembershipNumber(req.body?.membershipNumber);
  res.json(result);
});

// LIFF: LINE User IDで紐付き患者を取得（自動ログイン）
app.post("/api/reserve/liff-auth", async (req, res) => {
  const lineUserId = ((req.body?.lineUserId ?? "") as string).trim();
  if (!lineUserId) { res.json({ linked: false }); return; }
  const { data } = await getSupabase()
    .from("patients")
    .select("id, name")
    .eq("line_user_id", lineUserId)
    .eq("status", "normal")
    .maybeSingle();
  if (data) {
    res.json({ linked: true, patient: { id: data.id, name: data.name } });
  } else {
    res.json({ linked: false });
  }
});

// LIFF: LINE User IDとカルテを紐付け
app.post("/api/reserve/liff-link", async (req, res) => {
  const { lineUserId, membershipId } = req.body ?? {};
  if (!lineUserId || !membershipId) { res.status(400).json({ ok: false }); return; }
  const { error } = await getSupabase()
    .from("patients")
    .update({ line_user_id: lineUserId })
    .eq("id", membershipId);
  res.json({ ok: !error });
});

// 患者向け: 名前で患者検索（同姓同名判定）
app.post("/api/reserve/find-by-name", async (req, res) => {
  const name = ((req.body?.name ?? "") as string).trim().replace(/\s/g, "");
  if (!name) { res.status(400).json({ result: "notfound" }); return; }
  const patients = await loadPatients();
  // statusに関わらず名前一致数で同姓同名を判定（blockedでも名前は存在する）
  const allMatches = patients.filter(
    (p) => p.name.replace(/\s/g, "") === name
  );
  const normalMatches = allMatches.filter((p) => p.status === "normal");

  if (allMatches.length === 0) {
    res.json({ result: "notfound" });
  } else if (allMatches.length === 1 && normalMatches.length === 1) {
    // 1件のみ・正常 → スキップ
    res.json({ result: "unique", patient: { id: normalMatches[0].id, name: normalMatches[0].name } });
  } else {
    // 同姓同名あり（blocked含む）→ 診察券番号で特定させる
    res.json({ result: "multiple" });
  }
});

// 患者向け: 予約可能日一覧
app.get("/api/reserve/dates", (req, res) => {
  const adminMode = req.query.admin === "true";
  res.json({ dates: getAvailableDates(adminMode) });
});

// 患者向け: カレンダー用の月別空き状況（○ 余裕あり / ⚠ 残り少し / × 空きなし / 休 休診日）
app.get("/api/reserve/availability", async (req, res) => {
  const month = (req.query.month as string | undefined) ?? "";
  if (!/^\d{4}-\d{2}$/.test(month)) {
    res.status(400).json({ error: "month（YYYY-MM形式）が必要です" });
    return;
  }
  res.json({ availability: await getMonthAvailability(month) });
});

// 患者向け: 予約可能スロット一覧
app.get("/api/reserve/slots", async (req, res) => {
  const date = req.query.date as string | undefined;
  if (!date) { res.status(400).json({ error: "date が必要です" }); return; }
  const adminMode = req.query.admin === "true";
  const slots = await getSlotsForDate(date, adminMode);
  res.json({ slots });
});

// 患者向け: Web/LIFF予約
app.post("/api/reserve/book", async (req, res) => {
  const validation = validate(webReservationSchema, req.body);
  if (!validation.ok) {
    res.status(400).json(createErrorResponse(validation.error, "VALIDATION_ERROR"));
    return;
  }

  const check = await validateMembershipNumber(req.body?.membershipId);
  if (!check.ok) {
    res.status(403).json(createErrorResponse(check.error, "AUTHORIZATION_ERROR"));
    return;
  }

  const lineUserId: string | undefined = req.body?.lineUserId;
  const source = lineUserId ? "line" : "web";

  const result = await createReservation({
    membershipId: check.patient.id,
    patientName: check.patient.name,
    date: validation.data.date,
    time: validation.data.time,
    comment: validation.data.comment,
  });

  if (!result.ok && result.error === "already_booked") {
    res.status(getHttpStatus("CONFLICT")).json({
      ok: false, error: "already_booked", code: "CONFLICT",
      message: `${result.existing?.date} ${result.existing?.time}に予約があります。変更はお電話ください。`,
    });
    return;
  }
  if (!result.ok) {
    res.status(400).json(createErrorResponse(result.error, "VALIDATION_ERROR"));
    return;
  }

  // sourceをlineに上書き保存
  if (source === "line" && result.reservation) {
    await getSupabase().from("reservations")
      .update({ source: "line", line_user_id: lineUserId })
      .eq("id", result.reservation.id);
  }

  // LIFFからの予約時はLINEプッシュで完了通知
  if (lineUserId && result.reservation) {
    const r = result.reservation;
    const days = ["日","月","火","水","木","金","土"];
    const d = new Date(`${r.date}T12:00:00`);
    const dateJa = `${r.date}（${days[d.getDay()]}）`;
    const [h, m] = r.time.split(":").map(Number);
    const endMin = h * 60 + m + 30;
    const timeRange = `${r.time}〜${String(Math.floor(endMin/60)).padStart(2,"0")}:${String(endMin%60).padStart(2,"0")}`;
    const token = process.env.LINE_CHANNEL_ACCESS_TOKEN ?? "";
    fetch("https://api.line.me/v2/bot/message/push", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        to: lineUserId,
        messages: [{ type: "text", text:
          `✅ ご予約が完了しました！\n\n📅 ${dateJa}\n⏰ ${timeRange}\n👤 ${r.patientName}様\n\nご来院をお待ちしております😊\n\nキャンセル・変更はお電話にてお願いいたします。\n📞 03-3913-4618`
        }],
      }),
    }).catch(e => console.error("[push] error:", e));
  }

  res.json(createSuccessResponse(result.reservation));
});

// 管理: 患者一覧
app.get("/api/admin/patients", async (req, res) => {
  if (!isAdminReq(req)) { res.status(401).json({ error: "認証が必要です" }); return; }
  try {
    const patients = await listPatients();
    res.json({ patients });
  } catch (e) {
    console.error("Error listing patients:", e);
    res.status(500).json({ error: "患者一覧の取得に失敗しました" });
  }
});

// 管理: 患者追加
app.post("/api/admin/patients", async (req, res) => {
  if (!isAdminReq(req)) { res.status(401).json({ error: "認証が必要です" }); return; }
  const id = ((req.body?.id ?? "") as string).trim().replace(/\D/g, "");
  const name = ((req.body?.name ?? "") as string).trim();
  if (!id || !name) { res.status(400).json({ error: "診察券番号と氏名は必須です" }); return; }
  const record: PatientRecord = { id, name, status: req.body?.status === "blocked" ? "blocked" : "normal" };
  try {
    await upsertPatient(record);
    res.json({ ok: true, patient: record });
  } catch (e) {
    console.error("Error upserting patient:", e);
    res.status(500).json({ error: "患者の追加に失敗しました" });
  }
});

// 管理: 患者削除
app.delete("/api/admin/patients/:id", async (req, res) => {
  if (!isAdminReq(req)) { res.status(401).json({ error: "認証が必要です" }); return; }
  try {
    const ok = await deletePatient(req.params.id);
    res.status(ok ? 200 : 404).json({ ok });
  } catch (e) {
    console.error("Error deleting patient:", e);
    res.status(500).json({ error: "患者の削除に失敗しました" });
  }
});

// 管理: 予約一覧（アクティブのみ）
app.get("/api/admin/reservations", async (req, res) => {
  if (!isAdminReq(req)) { res.status(401).json({ error: "認証が必要です" }); return; }
  const reservations = await getAllReservations();
  res.json({ reservations });
});

// 管理: 予約一覧（過去分含む全件・古い順）
app.get("/api/admin/reservations/all", async (req, res) => {
  if (!isAdminReq(req)) { res.status(401).json({ error: "認証が必要です" }); return; }
  const reservations = await readAllReservations();
  res.json({ reservations });
});

// 管理: 予約作成
app.post("/api/admin/reservations", async (req, res) => {
  if (!isAdminReq(req)) { res.status(401).json({ error: "認証が必要です" }); return; }
  const validation = validate(adminReservationSchema, req.body);
  if (!validation.ok) {
    res.status(400).json(createErrorResponse(validation.error, "VALIDATION_ERROR"));
    return;
  }

  const result = await createReservation({
    membershipId: validation.data.membershipId,
    patientName: validation.data.patientName,
    date: validation.data.date,
    times: validation.data.times,
    comment: validation.data.comment,
    force: validation.data.force,
    isAdmin: true,
  });

  if (!result.ok && result.error === "already_booked") {
    res.status(getHttpStatus("CONFLICT")).json({
      ok: false,
      error: "already_booked",
      code: "CONFLICT",
      message: `診察券番号 ${result.existing?.membershipId} は既に予約済みです。`,
      existing: result.existing ?? null,
    });
    return;
  }
  if (!result.ok) {
    res.status(400).json(createErrorResponse(result.error, "VALIDATION_ERROR"));
    return;
  }
  res.json(createSuccessResponse(result.reservation));
});

// 管理: 予約キャンセル
app.delete("/api/admin/reservations/:id", async (req, res) => {
  if (!isAdminReq(req)) { res.status(401).json({ error: "認証が必要です" }); return; }
  const ok = await cancelReservation(req.params.id);
  res.status(ok ? 200 : 404).json({ ok });
});

// 管理: 予約更新（来院ステータス・コメント）
app.patch("/api/admin/reservations/:id", async (req, res) => {
  if (!isAdminReq(req)) { res.status(401).json({ error: "認証が必要です" }); return; }
  const { arrived, comment } = req.body ?? {};
  let ok = false;
  if (arrived !== undefined) {
    ok = await updateReservationArrivalStatus(req.params.id, arrived);
  } else if (comment !== undefined) {
    ok = await updateReservation(req.params.id, { comment });
  }
  res.status(ok ? 200 : 404).json({ ok });
});

// 管理: LINE一斉配信
app.post("/api/admin/line-broadcast", async (req, res) => {
  if (!isAdminReq(req)) { res.status(401).json({ error: "認証が必要です" }); return; }
  const message = ((req.body?.message ?? "") as string).trim();
  if (!message) { res.status(400).json({ error: "メッセージを入力してください" }); return; }

  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  if (!token) { res.status(500).json({ error: "LINE_CHANNEL_ACCESS_TOKEN が未設定です" }); return; }

  const response = await fetch("https://api.line.me/v2/bot/message/broadcast", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    },
    body: JSON.stringify({ messages: [{ type: "text", text: message }] }),
  });

  if (!response.ok) {
    const err = await response.text();
    console.error("[broadcast] LINE API error:", err);
    res.status(500).json({ error: "LINE送信に失敗しました", detail: err });
    return;
  }
  res.json({ ok: true });
});

// 診断
app.get("/api/diagnostics", async (req, res) => {
  try {
    const { count } = await getSupabase().from("reservations").select("*", { count: "exact", head: true });
    res.json({ ok: true, count });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

export default app;
