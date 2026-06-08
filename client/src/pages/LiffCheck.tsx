import { useEffect, useState } from "react";
import liff from "@line/liff";

const LIFF_ID = import.meta.env.VITE_LIFF_CHECK_ID as string;
const CLINIC_PHONE = "03-3913-4618";
const DAY_NAMES = ["日", "月", "火", "水", "木", "金", "土"];

type Step = "loading" | "name" | "card" | "result" | "none" | "error";
type Patient = { id: string; name: string };
type Reservation = { date: string; time: string; patient_name: string };

function fmtDateJa(dateStr: string) {
  const d = new Date(`${dateStr}T12:00:00`);
  return `${dateStr}（${DAY_NAMES[d.getDay()]}）`;
}
function fmtSlot(time: string) {
  const t = time.slice(0, 5);
  const [h, m] = t.split(":").map(Number);
  const e = h * 60 + m + 30;
  return `${t}〜${String(Math.floor(e / 60)).padStart(2, "0")}:${String(e % 60).padStart(2, "0")}`;
}

export default function LiffCheck() {
  const [step, setStep] = useState<Step>("loading");
  const [nameInput, setNameInput] = useState("");
  const [cardInput, setCardInput] = useState("");
  const [nameError, setNameError] = useState("");
  const [cardError, setCardError] = useState("");
  const [loading, setLoading] = useState(false);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [patientName, setPatientName] = useState("");

  useEffect(() => {
    (async () => {
      try {
        await liff.init({ liffId: LIFF_ID });
        if (!liff.isLoggedIn()) { liff.login(); return; }
        try {
          const friendship = await liff.getFriendship();
          if (!friendship.friendFlag) {
            window.location.href = "https://line.me/R/ti/p/@836mdckl";
            return;
          }
        } catch {}
        setStep("name");
      } catch { setStep("error"); }
    })();
  }, []);

  const fetchReservations = async (membershipId: string, name: string) => {
    const res = await fetch("/api/reserve/my-reservations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ membershipId }),
    });
    const data = await res.json();
    setReservations(data.reservations ?? []);
    setPatientName(name);
    setStep(data.reservations?.length > 0 ? "result" : "none");
  };

  const handleNameSubmit = async () => {
    setNameError(""); setLoading(true);
    try {
      const res = await fetch("/api/reserve/find-by-name", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: nameInput.trim() }),
      });
      const data = await res.json();
      if (data.result === "unique") {
        await fetchReservations(data.patient.id, data.patient.name);
      } else if (data.result === "multiple") {
        setStep("card");
      } else {
        setNameError("お名前が見つかりませんでした。\nカルテに登録されているお名前（漢字）を入力してください。");
      }
    } finally { setLoading(false); }
  };

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
        await fetchReservations(data.patient.id, data.patient.name);
      } else {
        setCardError("診察券番号が正しくありません。");
      }
    } finally { setLoading(false); }
  };

  const base = "min-h-screen bg-[#FEF9E7] flex flex-col items-center px-4 py-8";
  const card = "w-full max-w-sm bg-white rounded-2xl shadow-sm border border-[#EDE4C8] p-6";
  const btn = "w-full py-4 rounded-xl font-bold text-white text-lg transition-colors";
  const green = "bg-[#66BB6A] hover:bg-[#4CAF50]";
  const gray = "bg-slate-300 text-slate-500";
  const input = "w-full border-2 border-[#EDE4C8] rounded-xl px-4 py-3 text-lg font-bold focus:border-[#66BB6A] outline-none";

  if (step === "loading") return (
    <div className="min-h-screen bg-[#FEF9E7] flex items-center justify-center">
      <div className="animate-spin rounded-full h-10 w-10 border-4 border-[#66BB6A] border-t-transparent" />
    </div>
  );

  if (step === "error") return (
    <div className={base}><div className={card}>
      <p className="text-red-600 font-bold text-center">エラーが発生しました。<br />LINEアプリを再起動してください。</p>
    </div></div>
  );

  return (
    <div className={base}>
      <div className="w-full max-w-sm mb-6 text-center">
        <p className="text-[#66BB6A] text-xs font-bold tracking-widest uppercase mb-1">Asano Dental Clinic</p>
        <h1 className="text-2xl font-bold text-[#5C5748]" style={{ fontFamily: "'Zen Maru Gothic', sans-serif" }}>
          📋 ご予約の確認
        </h1>
      </div>

      {/* 名前入力 */}
      {step === "name" && (
        <div className={card + " space-y-4"}>
          <p className="text-sm text-[#8A8575]">カルテに登録されているお名前（漢字）を入力してください。</p>
          {nameError && <p className="text-red-600 text-sm font-bold whitespace-pre-line">{nameError}</p>}
          <input className={input} placeholder="山田太郎" value={nameInput}
            onChange={e => { setNameInput(e.target.value); setNameError(""); }} />
          <button className={`${btn} ${nameInput.trim() && !loading ? green : gray}`}
            onClick={handleNameSubmit} disabled={!nameInput.trim() || loading}>
            {loading ? "確認中…" : "予約を確認する"}
          </button>
        </div>
      )}

      {/* 同姓同名：診察券番号 */}
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
          <button className="w-full text-[#66BB6A] text-sm font-bold" onClick={() => { setStep("name"); setCardInput(""); }}>
            ← 名前入力に戻る
          </button>
          <p className="text-xs text-center" style={{color:"#8A8575"}}>
            診察券番号がわからない場合はお電話ください。<br />
            <a href="tel:0339134618" style={{color:"#66BB6A", fontWeight:"bold"}}>03-3913-4618</a>
          </p>
        </div>
      )}

      {/* 予約あり */}
      {step === "result" && (
        <div className={card + " space-y-4"}>
          <p className="text-sm text-[#8A8575] text-center">直近のご予約内容</p>
          <div className="space-y-3">
            {reservations.map((r, i) => (
              <div key={i} className="bg-[#F1F8E9] rounded-xl p-4 border border-[#C5E1A5] space-y-1">
                <p className="text-sm font-bold text-[#5C5748]">📅 {fmtDateJa(r.date)}</p>
                <p className="text-sm font-bold text-[#66BB6A]">⏰ {fmtSlot(r.time)}</p>
                <p className="text-sm text-[#5C5748]">👤 {r.patient_name}様</p>
              </div>
            ))}
          </div>
          <p className="text-xs text-[#8A8575] text-center">
            キャンセル・変更はお電話にてお願いいたします。<br />
            📞 {CLINIC_PHONE}
          </p>
          <button className={`${btn} ${green}`} onClick={() => liff.closeWindow()}>
            閉じる
          </button>
        </div>
      )}

      {/* 予約なし */}
      {step === "none" && (
        <div className={card + " text-center space-y-4"}>
          <p className="text-4xl">📭</p>
          <p className="font-bold text-[#5C5748]">{patientName}様</p>
          <p className="text-sm text-[#8A8575]">現在のご予約はございません。</p>
          <button className={`${btn} ${green}`} onClick={() => liff.closeWindow()}>
            閉じる
          </button>
        </div>
      )}
    </div>
  );
}
