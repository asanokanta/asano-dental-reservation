import { createClient } from "@supabase/supabase-js";

type Env = {
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
  LINE_CHANNEL_ACCESS_TOKEN: string;
  CRON_SECRET: string;
};

const CLINIC_PHONE = "03-3913-4618";
const DAYS = ["日","月","火","水","木","金","土"];

function getTomorrowJst(): string {
  const jstNow = new Date(Date.now() + 9 * 60 * 60 * 1000);
  const tomorrow = new Date(jstNow);
  tomorrow.setDate(tomorrow.getDate() + 1);
  return tomorrow.toISOString().slice(0, 10);
}

function getTodayJst(): string {
  return new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

function fmtSlot(time: string): string {
  const t = time.slice(0, 5);
  const [h, m] = t.split(":").map(Number);
  const e = h * 60 + m + 30;
  return `${t}〜${String(Math.floor(e / 60)).padStart(2, "0")}:${String(e % 60).padStart(2, "0")}`;
}

async function run(env: Env) {
  const sb = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY);

  // アーカイブ処理
  const today = getTodayJst();
  await sb.from("reservations").update({ archived: true }).lt("date", today).eq("archived", false);

  // リマインド送信
  const tomorrow = getTomorrowJst();
  const { data } = await sb.from("reservations")
    .select("patient_name, date, time, line_user_id")
    .eq("date", tomorrow)
    .not("line_user_id", "is", null);

  let sent = 0;
  for (const r of data ?? []) {
    if (!r.line_user_id) continue;
    const d = new Date(`${r.date}T12:00:00`);
    const msg = `【あさの歯科 予約リマインド】\n\n明日のご予約のお知らせです。\n\n📅 ${r.date}（${DAYS[d.getDay()]}）\n⏰ ${fmtSlot(r.time)}\n👤 ${r.patient_name}様\n\nご来院をお待ちしております😊\n\nキャンセル・変更はお電話にてお願いいたします。\n📞 ${CLINIC_PHONE}`;
    await fetch("https://api.line.me/v2/bot/message/push", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${env.LINE_CHANNEL_ACCESS_TOKEN}` },
      body: JSON.stringify({ to: r.line_user_id, messages: [{ type: "text", text: msg }] }),
    });
    sent++;
  }
  return { ok: true, tomorrow, sent };
}

// POST: GitHub Actions / 手動実行
export const onRequestPost: PagesFunction<Env> = async (context) => {
  const auth = context.request.headers.get("authorization") ?? "";
  if (context.env.CRON_SECRET && auth !== `Bearer ${context.env.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }
  const result = await run(context.env);
  return new Response(JSON.stringify(result), { status: 200 });
};
