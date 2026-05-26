// server/index.ts
import express from "express";
import { createServer } from "node:http";
import path5 from "node:path";
import { fileURLToPath as fileURLToPath4 } from "node:url";

// shared/clinicHours.ts
function getWeekOfMonth(date) {
  return Math.ceil(date.getDate() / 7);
}
function isRegularClosedDay(dateStr) {
  const d = /* @__PURE__ */ new Date(`${dateStr}T12:00:00`);
  const day = d.getDay();
  if (day === 0) return true;
  const wom = getWeekOfMonth(d);
  if (day === 4 && (wom === 2 || wom === 4 || wom === 5)) return true;
  if (day === 6 && (wom === 1 || wom === 3)) return true;
  return false;
}
function getSessionsForDate(dateStr) {
  if (isRegularClosedDay(dateStr)) return [];
  const day = (/* @__PURE__ */ new Date(`${dateStr}T12:00:00`)).getDay();
  if (day === 3) return ["afternoon"];
  if (day === 6) return ["morning"];
  return ["morning", "afternoon"];
}
function getReceptionWindow(dateStr, session) {
  if (!getSessionsForDate(dateStr).includes(session)) return null;
  const day = (/* @__PURE__ */ new Date(`${dateStr}T12:00:00`)).getDay();
  const base = session === "morning" ? { startMin: 9 * 60 + 30, endMin: 13 * 60 } : { startMin: 14 * 60 + 30, endMin: 19 * 60 + 30 };
  if (day === 4) {
    return session === "morning" ? { startMin: 10 * 60, endMin: 12 * 60 } : { startMin: base.startMin, endMin: 17 * 60 };
  }
  if (session === "morning") {
    return { ...base, endMin: 12 * 60 };
  }
  if (day === 6) {
    return { ...base, endMin: 12 * 60 };
  }
  return { ...base, endMin: 19 * 60 };
}

// shared/booking.ts
var SLOT_MINUTES = 30;
var BOOKING_DAYS_AHEAD_PATIENT = 180;
var BOOKING_DAYS_AHEAD_ADMIN = 365;
var SESSIONS = {
  morning: { start: "09:30", end: "13:00", label: "\u5348\u524D" },
  afternoon: { start: "14:30", end: "19:30", label: "\u5348\u5F8C" }
};
function isBookableDate(dateStr) {
  return getSessionsForDate(dateStr).length > 0;
}
function toMinutes(hhmm) {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}
function fromMinutes(mins) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}
function generateSlotsForSession(dateStr, session) {
  const window = getReceptionWindow(dateStr, session);
  if (!window) return [];
  const { start, end } = SESSIONS[session];
  const clinicStart = toMinutes(start);
  const clinicEnd = toMinutes(end);
  const slots = [];
  for (let t = clinicStart; t < clinicEnd; t += SLOT_MINUTES) {
    if (t < window.startMin || t > window.endMin) continue;
    slots.push(fromMinutes(t));
  }
  return slots;
}
function getAvailableDates(isAdmin2 = false) {
  const dates = [];
  const today = /* @__PURE__ */ new Date();
  today.setHours(0, 0, 0, 0);
  const startOffset = isAdmin2 ? 0 : 1;
  const daysAhead = isAdmin2 ? BOOKING_DAYS_AHEAD_ADMIN : BOOKING_DAYS_AHEAD_PATIENT;
  for (let i = startOffset; i <= daysAhead; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    const iso = d.toISOString().slice(0, 10);
    if (isBookableDate(iso)) dates.push(iso);
  }
  return dates;
}

