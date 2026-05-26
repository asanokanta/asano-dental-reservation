import { createClient } from "@supabase/supabase-js";
import type { PatientRecord, ReserveValidationResult } from "../shared/reserve";

// Supabaseクライアントの初期化
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("SUPABASE_URL and SUPABASE_ANON_KEY environment variables are required");
}

const supabase = createClient(supabaseUrl, supabaseKey);

// キャッシュ（短時間のみ保持）
let cachedPatients: PatientRecord[] | null = null;
let cacheTime = 0;
const CACHE_DURATION = 5000; // 5秒

/**
 * Supabaseから患者データを取得
 */
async function loadPatients(): Promise<PatientRecord[]> {
  const now = Date.now();
  if (cachedPatients && now - cacheTime < CACHE_DURATION) {
    return cachedPatients;
  }

  const { data, error } = await supabase
    .from("patients")
    .select("*")
    .order("id", { ascending: true });

  if (error) {
    console.error("Error loading patients:", error);
    return [];
  }

  cachedPatients = (data || []).map((row: any) => ({
    id: row.id,
    name: row.name,
    status: row.status || "normal",
  }));
  cacheTime = now;

  return cachedPatients;
}

/**
 * 患者を追加または更新
 */
export async function upsertPatient(patient: PatientRecord): Promise<void> {
  const { error } = await supabase.from("patients").upsert({
    id: patient.id,
    name: patient.name,
    status: patient.status,
  });

  if (error) {
    throw new Error(`Failed to upsert patient: ${error.message}`);
  }

  // キャッシュを無効化
  cachedPatients = null;
}

/**
 * 患者を削除
 */
export async function deletePatient(id: string): Promise<boolean> {
  const { error } = await supabase.from("patients").delete().eq("id", id);

  if (error) {
    console.error("Error deleting patient:", error);
    return false;
  }

  // キャッシュを無効化
  cachedPatients = null;
  return true;
}

/**
 * 患者一覧を取得
 */
export async function listPatients(): Promise<PatientRecord[]> {
  return await loadPatients();
}

/**
 * 診察券番号を検証
 */
export async function validateMembershipNumber(
  raw: string | undefined | null
): Promise<ReserveValidationResult> {
  const id = (raw ?? "").trim().replace(/\D/g, "");

  if (!id) {
    return { ok: false, error: "empty" };
  }

  // 診察券番号は4桁
  const formattedId = id.padStart(4, "0").slice(-4);

  const patients = await loadPatients();
  const patient = patients.find((p) => p.id === formattedId);

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
