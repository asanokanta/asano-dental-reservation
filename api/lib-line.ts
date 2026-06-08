import { createClient } from "@supabase/supabase-js";
import {
  getAvailableDates,
  getSessionsForDate,
  generateSlotsForSession,
  isRegularClosedDay,
} from "./lib.js";

// ---------- 定数 ----------

const CLINIC_PHONE = "03-3913-4618";
const CLINIC_NAME = "あさの歯科";
const BRAND_COLOR = "#5bbfad";
const DEV_PASSWORD = "asano-dev-reset";

// ---------- Supabase ----------

function getSupabase() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error("SUPABASE_URL / SUPABASE_ANON_KEY が未設定です");
  return createClient(url, key);
}

// ---------- LINE メッセージ型 ----------

export type LineMessage =
  | { type: "text"; text: string; quickReply?: QuickReply }
  | { type: "flex"; altText: string; contents: object }
  | { type: "template"; altText: string; template: object };

type QuickReply = { items: QRItem[] };
type QRItem = { type: "action"; action: { type: "message"; label: string; text: string } };

// ---------- メッセージビルダー ----------

function qrItem(label: string, text: string): QRItem {
  return { type: "action", action: { type: "message", label, text } };
}

function textMsg(text: string, qr?: QRItem[]): LineMessage {
  return qr
    ? { type: "text", text, quickReply: { items: qr } }
    : { type: "text", text };
}

function yesNoMsg(text: string): LineMessage {
  return textMsg(text, [qrItem("✅ はい", "はい"), qrItem("❌ いいえ", "いいえ")]);
}

/** メインメニュー（Flex Message） */
function mainMenu(): LineMessage {
  const btn = (label: string, text: string, style: "primary" | "secondary" = "secondary") => ({
    type: "button",
    action: { type: "message", label, text },
    style,
    height: "sm",
    margin: "sm",
    color: style === "primary" ? BRAND_COLOR : undefined,
  });

  return {
    type: "flex",
    altText: "メニュー",
    contents: {
      type: "bubble",
      size: "kilo",
      header: {
        type: "box",
        layout: "vertical",
        backgroundColor: BRAND_COLOR,
        paddingAll: "16px",
        contents: [
          { type: "text", text: `🦷 ${CLINIC_NAME}`, color: "#ffffff", weight: "bold", size: "md" },
          { type: "text", text: "ご用件をお選びください", color: "#ffffff", size: "sm", margin: "sm" },
          { type: "text", text: "※ Web・LINE予約は再診（診察券をお持ちの方）のみ", color: "#ffffffCC", size: "xxs", margin: "sm" },
        ],
      },
      body: {
        type: "box",
        layout: "vertical",
        paddingAll: "12px",
        contents: [
          {
            type: "button",
            action: {
              type: "uri",
              label: "📅  再診のご予約",
              uri: `https://liff.line.me/${process.env.LINE_LIFF_ID ?? "2010286249-p0zTCLo7"}`,
            },
            style: "primary",
            height: "sm",
            margin: "sm",
            color: BRAND_COLOR,
          },
          btn("📞  初診のご予約（電話案内）", "初診について"),
          btn("📋  ご予約の確認", "予約確認"),
          btn("❓  よくあるご質問", "よくあるご質問"),
        ],
      },
    },
  };
}

/** 月案内（テキストのみ） */
function monthSelectMsg(text: string): LineMessage {
  const now = new Date();
  const months: string[] = [];
  for (let i = 0; i < 5; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
    months.push(`${d.getMonth() + 1}月`);
  }
  return textMsg(`${text}\n\n確認したい月を入力してください。\n例：${months.join("、")}`);
}

/** 日付入力案内 */
function dateSelectMsg(text: string, _dates: string[]): LineMessage {
  const prompt = "ご希望の日付を入力してください。\n例：6月2日";
  return textMsg(text ? `${text}\n\n${prompt}` : prompt);
}

/** よくある質問メニュー */
/** 日付が休診か満枠かを判定してメッセージを返す */
function noSlotMsg(dateStr: string): string {
  if (isRegularClosedDay(dateStr)) {
    return `${fmtDate(dateStr)}は休診日です。\n別の日程をご入力ください。`;
  }
  return `${fmtDate(dateStr)}は満枠です。\n別の日程をご入力ください。`;
}