// shared/validation.ts
import { z } from "zod";
var membershipIdSchema = z.union([
  z.literal("\u65B0\u898F"),
  z.literal("0000"),
  z.string().regex(/^\d{4}$/, "\u8A3A\u5BDF\u5238\u756A\u53F7\u306F4\u6841\u306E\u6570\u5B57\u3067\u3042\u308B\u5FC5\u8981\u304C\u3042\u308A\u307E\u3059")
]);
var patientNameSchema = z.string().min(1, "\u60A3\u8005\u540D\u306F\u5FC5\u9808\u3067\u3059").max(50, "\u60A3\u8005\u540D\u306F50\u6587\u5B57\u4EE5\u4E0B\u3067\u3042\u308B\u5FC5\u8981\u304C\u3042\u308A\u307E\u3059").refine((val) => val.trim().length > 0, "\u60A3\u8005\u540D\u306F\u7A7A\u767D\u306E\u307F\u3067\u306F\u767B\u9332\u3067\u304D\u307E\u305B\u3093");
var dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "\u65E5\u4ED8\u306FYYYY-MM-DD\u5F62\u5F0F\u3067\u3042\u308B\u5FC5\u8981\u304C\u3042\u308A\u307E\u3059").refine((val) => {
  const date = /* @__PURE__ */ new Date(`${val}T00:00:00`);
  return !isNaN(date.getTime());
}, "\u7121\u52B9\u306A\u65E5\u4ED8\u3067\u3059");
var timeSchema = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "\u6642\u523B\u306FHH:mm\u5F62\u5F0F\uFF0800:00\u301C23:59\uFF09\u3067\u3042\u308B\u5FC5\u8981\u304C\u3042\u308A\u307E\u3059");
var webReservationSchema = z.object({
  membershipId: membershipIdSchema.optional(),
  patientName: patientNameSchema.optional(),
  date: dateSchema,
  time: timeSchema
});
var adminReservationSchema = z.object({
  membershipId: z.string().min(1, "\u8A3A\u5BDF\u5238\u756A\u53F7\u306F\u5FC5\u9808\u3067\u3059"),
  patientName: patientNameSchema,
  date: dateSchema,
  times: z.array(timeSchema).min(1, "\u6642\u9593\u3092\u9078\u629E\u3057\u3066\u304F\u3060\u3055\u3044"),
  comment: z.string().optional(),
  force: z.boolean().optional()
});
function validate(schema, data) {
  try {
    const result = schema.parse(data);
    return { ok: true, data: result };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const message = error.issues[0]?.message || "\u5165\u529B\u5024\u304C\u4E0D\u6B63\u3067\u3059";
      return { ok: false, error: message };
    }
    return { ok: false, error: "\u4E88\u671F\u3057\u306A\u3044\u30A8\u30E9\u30FC\u304C\u767A\u751F\u3057\u307E\u3057\u305F" };
  }
}

// shared/apiResponse.ts
function createErrorResponse(message, code = "INTERNAL_ERROR") {
  return {
    ok: false,
    error: message,
    code
  };
}
function createSuccessResponse(data) {
  return {
    ok: true,
    data
  };
}
function getHttpStatus(code) {
  switch (code) {
    case "VALIDATION_ERROR":
      return 400;
    case "AUTHENTICATION_ERROR":
      return 401;
    case "AUTHORIZATION_ERROR":
      return 403;
    case "NOT_FOUND":
      return 404;
    case "CONFLICT":
      return 409;
    case "LOCK_TIMEOUT":
      return 503;
    case "INTERNAL_ERROR":
    default:
      return 500;
  }
}

// server/bookingStore.ts
import fs2 from "node:fs";
import path2 from "node:path";
import { randomUUID } from "node:crypto";
import { fileURLToPath } from "node:url";

// server/fileLock.ts
import fs from "node:fs";
import path from "node:path";
var LOCK_DIR = path.resolve(process.cwd(), ".locks");
if (!fs.existsSync(LOCK_DIR)) {
  fs.mkdirSync(LOCK_DIR, { recursive: true });
}
async function acquireLock(lockName, options = {}) {
  const {
    timeout = 5e3,
    maxRetries = 50,
    retryDelay = 100
  } = options;
  const lockPath = path.join(LOCK_DIR, `${lockName}.lock`);
  const startTime = Date.now();
  let retries = 0;
  while (retries < maxRetries) {
    if (Date.now() - startTime > timeout) {
      throw new Error(`Lock acquisition timeout for ${lockName}`);
    }
    try {
      const fd = fs.openSync(lockPath, "wx");
      fs.closeSync(fd);
      return () => {
        try {
          fs.unlinkSync(lockPath);
        } catch (e) {
          console.warn(`Failed to release lock: ${lockName}`, e);
        }
      };
    } catch (e) {
      retries++;
      if (retries < maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, retryDelay));
      }
    }
  }
  throw new Error(`Failed to acquire lock for ${lockName} after ${maxRetries} retries`);
}
async function withLock(lockName, callback, options = {}) {
  const releaseLock = await acquireLock(lockName, options);
  try {
    return await Promise.resolve(callback());
  } finally {
    releaseLock();
  }
}

