import { useEffect, useState } from "react";
import liff from "@line/liff";
import { formatTimeRange, type DateAvailability } from "@shared/booking";
import { RESERVE_MENU_ITEMS, type ReserveMenuItem } from "@shared/reserve";

const LIFF_ID = import.meta.env.VITE_LIFF_ID as string;
const CLINIC_PHONE = "03-3913-4618";
const DAY_NAMES = ["日", "月", "火", "水", "木", "金", "土"];

type AuthStep = "loading" | "menu" | "name" | "card" | "calendar" | "time" | "confirm" | "done" | "error";
type Patient = { id: string; name: string };

function fmtDateJa(dateStr: string) {
  const d = new Date(`${dateStr}T12:00:00`);
  return `${dateStr}（${DAY_NAMES[d.getDay()]}）`;
}
function fmtSlot(time: string) {
  const [h, m] = time.split(":").map(Number);
  const e = h * 60 + m + 30;
  return `${time}〜${String(Math.floor(e / 60)).padStart(2, "0")}:${String(e % 60).padStart(2, "0")}`;
}

/** ステップ進捗バー：①メニュー→②本人確認→③予約日時→④内容確認→⑤完了 */
const PROGRESS_STEPS: { steps: AuthStep[]; label: string }[] = [
  { steps: ["menu"], label: "メニュー" },
  { steps: ["name", "card"], label: "本人確認" },
  { steps: ["calendar", "time"], label: "予約日時" },
  { steps: ["confirm"], label: "内容確認" },
  { steps: ["done"], label: "完了" },
];