/** "09:30" → "09:30〜10:00" */
function fmtSlot(slot: string): string {
  const [h, m] = slot.split(":").map(Number);
  const endMin = h * 60 + m + 30;
  return `${slot}〜${String(Math.floor(endMin / 60)).padStart(2, "0")}:${String(endMin % 60).padStart(2, "0")}`;
}

/** 時間選択 Quick Reply */
function timeSelectMsg(dateStr: string, slots: string[]): LineMessage {
  // ラベルは "09:30〜10:00"、送信テキストは "09:30"（パース用）
  const items = slots.slice(0, 13).map((s) => qrItem(fmtSlot(s), s));
  return textMsg(
    `${fmtDate(dateStr)}の空き時間:\n${slots.map(fmtSlot).join("\n")}\n\nご希望の時間をタップしてください。\n\nご都合に合う時間帯がなければ「別の日付」と入力してください。`,
    items
  );
}

// ---------- 会話セッション ----------

type PatientCandidate = { id: string; name: string };

type ConversationState =
  | { step: "idle" }
  | { step: "awaiting_first_visit" }
  | { step: "checking_availability" }
  | { step: "awaiting_name" }
  | { step: "confirming_patient_for_booking"; candidates: PatientCandidate[] }
  | { step: "awaiting_card_for_booking"; candidates: PatientCandidate[] }
  | { step: "awaiting_date"; patientName: string; membershipId: string }
  | { step: "date_queried"; date: string }
  | { step: "awaiting_name_with_date"; date: string }
  | { step: "confirming_patient_for_date"; candidates: PatientCandidate[]; date: string }
  | { step: "awaiting_time"; patientName: string; date: string; membershipId: string }
  | { step: "confirming"; patientName: string; date: string; time: string; membershipId: string }
  | { step: "check_reservation_name" }
  | { step: "confirming_patient_for_check"; candidates: PatientCandidate[] }
  | { step: "just_confirmed"; date: string; time: string; patientName: string; membershipId: string };

async function getSession(userId: string): Promise<ConversationState> {
  const { data } = await getSupabase()
    .from("line_sessions")
    .select("state, updated_at")
    .eq("user_id", userId)
    .single();
  const state = (data?.state as ConversationState) ?? { step: "idle" };
  // just_confirmed は10分で自動失効
  if (state.step === "just_confirmed" && data?.updated_at) {
    const age = Date.now() - new Date(data.updated_at).getTime();
    if (age > 10 * 60 * 1000) return { step: "idle" };
  }
  return state;
}

async function setSession(userId: string, state: ConversationState): Promise<void> {
  await getSupabase().from("line_sessions").upsert({
    user_id: userId,
    state,
    updated_at: new Date().toISOString(),
  });
}

async function clearSession(userId: string): Promise<void> {
  await setSession(userId, { step: "idle" });
}

// ---------- 患者・予約ヘルパー ----------

/** LINE User IDで紐付き患者を取得（自動ログイン用） */
async function findPatientByLineUserId(lineUserId: string): Promise<PatientCandidate | null> {
  const { data } = await getSupabase()
    .from("patients")
    .select("id, name")
    .eq("line_user_id", lineUserId)
    .eq("status", "normal")
    .maybeSingle();
  return data ?? null;
}

/** 認証成功後にpatients.line_user_idを保存 */
async function linkLineUserId(membershipId: string, lineUserId: string): Promise<void> {
  await getSupabase()
    .from("patients")
    .update({ line_user_id: lineUserId })
    .eq("id", membershipId);
}

/** 名前でPatients検索（スペース除去して完全一致・status問わず件数確認） */
async function findPatientsByName(name: string): Promise<PatientCandidate[]> {
  const normalized = name.replace(/\s/g, "");
  const { data } = await getSupabase()
    .from("patients")
    .select("id, name, status")
    .limit(200);
  const all = (data ?? []).filter((p: any) =>
    p.name.replace(/\s/g, "") === normalized
  );
  // 同姓同名がいる場合（blocked含む）→ normal のみ返すが複数扱いにするため全件チェック
  if (all.length > 1) {
    // 同姓同名あり → normalのみ返す（診察券番号入力で特定）
    return all.filter((p: any) => p.status === "normal").map((p: any) => ({ id: p.id, name: p.name }));
  }
  return all.filter((p: any) => p.status === "normal").map((p: any) => ({ id: p.id, name: p.name }));
}

