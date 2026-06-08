import { handleLineMessage, type LineMessage } from "../../api/lib-line.js";

type Env = {
  LINE_CHANNEL_SECRET: string;
  LINE_CHANNEL_ACCESS_TOKEN: string;
  LINE_LIFF_ID: string;
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
  OPENAI_API_KEY: string;
};

async function verifySignature(body: string, signature: string, secret: string): Promise<boolean> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(body));
  const bytes = new Uint8Array(sig);
  const b64 = btoa(Array.from(bytes).map((b) => String.fromCharCode(b)).join(""));
  return b64 === signature;
}

async function replyToLine(replyToken: string, messages: LineMessage[], token: string) {
  await fetch("https://api.line.me/v2/bot/message/reply", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ replyToken, messages }),
  });
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  // 環境変数をprocess.envに注入（lib-line.tsが参照するため）
  Object.assign(process.env, {
    SUPABASE_URL: env.SUPABASE_URL,
    SUPABASE_ANON_KEY: env.SUPABASE_ANON_KEY,
    LINE_CHANNEL_SECRET: env.LINE_CHANNEL_SECRET,
    LINE_CHANNEL_ACCESS_TOKEN: env.LINE_CHANNEL_ACCESS_TOKEN,
    LINE_LIFF_ID: env.LINE_LIFF_ID,
  });

  const rawBody = await request.text();
  const signature = request.headers.get("x-line-signature") ?? "";

  if (!await verifySignature(rawBody, signature, env.LINE_CHANNEL_SECRET)) {
    return new Response(JSON.stringify({ error: "Invalid signature" }), { status: 401 });
  }

  let body: { events?: Array<{ type: string; message?: { type: string; text: string }; replyToken: string; source?: { userId?: string } }> };
  try {
    body = JSON.parse(rawBody);
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), { status: 400 });
  }

  const events = body.events ?? [];
  await Promise.all(events.map(async (event) => {

    // フォロー（友だち追加）時の挨拶メッセージ
    if (event.type === "follow") {
      await replyToLine(event.replyToken, [
        {
          type: "text",
          text:
            `🦷 あさの歯科 公式LINEへようこそ！\n\n` +
            `友だち追加ありがとうございます😊\n\n` +
            `このアカウントでは\n` +
            `✅ 再診の方のネット予約\n` +
            `✅ ご予約内容の確認\n` +
            `✅ 前日のリマインド通知\n` +
            `✅ 休診日などのお知らせ\n\n` +
            `などをご利用いただけます。\n\n` +
            `※ ネット予約は診察券をお持ちの再診の方のみご利用いただけます。\n` +
            `初めてのご来院（初診）はお電話にてご予約ください。\n` +
            `📞 03-3913-4618\n\n` +
            `下のメニューからご用件をお選びください。`,
        },
      ], env.LINE_CHANNEL_ACCESS_TOKEN);
      return;
    }

    // テキストメッセージ処理
    if (event.type !== "message" || event.message?.type !== "text") return;
    const userId = event.source?.userId ?? "unknown";
    const userText = event.message.text;
    try {
      const messages = await handleLineMessage(userId, userText);
      await replyToLine(event.replyToken, messages.slice(0, 5), env.LINE_CHANNEL_ACCESS_TOKEN);
    } catch (err) {
      console.error("[LINE webhook] Error:", err);
      await replyToLine(event.replyToken, [{
        type: "text",
        text: "申し訳ございません、エラーが発生しました。\nしばらくしてから再度お試しください。",
      }], env.LINE_CHANNEL_ACCESS_TOKEN);
    }
  }));

  return new Response(JSON.stringify({ ok: true }), { status: 200 });
};
