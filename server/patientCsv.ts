import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { PatientRecord, ReserveValidationResult } from "../shared/reserve.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CSV_PATH = path.resolve(__dirname, "..", "data", "patient_list.csv");

let cachedPatients: Map<string, PatientRecord> | null = null;
let cachedMtime = 0;

function parseCsv(content: string): Map<string, PatientRecord> {
  const lines = content.trim().split(/\r?\n/);
  const patients = new Map<string, PatientRecord>();

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const [id, name, status] = line.split(",").map((s) => s.trim());
    if (!id) continue;

    patients.set(id, {
      id,
      name: name ?? "",
      status: status === "blocked" ? "blocked" : "normal",
    });
  }

  return patients;
}

export function loadPatients(): Map<string, PatientRecord> {
  const stat = fs.statSync(CSV_PATH);
  if (cachedPatients && stat.mtimeMs === cachedMtime) {
    return cachedPatients;
  }

  const content = fs.readFileSync(CSV_PATH, "utf-8");
  cachedPatients = parseCsv(content);
  cachedMtime = stat.mtimeMs;
  return cachedPatients;
}

export function validateMembershipNumber(
  raw: string | undefined | null
): ReserveValidationResult {
  const id = (raw ?? "").trim().replace(/\D/g, "");

  if (!id) {
    return { ok: false, error: "empty" };
  }

  // 診察券番号は4桁
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
    patient: { id: patient.id, name: patient.name },
  };
}

export function listPatients(): PatientRecord[] {
  return Array.from(loadPatients().values()).sort((a, b) =>
    a.id.localeCompare(b.id, "ja")
  );
}

export function savePatients(patients: PatientRecord[]): void {
  const lines = [
    "診察券番号,氏名,ステータス",
    ...patients.map((p) => `${p.id},${p.name},${p.status}`),
  ];
  fs.writeFileSync(CSV_PATH, lines.join("\n") + "\n", "utf-8");
  cachedPatients = null;
}

export function upsertPatient(record: PatientRecord): void {
  const map = loadPatients();
  map.set(record.id, record);
  savePatients(Array.from(map.values()));
}

export function deletePatient(id: string): boolean {
  const map = loadPatients();
  if (!map.has(id)) return false;
  map.delete(id);
  savePatients(Array.from(map.values()));
  return true;
}