/** 同姓同名チェック（blocked含む全員でカウント） */
async function hasNameDuplicate(name: string): Promise<boolean> {
  const normalized = name.replace(/\s/g, "");
  const { data } = await getSupabase()
    .from("patients")
    .select("id, name")
    .limit(200);
  const all = (data ?? []).filter((p: any) => p.name.replace(/\s/g, "") === normalized);
  return all.length > 1;
}

/** カルテ番号で自分の今後の予約を取得 */
async function getMyReservations(membershipId: string): Promise<string> {
  const today = new Date().toISOString().slice(0, 10);
  const { data } = await getSupabase()
    .from("reservations")
    .select("date, time, patient_name")
    .eq("membership_id", membershipId)
    .gte("date", today)
    .order("date", { ascending: true })
    .order("time", { ascending: true })
    .limit(5);
  if (!data || data.length === 0) {
    return "現在のご予約はございません。\n「予約」から新しいご予約ができます。";
  }
  const reservationLines = data.map((r: any) =>
    `📅 ${fmtDate(r.date)}\n⏰ ${fmtSlot(r.time.slice(0, 5))}\n👤 ${r.patient_name}様`
  ).join("\n\n");
  return (
    reservationLines +
    `\n\nご来院をお待ちしております😊\n\nキャンセル・変更はお電話にてお願いいたします。\n📞 ${CLINIC_PHONE}`
  );
}

/** 候補患者をクイックリプライで選ばせるメッセージ */
function patientSelectMsg(candidates: PatientCandidate[]): LineMessage {
  const items = candidates.map((p) =>
    qrItem(`${p.id}番`, `${p.id}`)
  );
  const list = candidates.map((p) => `・カルテ番号 ${p.id}番（${p.name}）`).join("\n");
  return textMsg(
    `同じお名前の方が複数いらっしゃいます。\nご自身のカルテ番号をタップしてください:\n\n${list}\n\nカルテ番号は診察券に記載されています。`,
    items
  );
}

// ---------- 予約ヘルパー ----------

async function getAvailableSlots(dateStr: string): Promise<string[]> {
  const sessions = getSessionsForDate(dateStr);
  const allSlots: string[] = [];
  for (const session of sessions) {
    allSlots.push(...generateSlotsForSession(dateStr, session));
  }
  const { data: booked } = await getSupabase()
    .from("reservations")
    .select("time")
    .eq("date", dateStr);
  const bookedTimes = new Set(
    (booked ?? []).map((r: any) => (r.time as string).slice(0, 5))
  );
  return allSlots.filter((s) => !bookedTimes.has(s));
}

const DAY_NAMES = ["日", "月", "火", "水", "木", "金", "土"];

function fmtDate(dateStr: string): string {
  const dow = DAY_NAMES[new Date(`${dateStr}T12:00:00`).getDay()];
  return `${dateStr}（${dow}）`;
}

function parseDate(text: string): string | null {
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text;
  const jp = text.match(/(\d{1,2})月(\d{1,2})日/);
  if (jp) {
    const y = new Date().getFullYear();
    const m = String(Number(jp[1])).padStart(2, "0");
    const d = String(Number(jp[2])).padStart(2, "0");
    const candidate = `${y}-${m}-${d}`;
    const today = new Date().toISOString().slice(0, 10);
    return candidate < today ? `${y + 1}-${m}-${d}` : candidate;
  }
  return null;
}

function parseYearMonth(text: string): string | null {
  // "6月3日" のように日付まで含む場合は月単独とみなさない
  if (/\d{1,2}月\d{1,2}日/.test(text)) return null;
  const now = new Date();
  if (text.includes("今月")) return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  if (text.includes("来月")) {
    const next = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    return `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, "0")}`;
  }
  const m = text.match(/(\d{1,2})月/);
  if (m) {
    const month = Number(m[1]);
    let year = now.getFullYear();
    if (month < now.getMonth() + 1) year++;
    return `${year}-${String(month).padStart(2, "0")}`;
  }
  return null;
}

function extractDateQuery(text: string): string | null {
  const patterns = [
    /(\d{1,2})月(\d{1,2})日[はにってで]?(?:空|あ|予約|受診|取)/,
    /(?:空い|予約|受診)[^\d]*(\d{1,2})月(\d{1,2})日/,
  ];
  for (const p of patterns) {
    const m = text.match(p);
    if (m) return parseDate(`${m[1]}月${m[2]}日`);
  }
  return null;
}

