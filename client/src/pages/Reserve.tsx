import { useEffect, useState, type FormEvent } from "react";
import { Link } from "wouter";
import { formatDateJa, formatTimeRange, type DateAvailability, type TimeSlot } from "@shared/booking";
import { CLINIC_PHONE, CLINIC_PHONE_DISPLAY, RESERVE_MENU_ITEMS, type ReserveMenuItem } from "@shared/reserve";

type Step = "menu" | "name" | "card" | "date" | "time" | "done";
type Patient = { id: string; name: string };

const DAY_NAMES = ["日", "月", "火", "水", "木", "金", "土"];

/** ステップ進捗バー：実際の画面遷移を①メニュー→②本人確認→③予約日時→④完了の4段階にまとめて表示 */
const PROGRESS_STEPS: { steps: Step[]; label: string }[] = [
  { steps: ["menu"], label: "メニュー" },
  { steps: ["name", "card"], label: "本人確認" },
  { steps: ["date", "time"], label: "予約日時" },
  { steps: ["done"], label: "完了" },
];

function StepProgressBar({ step }: { step: Step }) {
  const current = PROGRESS_STEPS.findIndex((p) => p.steps.includes(step));
  return (
    <div className="flex items-stretch mb-8">
      {PROGRESS_STEPS.map((p, i) => (
        <div key={p.label} className={`flex items-center ${i < PROGRESS_STEPS.length - 1 ? "flex-1" : ""}`}>
          <div className="flex flex-col items-center gap-1 shrink-0">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                i < current
                  ? "bg-brand text-white"
                  : i === current
                    ? "bg-brand text-white ring-4 ring-accent-light"
                    : "bg-cream-muted text-warm-muted"
              }`}
            >
              {i + 1}
            </div>
            <span className={`text-[11px] font-bold whitespace-nowrap ${i === current ? "text-brand" : "text-warm-muted"}`}>
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

export default function Reserve() {
  const [step, setStep] = useState<Step>("menu");
  const [selectedMenu, setSelectedMenu] = useState<ReserveMenuItem | null>(null);
  const [nameInput, setNameInput] = useState("");
  const [cardInput, setCardInput] = useState("");
  const [patient, setPatient] = useState<Patient | null>(null);
  const [nameError, setNameError] = useState<string | null>(null);
  const [cardError, setCardError] = useState<string | null>(null);
  const [bookError, setBookError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });
  const [availability, setAvailability] = useState<Record<string, DateAvailability>>({});
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState<{ date: string; time: string } | null>(null);

  useEffect(() => {
    if (step !== "date") return;
    fetch(`/api/reserve/availability?month=${calendarMonth}`)
      .then((r) => r.json() as Promise<{ availability: Record<string, DateAvailability> }>)
      .then((data) => setAvailability(data.availability ?? {}));
  }, [step, calendarMonth]);

  useEffect(() => {
    if (!selectedDate) return;
    setLoading(true);
    fetch(`/api/reserve/slots?date=${selectedDate}`)
      .then((r) => r.json())
      .then((data: { slots: TimeSlot[] }) => {
        setSlots(data.slots);
        setSelectedTime(null);
      })
      .finally(() => setLoading(false));
  }, [selectedDate]);

  // ステップ1：名前で検索
  const handleNameSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setNameError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/reserve/find-by-name", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: nameInput.trim() }),
      });
      const data = await res.json();
      if (data.result === "unique") {
        setPatient(data.patient);
        setStep("date");
      } else if (data.result === "multiple") {
        setStep("card");
      } else {
        setNameError("お名前が見つかりませんでした。\nカルテに登録されているお名前（漢字）を入力してください。");
      }
    } catch {
      setNameError("通信エラーです。もう一度お試しください。");
    } finally {
      setLoading(false);
    }
  };

  // ステップ2（同姓同名のみ）：診察券番号で特定
  const handleCardSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setCardError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/reserve/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ membershipNumber: cardInput }),
      });
      const data = await res.json();
      if (data.ok && data.patient) {
        // 名前との一致確認
        const inputName = nameInput.trim().replace(/\s/g, "");
        const dbName = data.patient.name.replace(/\s/g, "");
        if (inputName !== dbName) {
          setCardError("お名前と診察券番号が一致しません。");
        } else {
          setPatient(data.patient);
          setStep("date");
        }
      } else if (data.error === "blocked") {
        setCardError(`ネット予約が制限されています。お電話（${CLINIC_PHONE_DISPLAY}）でご連絡ください。`);
      } else {
        setCardError("診察券番号が正しくありません。");
      }
    } catch {
      setCardError("通信エラーです。もう一度お試しください。");
    } finally {
      setLoading(false);
    }
  };

  const handleBook = async () => {
    if (!patient || !selectedDate || !selectedTime) return;
    setBookError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/reserve/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          membershipId: patient.id,
          date: selectedDate,
          time: selectedTime,
          comment: selectedMenu?.label,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setConfirmed({ date: selectedDate, time: selectedTime });
        setStep("done");
      } else if (data.error === "already_booked") {
        setBookError(`already_booked|${data.message}`);
      } else {
        setBookError(data.error ?? "予約できませんでした。");
      }
    } catch {
      setBookError("通信エラーです。もう一度お試しください。");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream">
      <div className="max-w-lg mx-auto px-5 py-10 md:py-14">
        <Link href="/" className="inline-block text-brand font-bold text-base mb-8 hover:text-brand-dark">
          ← トップページへ戻る
        </Link>

        <h1 className="text-2xl md:text-3xl font-bold text-brand-dark mb-3" style={{ fontFamily: "'Zen Maru Gothic', sans-serif" }}>
          ネット予約
        </h1>

        <StepProgressBar step={step} />

        {/* 選択中のメニュー（メニュー選択・完了画面以外で表示） */}
        {selectedMenu && step !== "menu" && step !== "done" && (
          <div className="flex items-center justify-between gap-3 bg-accent-light/60 border border-accent rounded-xl px-4 py-3 mb-6">
            <p className="text-sm text-warm">
              <span className="text-warm-muted">ご来院理由：</span>
              <span className="font-bold">{selectedMenu.label}</span>
            </p>
            <button type="button" onClick={() => setStep("menu")} className="text-xs text-brand font-bold underline shrink-0">
              変更する
            </button>
          </div>
        )}

        {/* ステップ0：メニュー（来院理由）選択 */}
        {step === "menu" && (
          <>
            <p className="text-warm-muted text-lg mb-6">本日のご来院理由を選んでください。</p>
            <div className="flex flex-col gap-3">
              {RESERVE_MENU_ITEMS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => { setSelectedMenu(item); setStep("name"); }}
                  className="flex items-center justify-between gap-4 text-left bg-card border-2 border-cream-muted hover:border-brand rounded-2xl px-5 py-4 transition-colors"
                >
                  <span>
                    <span className="block font-bold text-warm text-lg">{item.label}</span>
                    <span className="block text-sm text-warm-muted mt-1">{item.description}</span>
                  </span>
                  <span className="text-brand text-2xl shrink-0">›</span>
                </button>
              ))}
            </div>
          </>
        )}

        {/* 初診案内（名前・カード入力ステップのみ表示） */}
        {(step === "name" || step === "card") && (
          <div className="bg-accent-light border-2 border-accent rounded-2xl p-5 mb-6 font-bold text-warm leading-relaxed">
            再診（診察券をお持ち）の方のみご利用いただけます。<br />
            初診の方はお電話（
            <a href={`tel:${CLINIC_PHONE.replace(/-/g, "")}`} className="text-brand-dark underline">
              {CLINIC_PHONE_DISPLAY}
            </a>
            ）でご予約ください。
          </div>
        )}

        {/* ステップ1：名前入力 */}
        {step === "name" && (
          <>
            <p className="text-warm-muted text-lg mb-4">カルテに登録されているお名前（漢字）を入力してください。</p>
            <p className="text-xs text-warm-muted/70 mb-6">
              入力された情報は予約管理の目的のみに使用されます。
              <a href="/privacy" className="underline hover:text-brand ml-1">プライバシーポリシー</a>
            </p>
            {nameError && (
              <div className="bg-red-50 border-2 border-red-300 text-red-700 rounded-2xl p-5 mb-6 font-bold whitespace-pre-line">
                {nameError}
              </div>
            )}
            <form onSubmit={handleNameSubmit}>
              <label className="block text-xl font-bold text-warm mb-3">お名前（漢字）</label>
              <input
                type="text"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                className="w-full text-center text-3xl font-bold py-5 rounded-2xl border-2 border-cream-muted bg-card"
                placeholder="山田太郎"
                autoFocus
                required
                disabled={loading}
              />
              <button
                type="submit"
                disabled={loading || !nameInput.trim()}
                className="w-full mt-8 py-5 rounded-2xl bg-brand text-white text-xl font-bold disabled:opacity-60"
              >
                {loading ? "確認中…" : "次へ"}
              </button>
            </form>
          </>
        )}

        {/* ステップ2：同姓同名の場合のみ診察券番号入力 */}
        {step === "card" && (
          <>
            <div className="bg-yellow-50 border-2 border-yellow-300 rounded-2xl p-5 mb-6">
              <p className="font-bold text-yellow-800 mb-1">⚠️ 同姓同名のお名前が登録されています</p>
              <p className="text-sm text-yellow-700">ご本人様確認のため、4桁の診察券番号を入力してください。</p>
            </div>
            {cardError && (
              <div className="bg-red-50 border-2 border-red-300 text-red-700 rounded-2xl p-5 mb-6 font-bold">
                {cardError}
              </div>
            )}
            <form onSubmit={handleCardSubmit}>
              <label className="block text-xl font-bold text-warm mb-3">診察券番号（4桁の数字）</label>
              <input
                type="text"
                inputMode="numeric"
                value={cardInput}
                onChange={(e) => setCardInput(e.target.value.replace(/\D/g, "").slice(0, 4))}
                className="w-full text-center text-4xl font-bold py-5 rounded-2xl border-2 border-cream-muted bg-card tracking-widest"
                placeholder="0000"
                maxLength={4}
                autoFocus
                required
                disabled={loading}
              />
              <button
                type="submit"
                disabled={loading || cardInput.length !== 4}
                className="w-full mt-8 py-5 rounded-2xl bg-brand text-white text-xl font-bold disabled:opacity-60"
              >
                {loading ? "確認中…" : "決定する"}
              </button>
            </form>
            <button type="button" onClick={() => { setStep("name"); setCardInput(""); setCardError(null); }} className="mt-4 text-brand font-bold">
              ← 名前入力に戻る
            </button>
            <p className="text-xs text-warm-muted text-center mt-3">
              診察券番号がわからない場合はお電話ください。<br />
              <a href={`tel:${CLINIC_PHONE.replace(/-/g,"")}`} className="text-brand font-bold">{CLINIC_PHONE_DISPLAY}</a>
            </p>
          </>
        )}

        {/* 日付選択（カレンダー） */}
        {step === "date" && patient && (() => {
          const [y, mo] = calendarMonth.split("-").map(Number);
          const first = new Date(y, mo - 1, 1);
          const last = new Date(y, mo, 0);
          const cells: (string | null)[] = Array(first.getDay()).fill(null);
          for (let d = 1; d <= last.getDate(); d++) {
            cells.push(`${y}-${String(mo).padStart(2,"0")}-${String(d).padStart(2,"0")}`);
          }
          const SYMBOL: Record<DateAvailability | "unknown", { mark: string; color: string; clickable: boolean }> = {
            available: { mark: "○", color: "text-brand", clickable: true },
            low: { mark: "⚠", color: "text-amber-500", clickable: true },
            full: { mark: "×", color: "text-slate-300", clickable: false },
            closed: { mark: "休", color: "text-slate-400", clickable: false },
            unknown: { mark: "×", color: "text-slate-200", clickable: false },
          };
          return (
            <>
              <p className="text-lg mb-1">
                <span className="font-bold">{patient.name}</span> 様
              </p>
              <p className="text-warm-muted mb-5">ご希望の日をタップしてください。</p>
              <div className="bg-card border border-cream-muted rounded-2xl p-4 mb-6">
                {/* 月ナビ */}
                <div className="flex items-center justify-between mb-3">
                  <button type="button" className="text-brand font-bold px-3 py-1 rounded-lg hover:bg-accent-light" onClick={() => {
                    const prev = new Date(y, mo - 2, 1);
                    setCalendarMonth(`${prev.getFullYear()}-${String(prev.getMonth()+1).padStart(2,"0")}`);
                  }}>←</button>
                  <p className="font-bold text-warm">{y}年{mo}月</p>
                  <button type="button" className="text-brand font-bold px-3 py-1 rounded-lg hover:bg-accent-light" onClick={() => {
                    const next = new Date(y, mo, 1);
                    setCalendarMonth(`${next.getFullYear()}-${String(next.getMonth()+1).padStart(2,"0")}`);
                  }}>→</button>
                </div>
                {/* 曜日ヘッダー */}
                <div className="grid grid-cols-7 text-center text-xs font-bold mb-1">
                  {DAY_NAMES.map((d, i) => (
                    <div key={d} className={i===0?"text-red-400":i===6?"text-blue-400":"text-warm-muted"}>{d}</div>
                  ))}
                </div>
                {/* 日付グリッド */}
                <div className="grid grid-cols-7 gap-1 text-center">
                  {cells.map((iso, i) => {
                    if (!iso) return <div key={i} />;
                    const level = availability[iso];
                    const { mark, color, clickable } = SYMBOL[level ?? "unknown"];
                    const dayNum = Number(iso.split("-")[2]);
                    return (
                      <button key={iso} type="button"
                        onClick={() => { if (clickable) { setSelectedDate(iso); setStep("time"); } }}
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
                <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-warm-muted mt-4 pt-3 border-t border-cream-muted">
                  <span><span className="text-brand font-bold">○</span> 余裕あり</span>
                  <span><span className="text-amber-500 font-bold">⚠</span> 残り少し</span>
                  <span><span className="text-slate-400 font-bold">×</span> 空きなし</span>
                  <span><span className="text-slate-400 font-bold">休</span> 休診日</span>
                </div>
              </div>
            </>
          );
        })()}

        {/* 時間選択 */}
        {step === "time" && patient && selectedDate && (
          <>
            <p className="text-lg font-bold mb-1">{formatDateJa(selectedDate)}</p>
            <p className="text-warm-muted mb-6">時間を選んでください。</p>
            {bookError && (
              <div className="bg-red-50 border-2 border-red-300 text-red-700 rounded-2xl p-4 mb-4 font-bold">
                {bookError.includes("already_booked") ? (
                  <div className="flex flex-col gap-2">
                    <p>すでに予約が入っています。</p>
                    <p className="text-sm opacity-80">{bookError.split("|")[1]}</p>
                    <p className="text-sm mt-2 border-t border-red-200 pt-2">変更・キャンセルはお電話（{CLINIC_PHONE_DISPLAY}）で承ります。</p>
                  </div>
                ) : bookError}
              </div>
            )}
            {loading ? (
              <p className="text-center py-8 text-warm-muted">読み込み中…</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-8">
                {slots.filter((s) => s.available).map((slot) => (
                  <button
                    key={slot.time}
                    type="button"
                    onClick={() => setSelectedTime(slot.time)}
                    className={`py-4 rounded-xl text-lg font-bold border-2 transition-colors relative ${
                      selectedTime === slot.time
                        ? "border-brand bg-brand text-white"
                        : "border-cream-muted bg-card hover:border-brand"
                    }`}
                  >
                    {slot.available && (
                      <span className="absolute top-1 right-2 text-brand/30 text-sm">+</span>
                    )}
                    {formatTimeRange(slot.time)}
                  </button>
                ))}
              </div>
            )}
            <button
              type="button"
              disabled={!selectedTime || loading}
              onClick={handleBook}
              className="w-full py-5 rounded-2xl bg-brand text-white text-xl font-bold disabled:opacity-50 mb-4"
            >
              {loading ? "予約中…" : "この日時で予約する"}
            </button>
            <button type="button" onClick={() => setStep("date")} className="text-brand font-bold">
              ← 日付を選び直す
            </button>
          </>
        )}

        {/* 完了 */}
        {step === "done" && patient && confirmed && (
          <div className="bg-card border-2 border-brand/30 rounded-2xl p-8 text-center">
            <p className="text-2xl font-bold text-brand-dark mb-4">予約が完了しました</p>
            <p className="text-xl font-bold text-warm mb-2">{patient.name} 様</p>
            {selectedMenu && (
              <p className="text-warm-muted text-sm mb-2">ご来院理由：{selectedMenu.label}</p>
            )}
            <p className="text-2xl font-bold text-brand mb-6">
              {formatDateJa(confirmed.date)}<br />
              {formatTimeRange(confirmed.time)}
            </p>
            <p className="text-warm-muted text-sm mb-8">
              変更・キャンセルはお電話（{CLINIC_PHONE_DISPLAY}）でお願いします。
            </p>
            <Link href="/" className="inline-block py-3 px-8 rounded-xl bg-brand text-white font-bold">
              トップへ戻る
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
