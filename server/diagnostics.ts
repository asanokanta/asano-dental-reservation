import { createClient } from "@supabase/supabase-js";

/**
 * 環境変数とSupabase接続の診断情報を返す
 */
export async function getDiagnostics(): Promise<{
  env: {
    supabaseUrl: string | null;
    supabaseKeyExists: boolean;
    adminPasswordExists: boolean;
  };
  supabaseConnection: {
    connected: boolean;
    error: string | null;
  };
  tables: {
    reservations: { exists: boolean; rowCount: number | null; error: string | null };
    patients: { exists: boolean; rowCount: number | null; error: string | null };
  };
}> {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_ANON_KEY;
  const adminPassword = process.env.ADMIN_PASSWORD;

  const diagnostics = {
    env: {
      supabaseUrl: supabaseUrl ? `${supabaseUrl.substring(0, 20)}...` : null,
      supabaseKeyExists: !!supabaseKey,
      adminPasswordExists: !!adminPassword,
    },
    supabaseConnection: {
      connected: false,
      error: null as string | null,
    },
    tables: {
      reservations: { exists: false, rowCount: null as number | null, error: null as string | null },
      patients: { exists: false, rowCount: null as number | null, error: null as string | null },
    },
  };

  // Supabase接続テスト
  if (!supabaseUrl || !supabaseKey) {
    diagnostics.supabaseConnection.error = "SUPABASE_URL or SUPABASE_ANON_KEY is missing";
    return diagnostics;
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 予約テーブルの確認
    try {
      const { data: resData, error: resError, count: resCount } = await supabase
        .from("reservations")
        .select("*", { count: "exact", head: true });

      if (resError) {
        diagnostics.tables.reservations.error = resError.message;
      } else {
        diagnostics.tables.reservations.exists = true;
        diagnostics.tables.reservations.rowCount = resCount || 0;
      }
    } catch (e) {
      diagnostics.tables.reservations.error = String(e);
    }

    // 患者テーブルの確認
    try {
      const { data: patData, error: patError, count: patCount } = await supabase
        .from("patients")
        .select("*", { count: "exact", head: true });

      if (patError) {
        diagnostics.tables.patients.error = patError.message;
      } else {
        diagnostics.tables.patients.exists = true;
        diagnostics.tables.patients.rowCount = patCount || 0;
      }
    } catch (e) {
      diagnostics.tables.patients.error = String(e);
    }

    diagnostics.supabaseConnection.connected = true;
  } catch (e) {
    diagnostics.supabaseConnection.error = String(e);
  }

  return diagnostics;
}