// server/bookingStore.ts
var __dirname = path2.dirname(fileURLToPath(import.meta.url));
var RESERVATIONS_PATH = path2.resolve(__dirname, "..", "data", "reservations.json");
function readReservationsSync() {
  if (!fs2.existsSync(RESERVATIONS_PATH)) {
    fs2.writeFileSync(RESERVATIONS_PATH, "[]\n", "utf-8");
    return [];
  }
  const raw = fs2.readFileSync(RESERVATIONS_PATH, "utf-8");
  const reservations = JSON.parse(raw);
  cleanupPreviousDayReservations(reservations);
  return reservations;
}
async function readReservations() {
  return withLock("reservations.json", () => readReservationsSync());
}
function cleanupPreviousDayReservations(reservations) {
  const today = /* @__PURE__ */ new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().slice(0, 10);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().slice(0, 10);
  const filtered = reservations.filter((r) => r.date !== yesterdayStr);
  if (filtered.length < reservations.length) {
    writeReservations(filtered);
  }
}
function writeReservationsSync(list) {
  fs2.writeFileSync(RESERVATIONS_PATH, JSON.stringify(list, null, 2) + "\n", "utf-8");
}
async function writeReservations(list) {
  return withLock("reservations.json", () => writeReservationsSync(list));
}
async function getReservationsForDate(date) {
  const reservations = await readReservations();
  return reservations.filter((r) => r.date === date);
}
async function getAllReservations() {
  const reservations = await readReservations();
  return reservations.sort((a, b) => {
    const da = `${a.date}T${a.time}`;
    const db = `${b.date}T${b.time}`;
    return da.localeCompare(db);
  });
}
async function getSlotsForDate(date, isAdmin2 = false) {
  const reservations = await getReservationsForDate(date);
  const bookedCountMap = /* @__PURE__ */ new Map();
  for (const r of reservations) {
    if (r.endTime) {
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
  const slots = [];
  for (const session of sessions) {
    for (const time of generateSlotsForSession(date, session)) {
      const count = bookedCountMap.get(time) ?? 0;
      const available = isAdmin2 ? true : count === 0;
      slots.push({
        time,
        label: time,
        available
      });
    }
  }
  return slots;
}
async function createReservation(input) {
  return withLock("reservations.json", async () => {
    const list = await readReservations();
    const isNewPatient = !input.membershipId || input.membershipId === "\u65B0\u898F" || input.membershipId === "0000";
    if (!isNewPatient) {
      const existing = list.find((r) => r.membershipId === input.membershipId);
      if (existing && !input.force) {
        return {
          ok: false,
          error: "already_booked",
          existing
        };
      }
    }
    const slots = await getSlotsForDate(input.date, input.isAdmin);
    const targetTimes = (input.times && input.times.length > 0 ? input.times : [input.time ?? ""]).filter((t) => !!t);
    if (targetTimes.length === 0) {
      return { ok: false, error: "\u6642\u9593\u3092\u9078\u629E\u3057\u3066\u304F\u3060\u3055\u3044\u3002" };
    }
    const sortedTimes = [...targetTimes].sort((a, b) => {
      const [ha, ma] = a.split(":").map(Number);
      const [hb, mb] = b.split(":").map(Number);
      return ha * 60 + ma - (hb * 60 + mb);
    });
    const startTime = sortedTimes[0];
    const lastTime = sortedTimes[sortedTimes.length - 1];
    if (sortedTimes.length > 1) {
      for (let i = 0; i < sortedTimes.length - 1; i++) {
        const currentParts = sortedTimes[i].split(":").map(Number);
        const nextParts = sortedTimes[i + 1].split(":").map(Number);
        const currentMins = currentParts[0] * 60 + currentParts[1];
        const nextMins = nextParts[0] * 60 + nextParts[1];
        if (nextMins !== currentMins + SLOT_MINUTES) {
          return { ok: false, error: "\u9078\u629E\u3057\u305F\u6642\u9593\u5E2F\u304C\u9023\u7D9A\u3057\u3066\u3044\u307E\u305B\u3093\u3002\u9023\u7D9A\u3057\u305F\u6642\u9593\u3092\u9078\u629E\u3057\u3066\u304F\u3060\u3055\u3044\u3002" };
        }
      }
    }
    const lastTimeParts = lastTime.split(":").map(Number);
    if (lastTimeParts.length !== 2 || isNaN(lastTimeParts[0]) || isNaN(lastTimeParts[1])) {
      return { ok: false, error: "\u6642\u9593\u306E\u5F62\u5F0F\u304C\u4E0D\u6B63\u3067\u3059\u3002" };
    }
    const endMins = lastTimeParts[0] * 60 + lastTimeParts[1] + SLOT_MINUTES;
    if (endMins >= 24 * 60) {
      return { ok: false, error: "\u9078\u629E\u3057\u305F\u6642\u9593\u304C\u55B6\u696D\u6642\u9593\u3092\u8D85\u3048\u3066\u3044\u307E\u3059\u3002" };
    }
    const endTime = `${String(Math.floor(endMins / 60)).padStart(2, "0")}:${String(endMins % 60).padStart(2, "0")}`;
    for (const t of targetTimes) {
      const slot = slots.find((s) => s.time === t);
      if (!slot) {
        return { ok: false, error: `\u9078\u629E\u3057\u305F\u65E5\u6642\uFF08${t}\uFF09\u306F\u4E88\u7D04\u3067\u304D\u307E\u305B\u3093\u3002` };
      }
      if (!input.isAdmin && !slot.available) {
        return { ok: false, error: `\u3053\u306E\u6642\u9593\u5E2F\uFF08${t}\uFF09\u306F\u3059\u3067\u306B\u4E88\u7D04\u304C\u5165\u3063\u3066\u3044\u307E\u3059\u3002` };
      }
    }
    const existingRes = !isNewPatient ? list.find((r) => r.membershipId === input.membershipId) : null;
    const nextList = existingRes ? list.filter((r) => r.id !== existingRes.id) : list;
    const reservation = {
      id: randomUUID(),
      membershipId: input.membershipId,
      patientName: input.patientName,
      date: input.date,
      time: startTime,
      endTime: targetTimes.length > 1 ? endTime : void 0,
      comment: input.comment,
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      source: input.isAdmin ? "admin" : "web"
    };
    nextList.push(reservation);
    await writeReservations(nextList);
    return { ok: true, reservation };
  });
}
async function cancelReservation(id) {
  return withLock("reservations.json", async () => {
    const list = await readReservations();
    const next = list.filter((r) => r.id !== id);
    if (next.length === list.length) return false;
    await writeReservations(next);
    return true;
  });
}
async function updateReservationArrivalStatus(id, arrived) {
  return withLock("reservations.json", async () => {
    const list = await readReservations();
    const reservation = list.find((r) => r.id === id);
    if (!reservation) return false;
    reservation.arrived = arrived;
    await writeReservations(list);
    return true;
  });
}
async function updateReservation(id, updates) {
  return withLock("reservations.json", async () => {
    const list = await readReservations();
    const index = list.findIndex((r) => r.id === id);
    if (index === -1) return false;
    list[index] = { ...list[index], ...updates };
    await writeReservations(list);
    return true;
  });
}

// server/patientCsv.ts
import fs3 from "node:fs";
import path3 from "node:path";
import { fileURLToPath as fileURLToPath2 } from "node:url";
var __dirname2 = path3.dirname(fileURLToPath2(import.meta.url));
var CSV_PATH = path3.resolve(__dirname2, "..", "data", "patient_list.csv");
var cachedPatients = null;
var cachedMtime = 0;
function parseCsv(content) {
  const lines = content.trim().split(/\r?\n/);
  const patients = /* @__PURE__ */ new Map();
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const [id, name, status] = line.split(",").map((s) => s.trim());
    if (!id) continue;
    patients.set(id, {
      id,
      name: name ?? "",
      status: status === "blocked" ? "blocked" : "normal"
    });
  }
  return patients;
}
function loadPatients() {
  const stat = fs3.statSync(CSV_PATH);
  if (cachedPatients && stat.mtimeMs === cachedMtime) {
    return cachedPatients;
  }
  const content = fs3.readFileSync(CSV_PATH, "utf-8");
  cachedPatients = parseCsv(content);
  cachedMtime = stat.mtimeMs;
  return cachedPatients;
}
function validateMembershipNumber(raw) {
  const id = (raw ?? "").trim().replace(/\D/g, "");
  if (!id) {
    return { ok: false, error: "empty" };
  }
  const formattedId = id.padStart(4, "0").slice(-4);
  const patient = loadPatients().get(formattedId);
  if (!patient) {
    return { ok: false, error: "not_found" };
  }
  if (patient.status === "blocked") {
    return { ok: false, error: "blocked" };
  }
  return {
    ok: true,
    patient: { id: patient.id, name: patient.name }
  };
}
function listPatients() {
  return Array.from(loadPatients().values()).sort(
    (a, b) => a.id.localeCompare(b.id, "ja")
  );
}
function savePatients(patients) {
  const lines = [
    "\u8A3A\u5BDF\u5238\u756A\u53F7,\u6C0F\u540D,\u30B9\u30C6\u30FC\u30BF\u30B9",
    ...patients.map((p) => `${p.id},${p.name},${p.status}`)
  ];
  fs3.writeFileSync(CSV_PATH, lines.join("\n") + "\n", "utf-8");
  cachedPatients = null;
}
function upsertPatient(record) {
  const map = loadPatients();
  map.set(record.id, record);
  savePatients(Array.from(map.values()));
}
function deletePatient(id) {
  const map = loadPatients();
  if (!map.has(id)) return false;
  map.delete(id);
  savePatients(Array.from(map.values()));
  return true;
}

// server/api.ts
var ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "asano-admin";
function readJsonBody(req) {
  if (req.body !== void 0 && req.body !== null && typeof req.body === "object") {
    return Promise.resolve(req.body);
  }
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk.toString();
    });
    req.on("end", () => {
      try {
        resolve(JSON.parse(body || "{}"));
      } catch {
        reject(new Error("Invalid JSON"));
      }
    });
    req.on("error", reject);
  });
}
function sendJson(res, status, data) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(data));
}
function isAdmin(req) {
  const auth = req.headers.authorization ?? "";
  return auth === `Bearer ${ADMIN_PASSWORD}`;
}
function requireAdmin(req, res) {
  if (!isAdmin(req)) {
    sendJson(res, 401, { error: "\u8A8D\u8A3C\u304C\u5FC5\u8981\u3067\u3059" });
    return false;
  }
  return true;
}
async function handleApi(req, res, urlPath) {
  const method = req.method ?? "GET";
  if (method === "POST" && urlPath === "/api/reserve/validate") {
    const body = await readJsonBody(req);
    sendJson(res, 200, validateMembershipNumber(body.membershipNumber));
    return true;
  }
  if (method === "GET" && urlPath.startsWith("/api/reserve/dates")) {
    const q = new URL(urlPath, "http://local").searchParams;
    const adminMode = q.get("admin") === "true";
    sendJson(res, 200, { dates: getAvailableDates(adminMode) });
    return true;
  }
  if (method === "GET" && urlPath.startsWith("/api/reserve/slots")) {
    const q = new URL(urlPath, "http://local").searchParams;
    const date = q.get("date");
    if (!date) {
      sendJson(res, 400, { error: "date \u304C\u5FC5\u8981\u3067\u3059" });
      return true;
    }
    const isAdmin2 = q.get("admin") === "true";
    const slots = await getSlotsForDate(date, isAdmin2);
    sendJson(res, 200, { slots });
    return true;
  }
  if (method === "POST" && urlPath === "/api/reserve/book") {
    const body = await readJsonBody(req);
    const validation = validate(webReservationSchema, body);
    if (!validation.ok) {
      sendJson(res, 400, createErrorResponse(validation.error, "VALIDATION_ERROR"));
      return true;
    }
    const check = validateMembershipNumber(body.membershipId);
    if (!check.ok) {
      sendJson(res, 403, createErrorResponse(check.error, "AUTHORIZATION_ERROR"));
      return true;
    }
    const result = await createReservation({
      membershipId: check.patient.id,
      patientName: check.patient.name,
      date: validation.data.date,
      time: validation.data.time
    });
    if (!result.ok && result.error === "already_booked") {
      const status = getHttpStatus("CONFLICT");
      sendJson(res, status, createErrorResponse(
        `${result.existing?.date} ${result.existing?.time}\u306B\u4E88\u7D04\u304C\u3042\u308A\u307E\u3059\u3002\u5909\u66F4\u306F\u304A\u96FB\u8A71\u304F\u3060\u3055\u3044\u3002`,
        "CONFLICT"
      ));
      return true;
    }
    if (!result.ok) {
      sendJson(res, 400, createErrorResponse(result.error, "VALIDATION_ERROR"));
      return true;
    }
    sendJson(res, 200, createSuccessResponse(result.reservation));
    return true;
  }
  if (method === "GET" && urlPath === "/api/admin/patients") {
    if (!requireAdmin(req, res)) return true;
    sendJson(res, 200, { patients: listPatients() });
    return true;
  }
  if (method === "POST" && urlPath === "/api/admin/patients") {
    if (!requireAdmin(req, res)) return true;
    const body = await readJsonBody(req);
    const id = (body.id ?? "").trim().replace(/\D/g, "");
    const name = (body.name ?? "").trim();
    if (!id || !name) {
      sendJson(res, 400, { error: "\u8A3A\u5BDF\u5238\u756A\u53F7\u3068\u6C0F\u540D\u306F\u5FC5\u9808\u3067\u3059" });
      return true;
    }
    const record = {
      id,
      name,
      status: body.status === "blocked" ? "blocked" : "normal"
    };
    upsertPatient(record);
    sendJson(res, 200, { ok: true, patient: record });
    return true;
  }
  if (method === "DELETE" && urlPath.startsWith("/api/admin/patients/")) {
    if (!requireAdmin(req, res)) return true;
    const id = urlPath.replace("/api/admin/patients/", "").split("?")[0].trim();
    const ok = deletePatient(id);
    sendJson(res, ok ? 200 : 404, { ok });
    return true;
  }
  if (method === "GET" && urlPath === "/api/admin/reservations") {
    if (!requireAdmin(req, res)) return true;
    const reservations = await getAllReservations();
    sendJson(res, 200, { reservations });
    return true;
  }
  if (method === "POST" && urlPath === "/api/admin/reservations") {
    if (!requireAdmin(req, res)) return true;
    const body = await readJsonBody(req);
    const validation = validate(adminReservationSchema, body);
    if (!validation.ok) {
      sendJson(res, 400, createErrorResponse(validation.error, "VALIDATION_ERROR"));
      return true;
    }
    const result = await createReservation({
      membershipId: validation.data.membershipId,
      patientName: validation.data.patientName,
      date: validation.data.date,
      time: void 0,
      times: validation.data.times,
      comment: validation.data.comment,
      force: validation.data.force,
      isAdmin: true
    });
    if (!result.ok && result.error === "already_booked") {
      const status = getHttpStatus("CONFLICT");
      sendJson(res, status, createErrorResponse(
        `\u8A3A\u5BDF\u5E2B\u756A\u53F7 ${result.existing?.membershipId} \u306F\u65E2\u306B\u4E88\u7D04\u6E08\u307F\u3067\u3059\u3002`,
        "CONFLICT"
      ));
      return true;
    }
    if (!result.ok) {
      sendJson(res, 400, createErrorResponse(result.error, "VALIDATION_ERROR"));
      return true;
    }
    sendJson(res, 200, createSuccessResponse(result.reservation));
    return true;
  }
  if (method === "DELETE" && urlPath.startsWith("/api/admin/reservations/")) {
    if (!requireAdmin(req, res)) return true;
    const id = urlPath.replace("/api/admin/reservations/", "").split("?")[0].trim();
    const ok = await cancelReservation(id);
    sendJson(res, ok ? 200 : 404, { ok });
    return true;
  }
  if (method === "PATCH" && urlPath.startsWith("/api/admin/reservations/")) {
    if (!requireAdmin(req, res)) return true;
    const id = urlPath.replace("/api/admin/reservations/", "").split("?")[0].trim();
    const body = await readJsonBody(req);
    let ok = false;
    if (body.arrived !== void 0) {
      ok = await updateReservationArrivalStatus(id, body.arrived);
    } else if (body.comment !== void 0) {
      ok = await updateReservation(id, { comment: body.comment });
    }
    sendJson(res, ok ? 200 : 404, { ok });
    return true;
  }
  return false;
}

