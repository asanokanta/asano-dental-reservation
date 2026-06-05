/**
 * 自作ネット予約 — 診察券番号 → 日時選択 → 確定
 */
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Link } from "wouter";
import { formatDateJa, formatTimeRange, type TimeSlot } from "@shared/booking";
import {
  CLINIC_PHONE,
  CLINIC_PHONE_DISPLAY,
  RESERVE_ERROR_MESSAGES,
} from "@shared/reserve";

type Step = "id" | "date" | "time" | "done";
type ErrorType = "not_found" | "blocked" | "empty" | null;

type Patient = { id: string; name: string };

export default function Reserve() {
  const [step, setStep] = useState<Step>("id");
  const [membershipNumber, setMembershipNumber] = useState("");
  const [patient, setPatient] = useState<Patient | null>(null);
  const [errorType, setErrorType] = useState<ErrorType>(null);
  const [bookError, setBookError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [dates, setDates] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState<{ date: string; time: string } | null>(null);

  const loadDates = useCallback(async () => {
    const res = await fetch("/api/reserve/dates");
    const data = (await res.json()) as { dates: string[] };
    setDates(data.dates);
  }, []);

  useEffect(() => {
    if (step === "date") loadDates();
  }, [step, loadDates]);

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

  const handleIdSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorType(null);
    setLoading(true);
    try {
      const res = await fetch("/api/reserve/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ membershipNumber }),
      });
      const data = await res.json();
      if (data.ok && data.patient) {
        setPatient(data.patient);
        setStep("date");
      } else {
        setErrorType(data.error ?? "not_found");
      }
    } catch {
      setErrorType("not_found");
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
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setConfirmed({ date: selectedDate, time: selectedTime });
        setStep("done");
      } else {
        if (data.error === "already_booked") {
          setBookError(`already_booked|${data.message}`);
        } else {
          setBookError(data.error ?? "予約できませんでした。");
        }
      }
    } catch {
      setBookError("通信エラーです。もう一度お試しください。");
    } finally {
      setLoading(false);
    }
  };

  const errorMessage =
    errorType === "blocked"
      ? RESERVE_ERROR_MESSAGES.blocked(CLINIC_PHONE_DISPLAY)
      : errorType
        ? RESERVE_ERROR_MESSAGES[errorType === "empty" ? "not_found" : errorType]
        : null;

  return (
    <div className="min-h-screen bg-cream">
      <div className="max-w-lg mx-auto px-5 py-10 md:py-14">
        <Link
          href="/"
          className="inline-block text-brand font-bold text-base mb-8 hover:text-brand-dark"
        >
          ← トップページへ戻る
        </Link>

        <h1
          className="text-2xl md:text-3xl font-bold text-brand-dark mb-3"
          style={{ fontFamily: "'Zen Maru Gothic', sans-serif" }}
        >
          ネット予約
        </h1>

        {step === "id" && (
          <>
            <p className="text-warm-muted text-lg mb-6">
              診察券番号を入力してください。
            </p>
            <div className="bg-accent-light border-2 border-accent rounded-2xl p-5 mb-6 font-bold text-warm leading-relaxed">
              初診の方はネット予約できません。お電話（
              <a href={`tel:${CLINIC_PHONE.replace(/-/g, "")}`} className="text-brand-dark underline">
                {CLINIC_PHONE_DISPLAY}
              </a>
              ）でご予約ください。
            </div>
            {errorMessage && (
              <div className="bg-red-50 border-2 border-red-300 text-red-700 rounded-2xl p-5 mb-6 text-lg font-bold" role="alert">
                {errorMessage}
              </div>
            )}
            <form onSubmit={handleIdSubmit}>
              <label htmlFor="membership_number" className="block text-xl font-bold text-warm mb-3">
                診察券番号（半角数字）
              </label>
              <input
                id="membership_number"
                type="text"
                inputMode="numeric"
                value={membershipNumber}
                onChange={(e) => setMembershipNumber(e.target.value.replace(/\D/g, ""))}
                className="w-full text-center text-4xl md:text-5xl font-bold py-5 rounded-2xl border-2 border-cream-muted bg-card"
                placeholder="0001"
                maxLength={4}
                autoFocus
                required
                disabled={loading}
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full mt-8 py-5 rounded-2xl bg-brand text-white text-xl font-bold disabled:opacity-60"
              >
                {loading ? "確認中…" : "次へ（日時を選ぶ）"}
              </button>
            </form>
          </>
        )}

        {step === "date" && patient && (
          <>
            <p className="text-lg mb-2">
              <span className="font-bold">{patient.name}</span> 様（No.{patient.id}）
            </p>
            <p className="text-warm-muted mb-6">ご希望の日を選んでください。</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
              {dates.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => {
                    setSelectedDate(d);
                    setStep("time");
                  }}
                  className="py-4 px-3 rounded-2xl border-2 border-cream-muted bg-card text-lg font-bold hover:border-brand hover:bg-accent-light transition-colors"
                >
                  {formatDateJa(d)}
                </button>
              ))}
            </div>
            <button type="button" onClick={() => setStep("id")} className="text-brand font-bold">
              ← 番号入力に戻る
            </button>
          </>
        )}

        {step === "time" && patient && selectedDate && (
          <>
            <p className="text-lg font-bold mb-1">{formatDateJa(selectedDate)}</p>
            <p className="text-warm-muted mb-6">時間を選んでください。</p>
            {bookError && (
              <div className="bg-red-50 border-2 border-red-300 text-red-700 rounded-2xl p-4 mb-4 font-bold">
                {bookError.includes("already_booked") ? (
                  <div className="flex flex-col gap-2">
                    <p>すでに予約が入っています。</p>
                    <p className="text-sm opacity-80">{bookError.split('|')[1]}</p>
                    <p className="text-sm mt-2 border-t border-red-200 pt-2">変更・キャンセルはお電話（{CLINIC_PHONE_DISPLAY}）で承ります。</p>
                  </div>
                ) : bookError}
              </div>
            )}
            {loading ? (
              <p className="text-center py-8 text-warm-muted">読み込み中…</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-8">
                {slots.map((slot) => (
                  <button
                    key={slot.time}
                    type="button"
                    disabled={!slot.available}
                    onClick={() => setSelectedTime(slot.time)}
                    className={`py-4 rounded-xl text-lg font-bold border-2 transition-colors relative ${
                      !slot.available
                        ? "border-cream-muted bg-cream-muted/30 text-warm-muted/50 line-through"
                        : selectedTime === slot.time
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

        {step === "done" && patient && confirmed && (
          <div className="bg-card border-2 border-brand/30 rounded-2xl p-8 text-center">
            <p className="text-2xl font-bold text-brand-dark mb-4">予約が完了しました</p>
            <p className="text-xl font-bold text-warm mb-2">{patient.name} 様</p>
            <p className="text-2xl font-bold text-brand mb-6">
              {formatDateJa(confirmed.date)}
              <br />
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