function StepProgressBar({ step }: { step: AuthStep }) {
  const current = PROGRESS_STEPS.findIndex((p) => p.steps.includes(step));
  if (current < 0) return null;
  return (
    <div className="w-full max-w-sm flex items-stretch mb-5">
      {PROGRESS_STEPS.map((p, i) => (
        <div key={p.label} className={`flex items-center ${i < PROGRESS_STEPS.length - 1 ? "flex-1" : ""}`}>
          <div className="flex flex-col items-center gap-1 shrink-0">
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                i < current
                  ? "bg-brand text-white"
                  : i === current
                    ? "bg-brand text-white ring-4 ring-accent-light"
                    : "bg-cream-muted text-warm-muted"
              }`}
            >
              {i + 1}
            </div>
            <span className={`text-[10px] font-bold whitespace-nowrap ${i === current ? "text-brand" : "text-warm-muted"}`}>
              {p.label}
            </span>
          </div>
          {i < PROGRESS_STEPS.length - 1 && (
            <div className={`h-0.5 flex-1 mx-1 mb-4 ${i < current ? "bg-brand" : "bg-cream-muted"}`} />
          )}
        </div>
      ))}
    </div>
  );
}

export default function LiffReserve() {
  const [step, setStep] = useState<AuthStep>("loading");
  const [lineUserId, setLineUserId] = useState("");
  const [selectedMenu, setSelectedMenu] = useState<ReserveMenuItem | null>(null);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [nameInput, setNameInput] = useState("");
  const [cardInput, setCardInput] = useState("");
  const [nameError, setNameError] = useState("");
  const [cardError, setCardError] = useState("");
  const [loading, setLoading] = useState(false);

  const [selectedDate, setSelectedDate] = useState("");
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });
  const [availability, setAvailability] = useState<Record<string, DateAvailability>>({});
  const [slots, setSlots] = useState<{ time: string; available: boolean }[]>([]);
  const [selectedTime, setSelectedTime] = useState("");
  const [bookError, setBookError] = useState("");

  // LIFF初期化（友だち追加チェック付き）
  useEffect(() => {
    (async () => {
      try {
        await liff.init({ liffId: LIFF_ID });
        if (!liff.isLoggedIn()) { liff.login(); return; }

        // 友だち追加チェック（Bot連携が未設定でも落ちないようtry-catch）
        try {
          const friendship = await liff.getFriendship();
          if (!friendship.friendFlag) {
            window.location.href = "https://line.me/R/ti/p/@836mdckl";
            return;
          }
        } catch {
          // Bot連携未設定の場合はスキップして続行
        }

        const profile = await liff.getProfile();
        setLineUserId(profile.userId);
        setStep("menu");
      } catch (e) {
        console.error(e);
        setStep("error");
      }
    })();
  }, []);

  // カレンダー表示中は月の空き状況（○/⚠/×/休）を取得
  useEffect(() => {
    if (step !== "calendar") return;
    fetch(`/api/reserve/availability?month=${calendarMonth}`)
      .then((r) => r.json() as Promise<{ availability: Record<string, DateAvailability> }>)
      .then((data) => setAvailability(data.availability ?? {}));
  }, [step, calendarMonth]);

  // 名前認証
  const handleNameSubmit = async () => {
    setNameError(""); setLoading(true);
    try {
      const res = await fetch("/api/reserve/find-by-name", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: nameInput.trim() }),
      });
      const data = await res.json();
      if (data.result === "unique") {
        setPatient(data.patient);
        await fetch("/api/reserve/liff-link", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ lineUserId, membershipId: data.patient.id }),
        });
        setStep("calendar");
      } else if (data.result === "multiple") {
        setStep("card");
      } else {
        setNameError("お名前が見つかりませんでした。カルテに登録されているお名前（漢字）を入力してください。");
      }
    } finally { setLoading(false); }
  };

  // 診察券番号認証（同姓同名）
  const handleCardSubmit = async () => {
    setCardError(""); setLoading(true);
    try {
      const res = await fetch("/api/reserve/validate", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ membershipNumber: cardInput }),
      });
      const data = await res.json();
      if (data.ok && data.patient) {
        const inputName = nameInput.trim().replace(/\s/g, "");
        const dbName = data.patient.name.replace(/\s/g, "");
        if (inputName !== dbName) { setCardError("お名前と診察券番号が一致しません。"); return; }
        setPatient(data.patient);
        await fetch("/api/reserve/liff-link", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ lineUserId, membershipId: data.patient.id }),
        });
        setStep("calendar");
      } else {
        setCardError(data.error === "blocked"
          ? `ネット予約が制限されています。お電話（${CLINIC_PHONE}）でご連絡ください。`
          : "診察券番号が正しくありません。");
      }
    } finally { setLoading(false); }
  };

  // 日付選択 → 時間取得
  const handleDateSelect = async (date: string) => {
    setSelectedDate(date); setLoading(true);
    try {
      const res = await fetch(`/api/reserve/slots?date=${date}`);
      const data = await res.json();
      setSlots(data.slots ?? []);
      setSelectedTime("");
      setStep("time");
    } finally { setLoading(false); }
  };

  // 予約確定
  const handleBook = async () => {
    if (!patient || !selectedDate || !selectedTime) return;
    setBookError(""); setLoading(true);
    try {
      const res = await fetch("/api/reserve/book", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          membershipId: patient.id,
          date: selectedDate,
          time: selectedTime,
          comment: selectedMenu?.label,
          // lineUserIdを渡さない→プッシュ通知なし（LINEチャットで確認を促す）
        }),
      });
      const data = await res.json();
      if (data.ok) {
        // セッションに予約内容を保存（予約確認ボタンで名前確認なしに表示するため）
        await fetch("/api/reserve/liff-confirm", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            lineUserId,
            membershipId: patient.id,
            date: selectedDate,
            time: selectedTime,
            patientName: patient.name,
          }),
        }).catch(() => {});
        setStep("done");
      } else if (data.error === "already_booked") {
        setBookError("すでに予約が入っています。変更はお電話でお願いします。");
      } else {
        setBookError(data.error ?? "予約できませんでした。");
      }
    } finally { setLoading(false); }
  };

  // カレンダー生成
  const calendarDates = (() => {
    const [y, mo] = calendarMonth.split("-").map(Number);
    const first = new Date(y, mo - 1, 1);
    const last = new Date(y, mo, 0);
    const cells: (string | null)[] = Array(first.getDay()).fill(null);
    for (let d = 1; d <= last.getDate(); d++) {
      const iso = `${y}-${String(mo).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
      cells.push(iso);
    }
    return cells;
  })();

  /** 空き状況レベル → カレンダーに表示する記号・色・タップ可否 */
  const AVAILABILITY_SYMBOL: Record<DateAvailability | "unknown", { mark: string; color: string; clickable: boolean }> = {
    available: { mark: "○", color: "text-brand", clickable: true },
    low: { mark: "⚠", color: "text-amber-500", clickable: true },
    full: { mark: "×", color: "text-slate-300", clickable: false },
    closed: { mark: "休", color: "text-slate-400", clickable: false },
    unknown: { mark: "×", color: "text-slate-200", clickable: false },
  };

  // ---- UI ----
  const base = "min-h-screen bg-cream flex flex-col items-center px-4 py-8";
  const card = "w-full max-w-sm bg-card rounded-2xl shadow-sm border border-cream-muted p-6";
  const btn = "w-full py-4 rounded-xl font-bold text-white text-lg transition-colors";
  const green = "bg-brand hover:bg-brand-dark";
  const gray = "bg-cream-muted text-warm-muted";
  const input = "w-full border-2 border-cream-muted rounded-xl px-4 py-3 text-lg font-bold focus:border-brand outline-none";

  if (step === "loading") return (
    <div className="min-h-screen bg-cream flex items-center justify-center">
      <div className="animate-spin rounded-full h-10 w-10 border-4 border-brand border-t-transparent" />
    </div>
  );

  if (step === "error") return (
    <div className={base}><div className={card}>
      <p className="text-red-600 font-bold text-center">エラーが発生しました。<br />LINEアプリを再起動してください。</p>
    </div></div>
  );

  return (
    <div className={base}>
      {/* ヘッダー */}
      <div className="w-full max-w-sm mb-4 text-center">
        <p className="text-brand text-xs font-bold tracking-widest uppercase mb-1">Asano Dental Clinic</p>
        <h1 className="text-2xl font-bold text-warm" style={{ fontFamily: "'Zen Maru Gothic', sans-serif" }}>
          🦷 ネット予約
        </h1>
      </div>

      <StepProgressBar step={step} />

      {/* 選択中のメニュー（メニュー選択・完了画面以外で表示） */}
      {selectedMenu && step !== "menu" && step !== "done" && (
        <div className="w-full max-w-sm mb-3 flex items-center justify-between gap-3 bg-card border border-cream-muted rounded-xl px-4 py-2.5">
          <p className="text-xs text-warm">
            <span className="text-warm-muted">ご来院理由：</span>
            <span className="font-bold">{selectedMenu.label}</span>
          </p>
          <button className="text-[10px] text-brand font-bold underline shrink-0" onClick={() => setStep("menu")}>
            変更する
          </button>
        </div>
      )}

      {/* メニュー（来院理由）選択 */}
      {step === "menu" && (
        <div className={card + " space-y-3"}>
          <p className="text-sm text-warm-muted">本日のご来院理由を選んでください。</p>
          <div className="space-y-2">
            {RESERVE_MENU_ITEMS.map((item) => (
              <button key={item.id} type="button"
                onClick={() => { setSelectedMenu(item); setStep("name"); }}
                className="w-full flex items-center justify-between gap-3 text-left bg-card border-2 border-cream-muted hover:border-brand rounded-xl px-4 py-3 transition-colors"
              >
                <span>
                  <span className="block font-bold text-warm">{item.label}</span>
                  <span className="block text-xs text-warm-muted mt-0.5">{item.description}</span>
                </span>
                <span className="text-brand text-xl shrink-0">›</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 名前入力 */}
      {step === "name" && (
        <div className={card + " space-y-4"}>
          <div className="bg-accent-light border border-accent rounded-xl p-3 text-xs text-warm font-medium">
            再診（診察券をお持ち）の方のみご利用いただけます。
          </div>
          <p className="text-sm text-warm-muted">カルテに登録されているお名前（漢字）を入力してください。</p>
          {nameError && <p className="text-red-600 text-sm font-bold">{nameError}</p>}
          <input className={input} placeholder="山田太郎" value={nameInput}
            onChange={e => { setNameInput(e.target.value); setNameError(""); }} />
          <button className={`${btn} ${nameInput.trim() && !loading ? green : gray}`}
            onClick={handleNameSubmit} disabled={!nameInput.trim() || loading}>
            {loading ? "確認中…" : "次へ"}
          </button>
        </div>
      )}

      {/* 診察券番号（同姓同名） */}
      {step === "card" && (
        <div className={card + " space-y-4"}>
          <div className="bg-yellow-50 border border-yellow-300 rounded-xl p-3">
            <p className="text-sm font-bold text-yellow-800 mb-1">⚠️ 同姓同名のお名前が登録されています</p>
            <p className="text-xs text-yellow-700">4桁の診察券番号を入力してください。</p>
          </div>
          {cardError && <p className="text-red-600 text-sm font-bold">{cardError}</p>}
          <input className={`${input} text-center text-3xl tracking-widest`}
            placeholder="0000" maxLength={4} inputMode="numeric" value={cardInput}
            onChange={e => { setCardInput(e.target.value.replace(/\D/g,"").slice(0,4)); setCardError(""); }} />
          <button className={`${btn} ${cardInput.length === 4 && !loading ? green : gray}`}
            onClick={handleCardSubmit} disabled={cardInput.length !== 4 || loading}>
            {loading ? "確認中…" : "決定する"}
          </button>
          <button className="w-full text-brand text-sm font-bold" onClick={() => { setStep("name"); setCardInput(""); }}>
            ← 名前入力に戻る
          </button>
        </div>
      )}

      {/* カレンダー */}
      {step === "calendar" && (
        <div className={card + " space-y-4"}>
          <p className="text-sm text-warm-muted"><span className="font-bold text-warm">{patient?.name}</span> 様</p>
          {/* 月ナビ */}
          <div className="flex items-center justify-between">
            <button className="text-brand font-bold px-3 py-1" onClick={() => {
              const [y, m] = calendarMonth.split("-").map(Number);
              const prev = new Date(y, m - 2, 1);
              setCalendarMonth(`${prev.getFullYear()}-${String(prev.getMonth()+1).padStart(2,"0")}`);
            }}>←</button>
            <p className="font-bold text-warm">
              {calendarMonth.split("-").map(Number).join("年")}月
            </p>
            <button className="text-brand font-bold px-3 py-1" onClick={() => {
              const [y, m] = calendarMonth.split("-").map(Number);
              const next = new Date(y, m, 1);
              setCalendarMonth(`${next.getFullYear()}-${String(next.getMonth()+1).padStart(2,"0")}`);
            }}>→</button>
          </div>
          {/* 曜日ヘッダー */}
          <div className="grid grid-cols-7 text-center text-xs font-bold">
            {["日","月","火","水","木","金","土"].map((d,i) => (
              <div key={d} className={i===0?"text-red-400":i===6?"text-blue-400":"text-warm-muted"}>{d}</div>
            ))}
          </div>
          {/* 日付グリッド */}
          <div className="grid grid-cols-7 gap-1 text-center">
            {calendarDates.map((iso, i) => {
              if (!iso) return <div key={i} />;
              const level = availability[iso];
              const { mark, color, clickable } = AVAILABILITY_SYMBOL[level ?? "unknown"];
              const dayNum = Number(iso.split("-")[2]);
              return (
                <button key={iso}
                  onClick={() => clickable && handleDateSelect(iso)}
                  disabled={!clickable}
                  className={`flex flex-col items-center justify-center gap-0.5 rounded-lg py-2 border transition-colors ${
                    clickable ? "bg-accent-light border-brand/30 hover:border-brand" : "border-transparent"
                  }`}
                >
                  <span className={`text-sm font-bold ${clickable ? "text-warm" : "text-slate-300"}`}>{dayNum}</span>
                  <span className={`text-xs leading-none ${color}`}>{mark}</span>
                </button>
              );
            })}
          </div>
          {/* 空き状況の凡例 */}
          <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[11px] text-warm-muted pt-2 border-t border-cream-muted">
            <span><span className="text-brand font-bold">○</span> 余裕あり</span>
            <span><span className="text-amber-500 font-bold">⚠</span> 残り少し</span>
            <span><span className="text-slate-400 font-bold">×</span> 空きなし</span>
            <span><span className="text-slate-400 font-bold">休</span> 休診日</span>
          </div>
        </div>
      )}

      {/* 時間選択 */}
      {step === "time" && (
        <div className={card + " space-y-4"}>
          <button className="text-brand text-sm font-bold" onClick={() => setStep("calendar")}>← 日付を変える</button>
          <p className="font-bold text-warm">{fmtDateJa(selectedDate)}</p>
          <p className="text-sm text-warm-muted">時間を選んでください。</p>
          {bookError && <p className="text-red-600 text-sm font-bold">{bookError}</p>}
          {loading ? <p className="text-center text-warm-muted py-4">読み込み中…</p> : (
            <div className="grid grid-cols-2 gap-2">
              {slots.filter(s => s.available).map(s => (
                <button key={s.time}
                  onClick={() => { setSelectedTime(s.time); setStep("confirm"); }}
                  className={`py-3 rounded-xl font-bold border-2 text-sm transition-colors ${
                    selectedTime === s.time
                      ? "border-brand bg-brand text-white"
                      : "border-cream-muted bg-card text-warm hover:border-brand"
                  }`}
                >
                  {formatTimeRange(s.time)}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 確認画面 */}
      {step === "confirm" && patient && (
        <div className={card + " space-y-5"}>
          <p className="text-center text-warm-muted text-sm">この内容でよろしいですか？</p>
          <div className="bg-accent-light rounded-xl p-5 space-y-2 border border-accent">
            {selectedMenu && (
              <>
                <p className="text-sm text-warm-muted">📝 ご来院理由</p>
                <p className="font-bold text-warm">{selectedMenu.label}</p>
              </>
            )}
            <p className="text-sm text-warm-muted mt-2">👤 お名前</p>
            <p className="font-bold text-warm text-lg">{patient.name}様</p>
            <p className="text-sm text-warm-muted mt-2">📅 日付</p>
            <p className="font-bold text-warm">{fmtDateJa(selectedDate)}</p>
            <p className="text-sm text-warm-muted mt-2">⏰ 時間</p>
            <p className="font-bold text-brand text-lg">{fmtSlot(selectedTime)}</p>
          </div>
          {bookError && <p className="text-red-600 text-sm font-bold text-center">{bookError}</p>}
          <button className={`${btn} ${!loading ? green : gray}`} onClick={handleBook} disabled={loading}>
            {loading ? "予約中…" : "はい、予約する"}
          </button>
          <button className="w-full text-brand text-sm font-bold" onClick={() => { setStep("time"); setBookError(""); }}>
            ← 時間を変える
          </button>
        </div>
      )}

      {/* 完了 */}
      {step === "done" && patient && (
        <div className={card + " text-center space-y-4"}>
          <p className="text-4xl">✅</p>
          <p className="text-xl font-bold text-warm">予約が完了しました</p>
          <div className="bg-accent-light rounded-xl p-4 text-left space-y-1 border border-accent">
            {selectedMenu && <p className="text-sm font-bold text-warm">📝 {selectedMenu.label}</p>}
            <p className="text-sm font-bold text-warm">👤 {patient.name}様</p>
            <p className="text-sm font-bold text-warm">📅 {fmtDateJa(selectedDate)}</p>
            <p className="text-sm font-bold text-brand">⏰ {fmtSlot(selectedTime)}</p>
          </div>
          <p className="text-xs text-warm-muted">
            キャンセル・変更はお電話でお願いします。<br />📞 {CLINIC_PHONE}
          </p>
          {/* LINEチャットで予約内容を確認するボタン（返信メッセージ=無料） */}
          <button
            className={`${btn} ${green}`}
            onClick={async () => {
              try {
                await liff.sendMessages([{ type: "text", text: "予約確認" }]);
                liff.closeWindow();
              } catch {
                // スコープ未承認の場合はチャットを開く
                liff.openWindow({
                  url: "https://line.me/R/oaMessage/@836mdckl/?%E4%BA%88%E7%B4%84%E7%A2%BA%E8%AA%8D",
                  external: false,
                });
              }
            }}
          >
            💬 LINEで予約内容を確認する
          </button>
          <button
            className="w-full py-3 rounded-xl text-sm text-warm-muted border border-cream-muted"
            onClick={() => liff.closeWindow()}
          >
            閉じる
          </button>
        </div>
      )}
    </div>
  );
}
