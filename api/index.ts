// Vercel Serverless Function — スタンドアロン構成
import express from "express";
import { createClient } from "@supabase/supabase-js";
import { getAvailableDates, getSessionsForDate, generateSlotsForSession, SLOT_MINUTES } from "../shared/booking.js";
import { validate, webReservationSchema, adminReservationSchema } from "../shared/validation.js";
import { createErrorResponse, createSuccessResponse, getHttpStatus } from "../shared/apiResponse.js";
import { randomUUID } from "node:crypto";

const app = express();
app.use(express.json());

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "asano-admin";

function getSupabase() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!
  );
}

function isAdmin(req: express.Request): boolean {
  return req.headers.authorization === `Bearer ${ADMIN_PASSWORD}`;
}

// --- 患者向け ---
app.post("/api/reserve/validate", async (req, res) => {
  const raw = req.body?.membershipNumber ?? "";
  const id = raw.trim().replace(/\D/g, "");
  if (!id) return void res.json({ ok: false, error: "empty" });
  const { data } = await getSupabase().from("patients").select("*").eq("id", id.padStart(4, "0").slice(-4)).single();
  if (!data) return void res.json({ ok: false, error: "not_found" });
  if (data.status === "blocked") return void res.json({ ok: false, error: "blocked" });
  res.json({ ok: true, patient: { id: data.id, name: data.name } });
});

app.get("/api/reserve/dates", (req, res) => {
  res.json({ dates: getAvailableDates(req.query.admin === "true") });
});

app.get("/api/reserve/slots", async (req, res) => {
  const date = req.query.date as string;
  if (!date) return void res.status(400).json({ error: "date が必要です" });
  const isAdminMode = req.query.admin === "true";
  const { data: reservations } = await getSupabase().from("reservations").select("*").eq("date", date);
  const booked = new Map<string, number>();
  for (const r of (reservations ?? [])) {
    booked.set(r.time, (booked.get(r.time) ?? 0) + 1);
  }
  const slots = [];
  for (const session of getSessionsForDate(date)) {
    for (const time of generateSlotsForSession(date, session)) {
      slots.push({ time, label: time, available: isAdminMode ? true : (booked.get(time) ?? 0) === 0 });
    }
  }
  res.json({ slots });
});

app.post("/api/reserve/book", async (req, res) => {
  const validation = validate(webReservationSchema, req.body);
  if (!validation.ok) return void res.status(400).json(createErrorResponse(validation.error, "VALIDATION_ERROR"));
  const sb = getSupabase();
  const raw = (req.body?.membershipId ?? "").trim().replace(/\D/g, "");
  const id = raw.padStart(4, "0").slice(-4);
  const { data: patient } = await sb.from("patients").select("*").eq("id", id).single();
  if (!patient) return void res.status(403).json(createErrorResponse("not_found", "AUTHORIZATION_ERROR"));
  if (patient.status === "blocked") return void res.status(403).json(createErrorResponse("blocked", "AUTHORIZATION_ERROR"));
  const { data: existing } = await sb.from("reservations").select("*").eq("membership_id", id).single();
  if (existing) return void res.status(409).json({ ok: false, error: "already_booked", message: `${existing.date} ${existing.time}に予約があります。変更はお電話ください。` });
  const reservation = { id: randomUUID(), membership_id: id, patient_name: patient.name, date: validation.data.date, time: validation.data.time, created_at: new Date().toISOString(), source: "web" };
  await sb.from("reservations").insert(reservation);
  res.json(createSuccessResponse(reservation));
});

// --- 管理者向け ---
app.get("/api/admin/patients", async (req, res) => {
  if (!isAdmin(req)) return void res.status(401).json({ error: "認証が必要です" });
  const { data } = await getSupabase().from("patients").select("*").order("id");
  res.json({ patients: data ?? [] });
});