const phoneMsg = (extra = "") =>
  textMsg(
    `⚠️ ネット予約・LINE予約は\n診察券番号をお持ちの再診の方のみご利用いただけます。\n\n初めてご来院の方（初診）は\nお電話にてご予約ください。\n\n` +
    `📞 ${CLINIC_PHONE}\n\n` +
    `【診療時間】\n` +
    `午前 9:30〜13:00 / 午後 14:30〜19:30\n\n` +
    `【最終受付】\n` +
    `月・火・水・金：午前12:00 / 午後19:00\n` +
    `木曜：午前10:00〜12:00 / 午後17:00\n` +
    `土曜：午前12:00まで（午後休診）\n\n` +
    `【休診日】\n` +
    `水曜午前・土曜午後・日曜・祝日\n` +
    `第2・第4・第5木曜・第1・第3土曜\n\n` +
    extra +
    `お気軽にお電話ください😊`
  );

// ---------- メインハンドラ ----------

export async function handleLineMessage(
  userId: string,
  text: string
): Promise<LineMessage[]> {
  const session = await getSession(userId);
  const t = text.trim();

  // 開発者用リセット（セッションを初期状態に戻してメインメニューを表示）
  if (t === DEV_PASSWORD) {
    await clearSession(userId);
    return [
      textMsg("🔧 セッションをリセットしました。初回起動と同じ状態です。"),
    ];
  }

  // どのステップでもキャンセル可能
  if (["キャンセル", "やめる", "取り消し", "最初から"].some((k) => t.includes(k))) {
    await clearSession(userId);
    return [textMsg("操作をキャンセルしました。\nまたお気軽にご連絡ください😊")];
  }

  // --- グローバルコマンド（どのステップからでも動くメニューボタン） ---
  // メインメニューのボタンテキストを完全一致でチェック
  if (t === "初診について") {
    await clearSession(userId);
    return [phoneMsg()];
  }
  if (t === "予約確認") {
    // LIFF予約直後のセッションがあれば名前確認なしで直接表示
    if (session.step === "just_confirmed") {
      const { date, time, patientName } = session;
      await clearSession(userId);
      return [
        textMsg(
          `✅ ご予約が完了しました！\n\n` +
          `📅 ${fmtDate(date)}\n` +
          `⏰ ${fmtSlot(time)}\n` +
          `👤 ${patientName}様\n\n` +
          `ご来院をお待ちしております😊\n\n` +
          `キャンセル・変更はお電話にてお願いいたします。\n📞 ${CLINIC_PHONE}`
        ),
      ];
    }
    await setSession(userId, { step: "check_reservation_name" });
    return [textMsg("ご予約の確認のため、カルテに登録されているお名前をお教えください。\n例：山田太郎")];
  }
  if (t === "質問があります") {
    return [textMsg(`ご不明な点はお電話にてお気軽にお問い合わせください。\n📞 ${CLINIC_PHONE}`)];
  }
  if (t === "よくあるご質問") {
    return [
      {
        type: "flex",
        altText: "よくあるご質問",
        contents: {
          type: "bubble",
          body: {
            type: "box",
            layout: "vertical",
            spacing: "md",
            contents: [
              { type: "text", text: "❓ よくあるご質問", weight: "bold", size: "md", color: "#5C5748" },
              { type: "text", text: "ホワイトニング・インプラント・診療料金についてまとめています。", size: "sm", color: "#8A8575", wrap: true },
              {
                type: "button",
                action: { type: "uri", label: "よくあるご質問を見る →", uri: "https://asano-dental.pages.dev/faq" },
                style: "primary",
                color: "#66BB6A",
                margin: "md",
              },
            ],
          },
        },
      },
    ];
  }

  if (t === "直近の空き日程を確認したい") {
    await setSession(userId, { step: "checking_availability" });
    return [await upcomingSlotsMsg()];
  }
  if (t === "再診で予約したい") {
    await setSession(userId, { step: "awaiting_name" });
    return [textMsg("カルテに登録されているお名前をお教えください。\n例：山田太郎")];
  }

  // -------- idle --------
  if (session.step === "idle") {

    // 初診
    if (t.includes("初診")) {
      return [phoneMsg()];
    }

    // "2月2日は空いてる？" or 日付ボタンタップ（"6月3日" など）
    const queriedDate = extractDateQuery(t) ?? parseDate(t);
    if (queriedDate) {
      const slots = await getAvailableSlots(queriedDate);
      if (slots.length === 0) {
        return [dateSelectMsg(noSlotMsg(queriedDate), getAvailableDates(false))];
      }
      await setSession(userId, { step: "date_queried", date: queriedDate });
      return [
        yesNoMsg(
          `${fmtDate(queriedDate)}は空いています！\n` +
          `空き時間:\n${slots.map(fmtSlot).join("\n")}\n\nご予約されますか？`
        ),
      ];
    }

    // "○月の空きは？" 形式
    const yearMonth = parseYearMonth(t);
    if (yearMonth && ["空き", "空い", "予約", "日程"].some((k) => t.includes(k))) {
      const dates = getAvailableDates(false).filter((d) => d.startsWith(yearMonth));
      const monthNum = Number(yearMonth.split("-")[1]);
      if (dates.length === 0) {
        return [dateSelectMsg(`${monthNum}月は現在空き日程がございません。`, [])];
      }
      return [
        dateSelectMsg(`${monthNum}月の空き日程を確認しました。`, dates),
      ];
    }

    // 予約フロー（再診ボタン or テキスト）
    if (["再診", "予約", "よやく", "受診", "空き確認"].some((k) => t.includes(k))) {
      await setSession(userId, { step: "awaiting_name" });
      return [textMsg("ご予約を承ります！\nカルテに登録されているお名前をお教えください。\n例：山田太郎")];
    }

    // あいさつ
    if (["こんにちは", "はじめまして", "hello", "hi", "よろしく", "お願い"].some((k) =>
      t.toLowerCase().includes(k)
    )) {
      return [
        textMsg(`こんにちは！${CLINIC_NAME}の公式LINEです😊\nご用件をお選びください。`),
      ];
    }

    // 上記どれにも該当しない場合
    return [
      textMsg(`ご連絡ありがとうございます😊\n\nご不明な点はホームページをご確認ください。\nhttps://asano-dental.pages.dev`),
    ];
  }

  // -------- awaiting_first_visit --------
  if (session.step === "awaiting_first_visit") {
    if (t.includes("初診")) {
      await clearSession(userId);
      return [phoneMsg()];
    }
    if (["再診", "いいえ", "違う", "通院", "通っ", "かかりつけ"].some((k) => t.includes(k))) {
      await setSession(userId, { step: "awaiting_name" });
      return [textMsg("カルテに登録されているお名前をお教えください。\n例：山田太郎")];
    }
    return [
      textMsg(
        "「初診」または「再診」のどちらかをお送りください。",
        [qrItem("初診", "初診"), qrItem("再診", "再診")]
      ),
    ];
  }

  // -------- checking_availability --------
  if (session.step === "checking_availability") {
    // 日付を入力した場合 → その日で予約フローへ
    const dateStr = parseDate(t);
    if (dateStr) {
      if (isRegularClosedDay(dateStr)) {
        return [textMsg(`${fmtDate(dateStr)}は休診日です。\n別の日付を入力してください。\n例：6月2日`)];
      }
      const slots = await getAvailableSlots(dateStr);
      if (slots.length === 0) {
        return [textMsg(`${fmtDate(dateStr)}は満枠です。\n別の日付を入力してください。\n例：6月2日`)];
      }
      await setSession(userId, { step: "awaiting_name_with_date", date: dateStr });
      return [
        textMsg(
          `${fmtDate(dateStr)}の空き時間:\n${slots.map(fmtSlot).join("\n")}\n\nご予約のため、カルテに登録されているお名前をお教えください。\n例：山田太郎`
        ),
      ];
    }

    // それ以外 → 直近の空き一覧を再表示
    return [await upcomingSlotsMsg()];
  }

  // -------- date_queried --------
  if (session.step === "date_queried") {
    if (["はい", "yes", "予約", "する", "じゃあ", "では", "お願"].some((k) =>
      t.toLowerCase().includes(k)
    )) {
      await setSession(userId, { step: "awaiting_name_with_date", date: session.date });
      return [textMsg("カルテに登録されているお名前をお教えください。\n例：山田太郎")];
    }
    await clearSession(userId);
    return [textMsg("了解しました。またお気軽にご連絡ください😊")];
  }

  // -------- awaiting_name_with_date --------
  if (session.step === "awaiting_name_with_date") {
    const candidates = await findPatientsByName(t);

    if (candidates.length === 0) {
      await clearSession(userId);
      return [
        textMsg(
          `「${t}」様のカルテが見つかりませんでした。\nお名前をご確認の上、もう一度お試しください。\n📞 ${CLINIC_PHONE}`
        ),
      ];
    }

    const slots = await getAvailableSlots(session.date);
    if (slots.length === 0) {
      await clearSession(userId);
      return [textMsg(`${noSlotMsg(session.date)}\nお電話でもご予約を承ります。\n📞 ${CLINIC_PHONE}`)];
    }

    if (candidates.length === 1) {
      const p = candidates[0];
      await setSession(userId, { step: "confirming_patient_for_date", candidates, date: session.date });
      return [yesNoMsg(`カルテ番号 ${p.id}番 の ${p.name}様でよろしいですか？`)];
    }

    await setSession(userId, { step: "confirming_patient_for_date", candidates, date: session.date });
    return [patientSelectMsg(candidates)];
  }

  // -------- confirming_patient_for_date --------
  if (session.step === "confirming_patient_for_date") {
    const { candidates, date } = session;

    const resolvePatient = (): PatientCandidate | null => {
      if (["はい", "yes", "ok"].some((k) => t.toLowerCase().includes(k)) && candidates.length === 1) {
        return candidates[0];
      }
      const numMatch = t.match(/(\d+)/);
      if (numMatch) return candidates.find((p) => p.id === numMatch[1]) ?? null;
      return null;
    };

    const p = resolvePatient();
    if (!p) {
      if (["いいえ", "違う", "no"].some((k) => t.toLowerCase().includes(k))) {
        await clearSession(userId);
        return [textMsg("お名前をもう一度お教えください。")];
      }
      return [patientSelectMsg(candidates)];
    }

    const slots = await getAvailableSlots(date);
    if (slots.length === 0) {
      await clearSession(userId);
      return [textMsg(`${noSlotMsg(date)}\nお電話でもご予約を承ります。\n📞 ${CLINIC_PHONE}`)];
    }
    await setSession(userId, { step: "awaiting_time", patientName: p.name, date, membershipId: p.id });
    return [timeSelectMsg(date, slots)];
  }

  // -------- awaiting_name --------
  if (session.step === "awaiting_name") {
    const isDuplicate = await hasNameDuplicate(t);
    const candidates = await findPatientsByName(t);

    if (candidates.length === 0) {
      await clearSession(userId);
      return [
        textMsg(
          `「${t}」様のカルテが見つかりませんでした。\n` +
          `カルテに登録されているお名前（漢字）でお試しください。\n\n` +
          `ご不明な場合はお電話ください。\n📞 ${CLINIC_PHONE}`
        ),
      ];
    }

    if (!isDuplicate && candidates.length === 1) {
      // 同姓同名なし・1件のみ → 即日程選択へ
      const p = candidates[0];
      await linkLineUserId(p.id, userId);
      const allDates = getAvailableDates(false);
      if (allDates.length === 0) {
        await clearSession(userId);
        return [textMsg(`現在ご予約可能な日程がございません。\nお電話ください。\n📞 ${CLINIC_PHONE}`)];
      }
      await setSession(userId, { step: "awaiting_date", patientName: p.name, membershipId: p.id });
      return [dateSelectMsg("", allDates)];
    }

    // 同姓同名あり（blocked含む）→ 4桁の診察券番号を入力させる
    await setSession(userId, { step: "awaiting_card_for_booking", candidates });
    return [
      textMsg(
        `⚠️ 同姓同名のお名前が登録されています。\n\nご本人様確認のため、4桁の診察券番号を入力してください。`
      ),
    ];
  }

  // -------- awaiting_card_for_booking（同姓同名時の診察券番号入力） --------
  if (session.step === "awaiting_card_for_booking") {
    const { candidates } = session;
    const numMatch = t.match(/^(\d{4})$/);
    if (!numMatch) {
      return [textMsg("4桁の数字で診察券番号を入力してください。")];
    }
    const selected = candidates.find((p) => p.id === numMatch[1]);
    if (!selected) {
      return [textMsg("診察券番号が一致しません。\n4桁の数字をもう一度入力してください。")];
    }
    await linkLineUserId(selected.id, userId);
    const allDates = getAvailableDates(false);
    if (allDates.length === 0) {
      await clearSession(userId);
      return [textMsg(`現在ご予約可能な日程がございません。\nお電話ください。\n📞 ${CLINIC_PHONE}`)];
    }
    await setSession(userId, { step: "awaiting_date", patientName: selected.name, membershipId: selected.id });
    return [dateSelectMsg("", allDates)];
  }

  // -------- confirming_patient_for_booking（旧フロー互換） --------
  if (session.step === "confirming_patient_for_booking") {
    // 既存セッションの互換処理：リセットしてやり直し
    await clearSession(userId);
    return [textMsg("お名前をもう一度お教えください。\n例：山田太郎")];
  }

  // -------- awaiting_date --------
  if (session.step === "awaiting_date") {
    // parseDate を先に試す（"6月3日" が parseYearMonth に誤検知されるのを防ぐ）
    const dateStr = parseDate(t);
    if (dateStr) {
      const maxDate = getAvailableDates(false).at(-1) ?? "";
      if (dateStr > maxDate) {
        const allDates = getAvailableDates(false);
        return [dateSelectMsg(`${fmtDate(dateStr)}は予約受付期間外です。`, allDates)];
      }
      const slots = await getAvailableSlots(dateStr);
      if (slots.length === 0) {
        return [dateSelectMsg(noSlotMsg(dateStr), getAvailableDates(false))];
      }
      await setSession(userId, { step: "awaiting_time", patientName: session.patientName, date: dateStr, membershipId: session.membershipId });
      return [timeSelectMsg(dateStr, slots)];
    }

    // 月選択（"7月" など）
    const yearMonth = parseYearMonth(t);
    if (yearMonth) {
      const dates = getAvailableDates(false).filter((d) => d.startsWith(yearMonth));
      const monthNum = Number(yearMonth.split("-")[1]);
      if (dates.length === 0) {
        return [monthSelectMsg(`${monthNum}月は空き日程がございません。`)];
      }
      return [dateSelectMsg(`${monthNum}月の空き日程を確認しました。`, dates)];
    }

    // どちらにも当てはまらない場合
    const allDates = getAvailableDates(false);
    return [
      dateSelectMsg(`日付が読み取れませんでした。`, allDates),
    ];
  }

  // -------- awaiting_time --------
  if (session.step === "awaiting_time") {
    // 「別の日付」→ 日付入力に戻る
    if (["別の日付", "別の日", "日付を変える", "日程変更", "戻る"].some((k) => t.includes(k))) {
      await setSession(userId, { step: "awaiting_date", patientName: session.patientName, membershipId: session.membershipId });
      return [dateSelectMsg(`別の日付をお選びください。`, [])];
    }

    // "9:30" / "09:30" どちらも受け付ける
    const m = t.match(/^(\d{1,2})[:\s](\d{2})$/);
    if (!m) {
      const slots = await getAvailableSlots(session.date);
      return [
        textMsg(`時間が読み取れませんでした。\n下のボタンからタップしてください。`),
        timeSelectMsg(session.date, slots),
      ];
    }
    const time = `${String(Number(m[1])).padStart(2, "0")}:${m[2]}`;
    const slots = await getAvailableSlots(session.date);
    if (!slots.includes(time)) {
      return [
        textMsg(`${time}はすでに埋まっています。\n他の時間をお選びください。`),
        timeSelectMsg(session.date, slots),
      ];
    }
    await setSession(userId, {
      step: "confirming",
      patientName: session.patientName,
      date: session.date,
      time,
      membershipId: session.membershipId,
    });
    return [
      yesNoMsg(
        `以下の内容でよろしいですか？\n\n` +
        `👤 お名前：${session.patientName}様\n` +
        `📅 日付　：${fmtDate(session.date)}\n` +
        `⏰ 時間　：${fmtSlot(time)}\n\n` +
        `「はい」で確定します。`
      ),
    ];
  }

  // -------- confirming --------
  if (session.step === "confirming") {
    const yes = ["はい", "yes", "ok", "確定", "お願い"].some((k) =>
      t.toLowerCase().includes(k)
    );
    if (!yes) {
      await clearSession(userId);
      return [textMsg("ご予約をキャンセルしました。")];
    }

    const membershipId = session.membershipId || `LINE-${userId.slice(-8)}`;

    // 既存の予約チェック（Web・LINE・管理画面いずれの予約も対象）
    const { data: existing } = await getSupabase()
      .from("reservations")
      .select("date, time")
      .eq("membership_id", membershipId)
      .eq("archived", false)
      .maybeSingle();

    if (existing) {
      await clearSession(userId);
      return [
        textMsg(
          `⚠️ すでに予約があります。\n\n` +
          `📅 ${fmtDate(existing.date)}\n` +
          `⏰ ${fmtSlot((existing.time as string).slice(0, 5))}\n\n` +
          `変更・キャンセルはお電話ください。\n📞 ${CLINIC_PHONE}`
        ),
      ];
    }

    const { error } = await getSupabase().from("reservations").insert({
      membership_id: membershipId,
      patient_name: session.patientName,
      date: session.date,
      time: session.time,
      source: "line",
      line_user_id: userId,
    });
    await clearSession(userId);

    if (error) {
      console.error("[LINE bot] reservation insert error:", error);
      return [
        textMsg(
          `予約登録中にエラーが発生しました。\nお手数ですが、お電話にてご連絡ください。\n📞 ${CLINIC_PHONE}`
        ),
      ];
    }

    return [
      textMsg(
        `✅ ご予約が完了しました！\n\n` +
        `📅 ${fmtDate(session.date)}\n` +
        `⏰ ${fmtSlot(session.time)}\n` +
        `👤 ${session.patientName}様\n\n` +
        `ご来院をお待ちしております😊\n\n` +
        `キャンセル・変更はお電話にてお願いいたします。\n📞 ${CLINIC_PHONE}`
      ),
    ];
  }

  // -------- check_reservation_name --------
  if (session.step === "check_reservation_name") {
    const isDuplicate = await hasNameDuplicate(t);
    const candidates = await findPatientsByName(t);

    if (candidates.length === 0) {
      await clearSession(userId);
      return [
        textMsg(
          `「${t}」様のカルテが見つかりませんでした。\nお名前をご確認の上、もう一度お試しください。\n\nご不明な場合はお電話ください。\n📞 ${CLINIC_PHONE}`
        ),
      ];
    }

    if (!isDuplicate && candidates.length === 1) {
      // 1件のみ → 確認なしで即座に予約内容を表示
      await clearSession(userId);
      return [textMsg(await getMyReservations(candidates[0].id))];
    }

    // 同姓同名 → 診察券番号で特定
    await setSession(userId, { step: "confirming_patient_for_check", candidates });
    return [textMsg(`⚠️ 同姓同名のお名前が登録されています。\n\nご本人様確認のため、4桁の診察券番号を入力してください。`)];
  }

  // -------- confirming_patient_for_check --------
  if (session.step === "confirming_patient_for_check") {
    const { candidates } = session;

    const numMatch = t.match(/^(\d{4})$/);
    if (!numMatch) {
      return [textMsg("4桁の数字で診察券番号を入力してください。")];
    }
    const selected = candidates.find((p) => p.id === numMatch[1]);
    if (!selected) {
      return [textMsg("診察券番号が一致しません。\n4桁の数字をもう一度入力してください。")];
    }
    await clearSession(userId);
    return [textMsg(await getMyReservations(selected.id))];
  }

  return [
    textMsg(
      `ご連絡ありがとうございます😊\n\nご用件をお選びください。\nお急ぎの場合はお電話ください。\n📞 ${CLINIC_PHONE}`
    ),
  ];
}

// ---------- サブ関数 ----------

/** 直近10件の空き日時一覧メッセージ */
async function upcomingSlotsMsg(): Promise<LineMessage> {
  const dates = getAvailableDates(false); // 明日以降
  const items: string[] = [];

  for (const date of dates) {
    if (items.length >= 10) break;
    const slots = await getAvailableSlots(date);
    for (const slot of slots) {
      if (items.length >= 10) break;
      items.push(`${fmtDate(date)} ${fmtSlot(slot)}`);
    }
  }

  if (items.length === 0) {
    return textMsg(`現在ご予約可能な日程がございません。\nお電話にてお問い合わせください。\n📞 ${CLINIC_PHONE}`);
  }

  return textMsg(
    `📅 直近の空き日時（上位10件）:\n\n${items.join("\n")}\n\nご希望の日付を入力すると予約に進めます。\n例：6月2日`
  );
}
