import fs from "node:fs";
import path from "node:path";

/**
 * ファイルベースの排他制御（簡易ロック機構）
 * 複数プロセスからの同時アクセスを防ぐため、ロックファイルを使用する
 */

const LOCK_DIR = path.resolve(process.cwd(), ".locks");

// ロックディレクトリが存在しない場合は作成
if (!fs.existsSync(LOCK_DIR)) {
  fs.mkdirSync(LOCK_DIR, { recursive: true });
}

interface LockOptions {
  timeout?: number; // ロック待機のタイムアウト（ミリ秒）
  maxRetries?: number; // リトライ回数
  retryDelay?: number; // リトライ間隔（ミリ秒）
}

/**
 * ファイルロックを取得する
 * @param lockName ロック名（通常はファイル名）
 * @param options ロックオプション
 * @returns ロックを解放する関数
 */
export async function acquireLock(
  lockName: string,
  options: LockOptions = {}
): Promise<() => void> {
  const {
    timeout = 5000,
    maxRetries = 50,
    retryDelay = 100,
  } = options;

  const lockPath = path.join(LOCK_DIR, `${lockName}.lock`);
  const startTime = Date.now();
  let retries = 0;

  while (retries < maxRetries) {
    if (Date.now() - startTime > timeout) {
      throw new Error(`Lock acquisition timeout for ${lockName}`);
    }

    try {
      // 排他的にファイルを作成（既に存在する場合は失敗）
      const fd = fs.openSync(lockPath, "wx");
      fs.closeSync(fd);

      // ロック取得成功
      return () => {
        try {
          fs.unlinkSync(lockPath);
        } catch (e) {
          // ロック解放失敗時もサイレント処理
          console.warn(`Failed to release lock: ${lockName}`, e);
        }
      };
    } catch (e) {
      // ロック取得失敗、リトライ
      retries++;
      if (retries < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
    }
  }

  throw new Error(`Failed to acquire lock for ${lockName} after ${maxRetries} retries`);
}

/**
 * ロック付きでコールバック関数を実行
 * @param lockName ロック名
 * @param callback 実行する関数
 * @param options ロックオプション
 */
export async function withLock<T>(
  lockName: string,
  callback: () => T | Promise<T>,
  options: LockOptions = {}
): Promise<T> {
  const releaseLock = await acquireLock(lockName, options);
  try {
    return await Promise.resolve(callback());
  } finally {
    releaseLock();
  }
}
