import type { IncomingMessage, ServerResponse } from "node:http";
import { getAvailableDates } from "../shared/booking";
import type { PatientRecord } from "../shared/reserve";
import { validate, webReservationSchema, adminReservationSchema } from "../shared/validation";
import { createErrorResponse, createSuccessResponse, getHttpStatus } from "../shared/apiResponse";
import {
  cancelReservation,
  createReservation,
  getAllReservations,
  getSlotsForDate,
  updateReservationArrivalStatus,
  updateReservation,
} from "./bookingStore";
import {
  deletePatient,
  listPatients,
  upsertPatient,
  validateMembershipNumber,
} from "./patientCsv";

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "asano-admin";

type RequestWithBody = IncomingMessage & { body?: unknown };

function readJsonBody<T>(req: RequestWithBody): Promise<T> {
  if (req.body !== undefined && req.body !== null && typeof req.body === "object") {
    return Promise.resolve(req.body as T);
  }
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk.toString();
    });
    req.on("end", () => {
      try {
        resolve(JSON.parse(body || "{}") as T);
      } catch {
        reject(new Error("Invalid JSON"));
      }
    });
    req.on("error", reject);
  });
}

function sendJson(res: ServerResponse, status: number, data: unknown) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(data));
}

function isAdmin(req: IncomingMessage): boolean {
  const auth = req.headers.authorization ?? "";
  return auth === `Bearer ${ADMIN_PASSWORD}`;
}

function requireAdmin(req: IncomingMessage, res: ServerResponse): boolean {
  if (!isAdmin(req)) {
    sendJson(res, 401, { error: "認証が必要です" });
    return false;
  }
  return true;
}

export async function handleApi(
  req: IncomingMessage,
  res: ServerResponse,
  urlPath: string
): Promise<boolean> {
  const method = req.method ?? "GET";

  // --- 患者向け予約 ---
  if (method === "POST" && urlPath === "/api/reserve/validate") {
    const body = await readJsonBody<{ membershipNumber?: string }>(req);
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
      sendJson(res, 400, { error: "date が必要です" });
      return true;
    }
    const isAdmin = q.get("admin") === "true";
    const slots = await getSlotsForDate(date, isAdmin);
    sendJson(res, 200, { slots });
    return true;
  }

  if (method === "POST" && urlPath === "/api/reserve/book") {
    const body = await readJsonBody<{
      membershipId?: string;
      patientName?: string;
      date?: string;
      time?: string;
    }>(req);

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
      time: validation.data.time,
    });

    if (!result.ok && result.error === "already_booked") {
      const status = getHttpStatus("CONFLICT");
      sendJson(res, status, createErrorResponse(
        `${result.existing?.date} ${result.existing?.time}に予約があります。変更はお電話ください。`,
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

  // --- 医院向け管理 ---
  if (method === "GET" && urlPath === "/api/admin/patients") {
    if (!requireAdmin(req, res)) return true;
    sendJson(res, 200, { patients: listPatients() });
    return true;
  }

  if (method === "POST" && urlPath === "/api/admin/patients") {
    if (!requireAdmin(req, res)) return true;
    const body = await readJsonBody<{
      id?: string;
      name?: string;
      status?: "normal" | "blocked";
    }>(req);
    const id = (body.id ?? "").trim().replace(/\D/g, "");
    const name = (body.name ?? "").trim();
    if (!id || !name) {
      sendJson(res, 400, { error: "診察券番号と氏名は必須です" });
      return true;
    }
    const record: PatientRecord = {
      id,
      name,
      status: body.status === "blocked" ? "blocked" : "normal",
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
    const body = await readJsonBody<{
      membershipId?: string;
      patientName?: string;
      date?: string;
      time?: string;
      times?: string[];
      comment?: string;
      force?: boolean;
    }>(req);

    const validation = validate(adminReservationSchema, body);
    if (!validation.ok) {
      sendJson(res, 400, createErrorResponse(validation.error, "VALIDATION_ERROR"));
      return true;
    }

    const result = await createReservation({
      membershipId: validation.data.membershipId,
      patientName: validation.data.patientName,
      date: validation.data.date,
      time: undefined,
      times: validation.data.times,
      comment: validation.data.comment,
      force: validation.data.force,
      isAdmin: true
    });

    if (!result.ok && result.error === "already_booked") {
      const status = getHttpStatus("CONFLICT");
      sendJson(res, status, createErrorResponse(
        `診察師番号 ${result.existing?.membershipId} は既に予約済みです。`,
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
    const body = await readJsonBody<{ arrived?: boolean; comment?: string }>(req);
    
    let ok = false;
    if (body.arrived !== undefined) {
      ok = await updateReservationArrivalStatus(id, body.arrived);
    } else if (body.comment !== undefined) {
      ok = await updateReservation(id, { comment: body.comment });
    }
    
    sendJson(res, ok ? 200 : 404, { ok });
    return true;
  }

  return false;
}
