/**
 * API レスポンスの統一形式
 */

export type ApiResponse<T = any> =
  | { ok: true; data: T }
  | { ok: false; error: string; code?: string };

export type ApiErrorCode =
  | "VALIDATION_ERROR"      // 入力値が不正
  | "AUTHENTICATION_ERROR"  // 認証失敗
  | "AUTHORIZATION_ERROR"   // 権限不足
  | "NOT_FOUND"             // リソースが見つからない
  | "CONFLICT"              // リソースが既に存在する
  | "INTERNAL_ERROR"        // サーバーエラー
  | "LOCK_TIMEOUT";         // ロック取得タイムアウト

/**
 * エラーレスポンスを生成
 */
export function createErrorResponse(
  message: string,
  code: ApiErrorCode = "INTERNAL_ERROR"
): ApiResponse<never> {
  return {
    ok: false,
    error: message,
    code,
  };
}

/**
 * 成功レスポンスを生成
 */
export function createSuccessResponse<T>(data: T): ApiResponse<T> {
  return {
    ok: true,
    data,
  };
}

/**
 * HTTP ステータスコードを決定
 */
export function getHttpStatus(code?: ApiErrorCode): number {
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
