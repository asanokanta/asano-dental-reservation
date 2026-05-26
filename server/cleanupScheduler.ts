import { readFileSync, writeFileSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { Reservation } from "../shared/booking.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const RESERVATIONS_PATH = path.resolve(__dirname, "..", "data", "reservations.json");

/**
 * 前日以前の予約を削除する定期タスク
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
 * 前日以前の予約を削除する
 */
function cleanupOldReservations(): void {
  try {
    if (!existsSync(RESERVATIONS_PATH)) {
      return;
    }

    const raw = readFileSync(RESERVATIONS_PATH, "utf-8");
    const reservations = JSON.parse(raw) as Reservation[];

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().slice(0, 10);

    // 本日以降の予約のみを保持
    const filtered = reservations.filter((r) => r.date >= todayStr);

    // 変更があれば保存
    if (filtered.length < reservations.length) {
      writeFileSync(RESERVATIONS_PATH, JSON.stringify(filtered, null, 2) + "\n", "utf-8");
      const deletedCount = reservations.length - filtered.length;
      console.log(`[Cleanup] Deleted ${deletedCount} old reservations`);
    }
  } catch (error) {
    console.error("[Cleanup] Error during cleanup:", error);
  }
}
