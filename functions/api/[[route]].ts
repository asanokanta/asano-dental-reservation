import { Hono } from "hono";
import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "crypto";
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
} from "../../api/lib.js";

type Env = {
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
  ADMIN_PASSWORD: string;
  LINE_CHANNEL_ACCESS_TOKEN: string;
};

type PatientStatus = "normal" | "blocked";
type PatientRecord = { id: string; name: string; status: PatientStatus };
type Reservation = {
  id: string; membershipId: string; patientName: string;
  date: string; time: string; endTime?: string; comment?: string;
  arrived?: boolean; createdAt: string; source?: string; archived?: boolean;
};
type TimeSlot = { time: string; label: string; available: boolean };

function getSupabase(env: Env) {
  return createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY);
}

function rowToReservation(row: Record<string, unknown>): Reservation {
  return {
    id: row.id as string,
    membershipId: row.membership_id as string,
    patientName: row.patient_name as string,
    date: row.date as string,
    time: ((row.time as string) ?? "").slice(0, 5),
    endTime: row.end_time ? ((row.end_time as string)).slice(0, 5) : undefined,
    comment: row.comment as string | undefined,
    arrived: row.arrived as boolean | undefined,
    createdAt: row.created_at as string,
    source: row.source as string | undefined,
    archived: (row.archived as boolean) ?? false,
  };
}

async function loadPatients(env: Env): Promise<PatientRecord[]> {
  const { data } = await getSupabase(env).from("patients").select("*").order("id");
  return (data ?? []).map((r: Record<string, unknown>) => ({
    id: r.id as string,
    name: r.name as string,
    status: (r.status as PatientStatus) ?? "normal",
  }));
}

async function readReservations(env: Env): Promise<Reservation[]> {
  const { data } = await getSupabase(env).from("reservations")
    .select("*").eq("archived", false).order("date").order("time");
  return (data ?? []).map(rowToReservation);
}

async function readAllReservations(env: Env): Promise<Reservation[]> {
  const { data } = await getSupabase(env).from("reservations")
    .select("*").order("created_at", { ascending: false });
  return (data ?? []).map(rowToReservation);
}

async function archiveOld(env: Env) {
  const today = new Date().toISOString().slice(0, 10);
  await getSupabase(env).from("reservations")
    .update({ archived: true }).lt("date", today).eq("archived", false);
}

async function getReservationsForDate(date: string, env: Env): Promise<Reservation[]> {
  await archiveOld(env);
  const all = await readReservations(env);
  return all.filter((r) => r.date === date);
}

async function isClosedDay(date: string, env: Env): Promise<boolean> {
  const { data } = await getSupabase(env).from("closed_days").select("date").eq("date", date).maybeSingle();
  return !!data;
}

async function getSlotsForDate(date: string, isAdmin: boolean, env: Env): Promise<TimeSlot[]> {
  // 臨時休診チェック（患者のみブロック、管理者は予約可能）
  if (!isAdmin && await isClosedDay(date, env)) return [];
  const reservations = await getReservationsForDate(date, env);
  const bookedMap = new Map<string, number>();
  for (const r of reservations) {
    if (r.endTime) {
      const [h1, m1] = r.time.split(":").map(Number);
      const [h2, m2] = r.endTime.split(":").map(Number);
      let cur = h1 * 60 + m1;
      while (cur < h2 * 60 + m2) {
        const t = `${String(Math.floor(cur / 60)).padStart(2, "0")}:${String(cur % 60).padStart(2, "0")}`;
        bookedMap.set(t, (bookedMap.get(t) ?? 0) + 1);
        cur += SLOT_MINUTES;
      }
    } else {
      bookedMap.set(r.time, (bookedMap.get(r.time) ?? 0) + 1);
    }
  }
  const slots: TimeSlot[] = [];
  for (const session of getSessionsForDate(date)) {
    for (const time of generateSlotsForSession(date, session)) {
      slots.push({ time, label: time, available: isAdmin ? true : (bookedMap.get(time) ?? 0) === 0 });
    }
  }
  return slots;
}

type DateAvailability = "available" | "low" | "full" | "closed";
const LOW_AVAILABILITY_THRESHOLD = 3;