app.post("/api/admin/patients", async (req, res) => {
  if (!isAdmin(req)) return void res.status(401).json({ error: "認証が必要です" });
  const id = (req.body?.id ?? "").trim().replace(/\D/g, "");
  const name = (req.body?.name ?? "").trim();
  if (!id || !name) return void res.status(400).json({ error: "診察券番号と氏名は必須です" });
  const record = { id, name, status: req.body?.status === "blocked" ? "blocked" : "normal" };
  await getSupabase().from("patients").upsert(record);
  res.json({ ok: true, patient: record });
});

app.delete("/api/admin/patients/:id", async (req, res) => {
  if (!isAdmin(req)) return void res.status(401).json({ error: "認証が必要です" });
  const { error } = await getSupabase().from("patients").delete().eq("id", req.params.id);
  res.json({ ok: !error });
});

app.get("/api/admin/reservations", async (req, res) => {
  if (!isAdmin(req)) return void res.status(401).json({ error: "認証が必要です" });
  const { data } = await getSupabase().from("reservations").select("*").order("date").order("time");
  res.json({ reservations: (data ?? []).map((r: any) => ({ id: r.id, membershipId: r.membership_id, patientName: r.patient_name, date: r.date, time: r.time, endTime: r.end_time, comment: r.comment, arrived: r.arrived, createdAt: r.created_at, source: r.source })) });
});

app.post("/api/admin/reservations", async (req, res) => {
  if (!isAdmin(req)) return void res.status(401).json({ error: "認証が必要です" });
  const validation = validate(adminReservationSchema, req.body);
  if (!validation.ok) return void res.status(400).json(createErrorResponse(validation.error, "VALIDATION_ERROR"));
  const sb = getSupabase();
  const { data: existing } = await sb.from("reservations").select("*").eq("membership_id", validation.data.membershipId).single();
  if (existing && !validation.data.force) return void res.status(409).json({ ok: false, error: "already_booked", existing });
  if (existing) await sb.from("reservations").delete().eq("id", existing.id);
  const times = validation.data.times ?? [validation.data.time];
  const sorted = [...times].sort();
  const startTime = sorted[0];
  const lastParts = sorted[sorted.length - 1].split(":").map(Number);
  const endMins = lastParts[0] * 60 + lastParts[1] + SLOT_MINUTES;
  const endTime = `${String(Math.floor(endMins / 60)).padStart(2, "0")}:${String(endMins % 60).padStart(2, "0")}`;
  const reservation = { id: randomUUID(), membership_id: validation.data.membershipId, patient_name: validation.data.patientName, date: validation.data.date, time: startTime, end_time: times.length > 1 ? endTime : null, comment: validation.data.comment ?? null, arrived: false, created_at: new Date().toISOString(), source: "admin" };
  await sb.from("reservations").insert(reservation);
  res.json(createSuccessResponse({ ...reservation, membershipId: reservation.membership_id, patientName: reservation.patient_name, endTime: reservation.end_time, createdAt: reservation.created_at }));
});

app.delete("/api/admin/reservations/:id", async (req, res) => {
  if (!isAdmin(req)) return void res.status(401).json({ error: "認証が必要です" });
  const { error } = await getSupabase().from("reservations").delete().eq("id", req.params.id);
  res.json({ ok: !error });
});

app.patch("/api/admin/reservations/:id", async (req, res) => {
  if (!isAdmin(req)) return void res.status(401).json({ error: "認証が必要です" });
  const update: any = {};
  if (req.body?.arrived !== undefined) update.arrived = req.body.arrived;
  if (req.body?.comment !== undefined) update.comment = req.body.comment;
  const { error } = await getSupabase().from("reservations").update(update).eq("id", req.params.id);
  res.json({ ok: !error });
});

app.get("/api/diagnostics", async (req, res) => {
  res.json({ env: { SUPABASE_URL: process.env.SUPABASE_URL ? "set" : "missing", SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY ? "set" : "missing" } });
});

export default app;
