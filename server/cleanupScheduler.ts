import { createClient } from "@supabase/supabase-js";

/**
 * 前日以前の予約をSupabaseから削除する定期タスク
 * サーバー起動時と定期的（1時間ごと）に実行される
 */
export function startCleanupScheduler() {
  // 初回実行
  cleanupOldReservations();

  // 1時間ごとに実行
  const intervalId = setInterval(() => {
    cleanupOldReservations();
  }, 60 * 60 * 1000); // 1時間

  return () => clearInterval(intervalId);
}

/**
 * 前日以前の予約をSupabaseから削除する
 */
async function cleanupOldReservations(): Promise<void> {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) {
    console.warn("[Cleanup] SUPABASE_URL or SUPABASE_ANON_KEY is not set. Skipping cleanup.");
    return;
  }
  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().slice(0, 10);

    const { error, count } = await supabase
      .from("reservations")
      .delete({ count: "exact" })
      .lt("date", todayStr);

    if (error) {
      console.error("[Cleanup] Error deleting old reservations:", error.message);
    } else if (count && count > 0) {
      console.log(`[Cleanup] Deleted ${count} old reservations from Supabase`);
    }
  } catch (error) {
    console.error("[Cleanup] Unexpected error during cleanup:", error);
  }
}