// カレンダー表示用：月内の各日の空き状況レベル（○ 余裕あり / ⚠ 残り少し / × 空きなし / 休 休診日）
async function getMonthAvailability(month: string, env: Env): Promise<Record<string, DateAvailability>> {
  const [y, mo] = month.split("-").map(Number);
  if (!y || !mo) return {};
  const daysInMonth = new Date(y, mo, 0).getDate();
  const pad = String(mo).padStart(2, "0");
  const monthStart = `${y}-${pad}-01`;
  const monthEnd = `${y}-${pad}-${String(daysInMonth).padStart(2, "0")}`;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const earliest = new Date(today);
  earliest.setDate(earliest.getDate() + 1);
  const latest = new Date(today);
  latest.setDate(latest.getDate() + BOOKING_DAYS_AHEAD_PATIENT);

  await archiveOld(env);
  const [{ data: closedRows }, reservations] = await Promise.all([
    getSupabase(env).from("closed_days").select("date").gte("date", monthStart).lte("date", monthEnd),
    readReservations(env),
  ]);
  const closedSet = new Set((closedRows ?? []).map((row: { date: string }) => row.date));

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
    const iso = `${y}-${pad}-${String(day).padStart(2, "0")}`;
    const dateObj = new Date(`${iso}T00:00:00`);
    if (dateObj < earliest || dateObj > latest) continue;

    const sessions = getSessionsForDate(iso);
    if (sessions.length === 0 || closedSet.has(iso)) {
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

async function validateMembership(raw: string | undefined, env: Env) {
  const id = (raw ?? "").trim().replace(/\D/g, "").padStart(4, "0").slice(-4);
  if (!id) return { ok: false as const, error: "empty" };
  const patients = await loadPatients(env);
  const p = patients.find((x) => x.id === id);
  if (!p) return { ok: false as const, error: "not_found" };
  if (p.status === "blocked") return { ok: false as const, error: "blocked" };
  return { ok: true as const, patient: { id: p.id, name: p.name } };
}

async function createReservation(input: {
  membershipId: string; patientName: string; date: string;
  time?: string; times?: string[]; comment?: string; force?: boolean; isAdmin?: boolean;
}, env: Env): Promise<{ ok: true; reservation: Reservation } | { ok: false; error: string; existing?: Reservation }> {
  const list = await readReservations(env);
  const isNew = !input.membershipId || input.membershipId === "新規";
  if (!isNew && !input.force) {
    const existing = list.find((r) => r.membershipId === input.membershipId);
    if (existing) return { ok: false, error: "already_booked", existing };
  }
  const slots = await getSlotsForDate(input.date, !!input.isAdmin, env);
  const targetTimes = (input.times?.length ? input.times : [input.time ?? ""]).filter(Boolean);
  if (!targetTimes.length) return { ok: false, error: "時間を選択してください。" };
  const sorted = [...targetTimes].sort();
  for (const t of targetTimes) {
    const slot = slots.find((s) => s.time === t);
    if (!slot) return { ok: false, error: `選択した日時（${t}）は予約できません。` };
    if (!input.isAdmin && !slot.available) return { ok: false, error: `この時間帯（${t}）はすでに予約が入っています。` };
  }
  const last = sorted[sorted.length - 1];
  const [lh, lm] = last.split(":").map(Number);
  const endMins = lh * 60 + lm + SLOT_MINUTES;
  const endTime = `${String(Math.floor(endMins / 60)).padStart(2, "0")}:${String(endMins % 60).padStart(2, "0")}`;
  const reservation: Reservation = {
    id: randomUUID(),
    membershipId: input.membershipId,
    patientName: input.patientName,
    date: input.date,
    time: sorted[0],
    endTime: sorted.length > 1 ? endTime : undefined,
    comment: input.comment,
    createdAt: new Date().toISOString(),
    source: input.isAdmin ? "admin" : "web",
  };
  const { error } = await getSupabase(env).from("reservations").insert({
    id: reservation.id, membership_id: reservation.membershipId,
    patient_name: reservation.patientName, date: reservation.date,
    time: reservation.time, end_time: reservation.endTime,
    comment: reservation.comment, arrived: false,
    created_at: reservation.createdAt, source: reservation.source,
  });
  if (error) return { ok: false, error: error.message };
  return { ok: true, reservation };
}

// ---- Hono app ----
const app = new Hono<{ Bindings: Env }>();

// 患者: 診察券番号検証
app.post("/api/reserve/validate", async (c) => {
  const body = await c.req.json<{ membershipNumber?: string }>();
  return c.json(await validateMembership(body.membershipNumber, c.env));
});

// 患者: 名前検索
app.post("/api/reserve/find-by-name", async (c) => {
  const body = await c.req.json<{ name?: string }>();
  const name = (body.name ?? "").trim().replace(/\s/g, "");
  if (!name) return c.json({ result: "notfound" });
  const patients = await loadPatients(c.env);
  const all = patients.filter((p) => p.name.replace(/\s/g, "") === name);
  const normal = all.filter((p) => p.status === "normal");
  if (all.length === 0) return c.json({ result: "notfound" });
  if (all.length === 1 && normal.length === 1) return c.json({ result: "unique", patient: { id: normal[0].id, name: normal[0].name } });
  return c.json({ result: "multiple" });
});

// LIFF: 予約完了後にセッション保存（予約確認をスキップするため）
app.post("/api/reserve/liff-confirm", async (c) => {
  const body = await c.req.json<{
    lineUserId?: string; membershipId?: string;
    date?: string; time?: string; patientName?: string;
  }>();
  const { lineUserId, membershipId, date, time, patientName } = body;
  if (!lineUserId || !membershipId || !date || !time || !patientName) {
    return c.json({ ok: false }, 400);
  }
  // LINE IDとカルテを紐付け
  await getSupabase(c.env).from("patients")
    .update({ line_user_id: lineUserId }).eq("id", membershipId);
  // セッションに予約内容を保存
  await getSupabase(c.env).from("line_sessions").upsert({
    user_id: lineUserId,
    state: { step: "just_confirmed", date, time, patientName, membershipId },
    updated_at: new Date().toISOString(),
  });
  return c.json({ ok: true });
});

// 患者: 自分の予約一覧取得（membershipIdで照合）
app.post("/api/reserve/my-reservations", async (c) => {
  const body = await c.req.json<{ membershipId?: string }>();
  const membershipId = (body.membershipId ?? "").trim();
  if (!membershipId) return c.json({ reservations: [] });
  const today = new Date().toISOString().slice(0, 10);
  const { data } = await getSupabase(c.env)
    .from("reservations")
    .select("date, time, patient_name")
    .eq("membership_id", membershipId)
    .eq("archived", false)
    .gte("date", today)
    .order("date", { ascending: true })
    .order("time", { ascending: true })
    .limit(5);
  return c.json({ reservations: data ?? [] });
});

// LIFF: 友だち確認
app.post("/api/reserve/liff-auth", async (c) => {
  const body = await c.req.json<{ lineUserId?: string }>();
  if (!body.lineUserId) return c.json({ linked: false });
  const { data } = await getSupabase(c.env).from("patients").select("id,name")
    .eq("line_user_id", body.lineUserId).eq("status", "normal").maybeSingle();
  return c.json(data ? { linked: true, patient: { id: data.id, name: data.name } } : { linked: false });
});

// LIFF: 紐付け
app.post("/api/reserve/liff-link", async (c) => {
  const body = await c.req.json<{ lineUserId?: string; membershipId?: string }>();
  if (!body.lineUserId || !body.membershipId) return c.json({ ok: false }, 400);
  const { error } = await getSupabase(c.env).from("patients")
    .update({ line_user_id: body.lineUserId }).eq("id", body.membershipId);
  return c.json({ ok: !error });
});

// 患者: 予約可能日
app.get("/api/reserve/dates", (c) => {
  const admin = c.req.query("admin") === "true";
  return c.json({ dates: getAvailableDates(admin) });
});

// 患者: カレンダー用の月別空き状況（○ 余裕あり / ⚠ 残り少し / × 空きなし / 休 休診日）
app.get("/api/reserve/availability", async (c) => {
  const month = c.req.query("month") ?? "";
  if (!/^\d{4}-\d{2}$/.test(month)) return c.json({ error: "month（YYYY-MM形式）が必要です" }, 400);
  return c.json({ availability: await getMonthAvailability(month, c.env) });
});

// 患者: スロット
app.get("/api/reserve/slots", async (c) => {
  const date = c.req.query("date");
  if (!date) return c.json({ error: "date が必要です" }, 400);
  const requestedAdmin = c.req.query("admin") === "true";
  const isAdminAuth = c.req.header("authorization") === `Bearer ${c.env.ADMIN_PASSWORD}`;
  const admin = requestedAdmin && isAdminAuth;
  return c.json({ slots: await getSlotsForDate(date, admin, c.env) });
});

// 患者/LIFF: 予約
app.post("/api/reserve/book", async (c) => {
  const body = await c.req.json<Record<string, unknown>>();
  const validation = validate(webReservationSchema, body);
  if (!validation.ok) return c.json(createErrorResponse(validation.error, "VALIDATION_ERROR"), 400);
  const check = await validateMembership(body.membershipId as string, c.env);
  if (!check.ok) return c.json(createErrorResponse(check.error, "AUTHORIZATION_ERROR"), 403);
  const lineUserId = body.lineUserId as string | undefined;
  const result = await createReservation({
    membershipId: check.patient.id, patientName: check.patient.name,
    date: validation.data.date, time: validation.data.time, comment: validation.data.comment,
  }, c.env);
  if (!result.ok && result.error === "already_booked") {
    return c.json({ ok: false, error: "already_booked", code: "CONFLICT",
      message: `${result.existing?.date} ${result.existing?.time}に予約があります。変更はお電話ください。` }, 409);
  }
  if (!result.ok) return c.json(createErrorResponse(result.error, "VALIDATION_ERROR"), 400);
  if (lineUserId && result.reservation) {
    await getSupabase(c.env).from("reservations")
      .update({ source: "line", line_user_id: lineUserId }).eq("id", result.reservation.id);
    const r = result.reservation;
    const days = ["日","月","火","水","木","金","土"];
    const dow = days[new Date(`${r.date}T12:00:00`).getDay()];
    const [h, m] = r.time.split(":").map(Number);
    const endMin = h * 60 + m + 30;
    const timeRange = `${r.time}〜${String(Math.floor(endMin/60)).padStart(2,"0")}:${String(endMin%60).padStart(2,"0")}`;
    await fetch("https://api.line.me/v2/bot/message/push", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${c.env.LINE_CHANNEL_ACCESS_TOKEN}` },
      body: JSON.stringify({ to: lineUserId, messages: [{ type: "text", text:
        `✅ ご予約が完了しました！\n\n📅 ${r.date}（${dow}）\n⏰ ${timeRange}\n👤 ${r.patientName}様\n\nご来院をお待ちしております😊\n\nキャンセル・変更はお電話にてお願いいたします。\n📞 03-3913-4618`
      }] }),
    }).catch(() => {});
  }
  return c.json(createSuccessResponse(result.reservation));
});

// 管理: 患者一覧
app.get("/api/admin/patients", async (c) => {
  if (c.req.header("authorization") !== `Bearer ${c.env.ADMIN_PASSWORD}`) return c.json({ error: "認証が必要です" }, 401);
  const patients = await loadPatients(c.env);
  return c.json({ patients });
});

// 管理: 患者追加
app.post("/api/admin/patients", async (c) => {
  if (c.req.header("authorization") !== `Bearer ${c.env.ADMIN_PASSWORD}`) return c.json({ error: "認証が必要です" }, 401);
  const body = await c.req.json<{ id?: string; name?: string; status?: string }>();
  const id = (body.id ?? "").trim().replace(/\D/g, "");
  const name = (body.name ?? "").trim();
  if (!id || !name) return c.json({ error: "診察券番号と氏名は必須です" }, 400);
  const { error } = await getSupabase(c.env).from("patients").upsert({ id, name, status: body.status === "blocked" ? "blocked" : "normal" });
  if (error) return c.json({ error: "患者の追加に失敗しました" }, 500);
  return c.json({ ok: true, patient: { id, name } });
});

// 管理: 患者削除
app.delete("/api/admin/patients/:id", async (c) => {
  if (c.req.header("authorization") !== `Bearer ${c.env.ADMIN_PASSWORD}`) return c.json({ error: "認証が必要です" }, 401);
  const { error } = await getSupabase(c.env).from("patients").delete().eq("id", c.req.param("id"));
  return c.json({ ok: !error });
});

// 管理: 予約一覧（全件）
app.get("/api/admin/reservations/all", async (c) => {
  if (c.req.header("authorization") !== `Bearer ${c.env.ADMIN_PASSWORD}`) return c.json({ error: "認証が必要です" }, 401);
  return c.json({ reservations: await readAllReservations(c.env) });
});

// 管理: 予約一覧（アクティブ）
app.get("/api/admin/reservations", async (c) => {
  if (c.req.header("authorization") !== `Bearer ${c.env.ADMIN_PASSWORD}`) return c.json({ error: "認証が必要です" }, 401);
  await archiveOld(c.env);
  const reservations = (await readReservations(c.env)).sort((a, b) =>
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  return c.json({ reservations });
});

// 管理: 予約作成
app.post("/api/admin/reservations", async (c) => {
  if (c.req.header("authorization") !== `Bearer ${c.env.ADMIN_PASSWORD}`) return c.json({ error: "認証が必要です" }, 401);
  const body = await c.req.json<Record<string, unknown>>();
  const validation = validate(adminReservationSchema, body);
  if (!validation.ok) return c.json(createErrorResponse(validation.error, "VALIDATION_ERROR"), 400);
  const result = await createReservation({
    membershipId: validation.data.membershipId, patientName: validation.data.patientName,
    date: validation.data.date, times: validation.data.times,
    comment: validation.data.comment, force: validation.data.force, isAdmin: true,
  }, c.env);
  if (!result.ok && result.error === "already_booked") {
    return c.json({ ok: false, error: "already_booked", code: "CONFLICT",
      message: `診察券番号 ${result.existing?.membershipId} は既に予約済みです。`, existing: result.existing }, 409);
  }
  if (!result.ok) return c.json(createErrorResponse(result.error, "VALIDATION_ERROR"), 400);
  return c.json(createSuccessResponse(result.reservation));
});

// 管理: 予約キャンセル
app.delete("/api/admin/reservations/:id", async (c) => {
  if (c.req.header("authorization") !== `Bearer ${c.env.ADMIN_PASSWORD}`) return c.json({ error: "認証が必要です" }, 401);
  const { error } = await getSupabase(c.env).from("reservations").delete().eq("id", c.req.param("id"));
  return c.json({ ok: !error });
});

// 管理: 予約更新
app.patch("/api/admin/reservations/:id", async (c) => {
  if (c.req.header("authorization") !== `Bearer ${c.env.ADMIN_PASSWORD}`) return c.json({ error: "認証が必要です" }, 401);
  const body = await c.req.json<{ arrived?: boolean; comment?: string }>();
  const updates: Record<string, unknown> = {};
  if (body.arrived !== undefined) updates.arrived = body.arrived;
  if (body.comment !== undefined) updates.comment = body.comment;
  const { error } = await getSupabase(c.env).from("reservations").update(updates).eq("id", c.req.param("id"));
  return c.json({ ok: !error });
});

// 管理: 臨時休診日一覧
app.get("/api/admin/closed-days", async (c) => {
  if (c.req.header("authorization") !== `Bearer ${c.env.ADMIN_PASSWORD}`) return c.json({ error: "認証が必要です" }, 401);
  const today = new Date().toISOString().slice(0, 10);
  const { data } = await getSupabase(c.env).from("closed_days").select("*").gte("date", today).order("date");
  return c.json({ closedDays: data ?? [] });
});

// 管理: 臨時休診日追加
app.post("/api/admin/closed-days", async (c) => {
  if (c.req.header("authorization") !== `Bearer ${c.env.ADMIN_PASSWORD}`) return c.json({ error: "認証が必要です" }, 401);
  const body = await c.req.json<{ date?: string; reason?: string }>();
  if (!body.date) return c.json({ error: "date が必要です" }, 400);
  const { error } = await getSupabase(c.env).from("closed_days").insert({ date: body.date, reason: body.reason ?? "" });
  if (error) return c.json({ error: error.message }, 500);
  return c.json({ ok: true });
});

// 管理: 臨時休診日削除
app.delete("/api/admin/closed-days/:date", async (c) => {
  if (c.req.header("authorization") !== `Bearer ${c.env.ADMIN_PASSWORD}`) return c.json({ error: "認証が必要です" }, 401);
  const { error } = await getSupabase(c.env).from("closed_days").delete().eq("date", c.req.param("date"));
  return c.json({ ok: !error });
});

// 管理: LINE一斉配信
app.post("/api/admin/line-broadcast", async (c) => {
  if (c.req.header("authorization") !== `Bearer ${c.env.ADMIN_PASSWORD}`) return c.json({ error: "認証が必要です" }, 401);
  const body = await c.req.json<{ message?: string }>();
  const message = (body.message ?? "").trim();
  if (!message) return c.json({ error: "メッセージを入力してください" }, 400);
  const res = await fetch("https://api.line.me/v2/bot/message/broadcast", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${c.env.LINE_CHANNEL_ACCESS_TOKEN}` },
    body: JSON.stringify({ messages: [{ type: "text", text: message }] }),
  });
  if (!res.ok) return c.json({ error: "LINE送信に失敗しました" }, 500);
  return c.json({ ok: true });
});

// 診断
app.get("/api/diagnostics", async (c) => {
  const { count } = await getSupabase(c.env).from("reservations").select("*", { count: "exact", head: true });
  return c.json({ ok: true, count });
});

export const onRequest: PagesFunction<Env> = (context) => {
  return app.fetch(context.request, context.env);
};