// server/cleanupScheduler.ts
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import path4 from "node:path";
import { fileURLToPath as fileURLToPath3 } from "node:url";
var __dirname3 = path4.dirname(fileURLToPath3(import.meta.url));
var RESERVATIONS_PATH2 = path4.resolve(__dirname3, "..", "data", "reservations.json");
function startCleanupScheduler() {
  cleanupOldReservations();
  const intervalId = setInterval(() => {
    cleanupOldReservations();
  }, 60 * 60 * 1e3);
  return () => clearInterval(intervalId);
}
function cleanupOldReservations() {
  try {
    if (!existsSync(RESERVATIONS_PATH2)) {
      return;
    }
    const raw = readFileSync(RESERVATIONS_PATH2, "utf-8");
    const reservations = JSON.parse(raw);
    const today = /* @__PURE__ */ new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().slice(0, 10);
    const filtered = reservations.filter((r) => r.date >= todayStr);
    if (filtered.length < reservations.length) {
      writeFileSync(RESERVATIONS_PATH2, JSON.stringify(filtered, null, 2) + "\n", "utf-8");
      const deletedCount = reservations.length - filtered.length;
      console.log(`[Cleanup] Deleted ${deletedCount} old reservations`);
    }
  } catch (error) {
    console.error("[Cleanup] Error during cleanup:", error);
  }
}

// server/index.ts
var __filename = fileURLToPath4(import.meta.url);
var __dirname4 = path5.dirname(__filename);
async function startServer() {
  const app = express();
  const server = createServer(app);
  app.use(express.json());
  app.all("/api/*", async (req, res, next) => {
    const handled = await handleApi(req, res, req.originalUrl || req.url || "");
    if (!handled) next();
  });
  const staticPath = process.env.NODE_ENV === "production" ? path5.resolve(__dirname4, "public") : path5.resolve(__dirname4, "..", "dist", "public");
  app.use(express.static(staticPath));
  app.get("*", (_req, res) => {
    res.sendFile(path5.join(staticPath, "index.html"));
  });
  const port = process.env.PORT || 3e3;
  const stopCleanup = startCleanupScheduler();
  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
    console.log(`Admin: http://localhost:${port}/admin`);
  });
  process.on("SIGTERM", () => {
    console.log("SIGTERM received, shutting down gracefully...");
    stopCleanup();
    server.close(() => {
      console.log("Server closed");
      process.exit(0);
    });
  });
}
startServer().catch(console.error);
