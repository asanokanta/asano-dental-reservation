/**
 * 医院向け管理画面 — 患者登録・予約確認
 * パスワード: 環境変数 ADMIN_PASSWORD（未設定時は asano-admin）
 */
import { useCallback, useEffect, useState, useMemo, type FormEvent } from "react";
import { Link } from "wouter";
import { formatDateJa, formatTimeRange, getSourceLabel, type Reservation, type TimeSlot } from "@shared/booking";
import type { PatientRecord } from "@shared/reserve";
import { Search, Plus, Calendar, User, Trash2, Bell, X, Phone, CheckCircle2, Circle } from "lucide-react";

const TOKEN_KEY = "asano_admin_token";

// ブラウザのストレージが使えない環境（iPhoneのプライベートモードなど）への対策
function safeGetItem(key: string): string | null {
  try {
    return sessionStorage.getItem(key) || localStorage.getItem(key);
  } catch (e) {
    return null;
  }
}

function safeSetItem(key: string, value: string) {
  try {
    sessionStorage.setItem(key, value);
    localStorage.setItem(key, value);
  } catch (e) {
    // ストレージが使えない場合は何もしない（メモリ内の状態のみで動作）
  }
}

function safeRemoveItem(key: string) {
  try {
    sessionStorage.removeItem(key);
    localStorage.removeItem(key);
  } catch (e) {
    // ignore
  }
}

function authHeaders(): HeadersInit {
  const token = safeGetItem(TOKEN_KEY);
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export default function Admin() {
  const [token, setToken] = useState<string | null>(() => safeGetItem(TOKEN_KEY));
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  const [tab, setTab] = useState<"reservations" | "patients" | "weekly">("weekly");
  const [patients, setPatients] = useState<PatientRecord[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(false);

  const [newId, setNewId] = useState("");
  const [newName, setNewName] = useState("");
  const [newStatus, setNewStatus] = useState<"normal" | "blocked">("normal");

  // 検索・手動予約用
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddReservation, setShowAddReservation] = useState(false);
  const [resDate, setResDate] = useState("");
  const [resTimes, setResTimes] = useState<string[]>([]);
  const [resPatientId, setResPatientId] = useState("");
  const [resPatientName, setResPatientName] = useState("");
  const [resComment, setResComment] = useState("");
  const [isForceBooking, setIsForceBooking] = useState(false);
  const [nameSuggestions, setNameSuggestions] = useState<PatientRecord[]>([]);
  const [idSuggestions, setIdSuggestions] = useState<PatientRecord[]>([]);
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [lastReservationCount, setLastReservationCount] = useState(0);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [pRes, rRes] = await Promise.all([
        fetch("/api/admin/patients", { headers: authHeaders() }),
        fetch("/api/admin/reservations", { headers: authHeaders() }),
      ]);
      if (pRes.status === 401 || rRes.status === 401) {
        safeRemoveItem(TOKEN_KEY);
        setToken(null);
        return;
      }
      const pData = await pRes.json();
      const rData = await rRes.json();
      const newReservations = rData.reservations ?? [];
      
      // 通知チェック (モバイル環境などNotificationがない場合のチェックを追加)
      if (typeof window !== 'undefined' && 'Notification' in window && lastReservationCount > 0 && newReservations.length > lastReservationCount) {
        const latest = newReservations[newReservations.length - 1];
        if (Notification.permission === "granted") {
          new Notification("新しい予約が入りました", {
            body: `${latest.patientName} 様\n${formatDateJa(latest.date)} ${formatTimeRange(latest.time, latest.endTime)}`,
          });
        }
      }
      
      setPatients(pData.patients ?? []);
      setReservations(newReservations);
      setLastReservationCount(newReservations.length);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (token) {
      fetchData();
      const timer = setInterval(fetchData, 10000); // 10秒ごとに自動更新
      return () => clearInterval(timer);
    }
  }, [token, fetchData]);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window && token && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, [token]);

  useEffect(() => {
    if (token && showAddReservation) {
      fetch("/api/reserve/dates?admin=true")
        .then(res => res.json())
        .then(data => setAvailableDates(data.dates));
    }
  }, [token, showAddReservation]);

  useEffect(() => {
    if (token && resDate) {
      fetch(`/api/reserve/slots?date=${resDate}&admin=true`)
        .then(res => res.json())
        .then(data => setAvailableSlots(data.slots));
    }
  }, [token, resDate]);

  // 自動補完・候補表示ロジック
  useEffect(() => {
    if (resPatientId.length > 0) {
      const matches = patients.filter(p => p.id.startsWith(resPatientId));
      setIdSuggestions(matches);
      if (matches.length === 1 && resPatientId === matches[0].id) {
        setResPatientName(matches[0].name);
      }
    } else {
      setIdSuggestions([]);
    }
  }, [resPatientId, patients]);

  useEffect(() => {
    if (resPatientName.length > 0) {
      const matches = patients.filter(p => p.name.includes(resPatientName));
      setNameSuggestions(matches);
      if (matches.length === 1 && resPatientName === matches[0].name) {
        setResPatientId(matches[0].id);
      }
    } else {
      setNameSuggestions([]);
    }
  }, [resPatientName, patients]);

  const filteredReservations = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return reservations;
    return reservations.filter(r => 
      r.patientName.toLowerCase().includes(q) || 
      r.membershipId.includes(q)
    );
  }, [reservations, searchQuery]);

  const handleAddReservation = async (e: FormEvent | null, force = false) => {
    if (e) e.preventDefault();
    if (!resDate || resTimes.length === 0 || !resPatientName) return;
    
    console.log("Submitting reservation:", { resDate, resTimes, resPatientName });
    const res = await fetch("/api/admin/reservations", {
      method: "POST",
      headers: { ...authHeaders(), "Content-Type": "application/json" },
      body: JSON.stringify({
        membershipId: resPatientId || "新規",
        patientName: resPatientName,
        date: resDate,
        times: resTimes, // 複数枠を送信
        comment: resComment,
        force: force
      }),
    });
    
    let data;
    try {
      data = await res.json();
    } catch (e) {
      console.error("Failed to parse JSON response", e);
      alert("サーバーから不正な応答がありました。");
      return;
    }
    if (res.ok) {
      setShowAddReservation(false);
      setResDate("");
      setResTimes([]);
      setResPatientId("");
      setResPatientName("");
      setResComment("");
      setIsForceBooking(false);
      fetchData();
    } else if (data.error === "already_booked") {
      const existing = data.existing;
      if (confirm(`この患者様はすでに予約があります：\n${formatDateJa(existing.date)} ${formatTimeRange(existing.time, existing.endTime)}\n\n現在の予約をキャンセルして、新しい日時に置き換えますか？`)) {
        handleAddReservation(null, true);
      }
    } else {
      alert(data.error || "予約に失敗しました");
    }
  };

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setLoginError("");
    safeSetItem(TOKEN_KEY, password);
    setToken(password);
    try {
      const res = await fetch("/api/admin/patients", {
        headers: { Authorization: `Bearer ${password}` },
      });
      if (res.status === 401) {
        safeRemoveItem(TOKEN_KEY);
        setToken(null);
        setLoginError("パスワードが正しくありません");
        return;
      }
      fetchData();
    } catch (e) {
      setLoginError("ログイン中にエラーが発生しました。");
    }
  };

  const handleLogout = () => {
    safeRemoveItem(TOKEN_KEY);
    setToken(null);
    setPassword("");
  };

  const handleAddPatient = async (e: FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/admin/patients", {
      method: "POST",
      headers: { ...authHeaders(), "Content-Type": "application/json" },
      body: JSON.stringify({ id: newId, name: newName, status: newStatus }),
    });
    if (res.ok) {
      setNewId("");
      setNewName("");
      setNewStatus("normal");
      fetchData();
    }
  };

  const handleDeletePatient = async (id: string) => {
    if (!confirm(`診察券番号 ${id} を削除しますか？`)) return;
    await fetch(`/api/admin/patients/${id}`, { method: "DELETE", headers: authHeaders() });
    fetchData();
  };

  const handleCancelReservation = async (id: string) => {
    if (!confirm("この予約をキャンセルしますか？")) return;
    await fetch(`/api/admin/reservations/${id}`, { method: "DELETE", headers: authHeaders() });
    fetchData();
  };

  const handleToggleArrivalStatus = async (id: string, currentStatus: boolean) => {
    await fetch(`/api/admin/reservations/${id}`, {
      method: "PATCH",
      headers: { ...authHeaders(), "Content-Type": "application/json" },
      body: JSON.stringify({ arrived: !currentStatus }),
    });
    fetchData();
  };

  const handleUpdateComment = async (id: string, currentComment: string) => {
    const newComment = prompt("コメントを入力してください", currentComment);
    if (newComment === null) return;
    
    await fetch(`/api/admin/reservations/${id}`, {
      method: "PATCH",
      headers: { ...authHeaders(), "Content-Type": "application/json" },
      body: JSON.stringify({ comment: newComment }),
    });
    fetchData();
  };

  // 週間カレンダー用：日付ごとに予約を時系列でグループ化
  const weeklySchedule = useMemo(() => {
    const schedule: Record<string, Reservation[]> = {};
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      const iso = d.toISOString().slice(0, 10);
      schedule[iso] = reservations
        .filter(r => r.date === iso)
        .sort((a, b) => a.time.localeCompare(b.time));
    }
    return schedule;
  }, [reservations]);

  if (!token) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center px-5">
        <form onSubmit={handleLogin} className="w-full max-w-sm bg-card p-8 rounded-2xl border border-cream-muted shadow-sm">
          <h1 className="text-xl font-bold text-brand-dark mb-6">医院管理ログイン</h1>
          {loginError && <p className="text-red-600 font-bold mb-4">{loginError}</p>}
          <label className="block text-sm font-bold mb-2">パスワード</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border-2 border-cream-muted rounded-xl px-4 py-3 mb-6"
            autoFocus
          />
          <button type="submit" className="w-full py-3 bg-brand text-white font-bold rounded-xl">
            ログイン
          </button>
          <Link href="/" className="block text-center mt-4 text-brand text-sm">
            トップへ
          </Link>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-slate-900 text-white px-6 py-4 flex flex-wrap items-center justify-between gap-4 sticky top-0 z-50 shadow-md">
        <div className="flex items-center gap-3">
          <div className="bg-brand p-2 rounded-lg">
            <Calendar className="w-6 h-6 text-white" />
          </div>
          <h1 className="font-bold text-xl tracking-tight">あさの歯科 <span className="text-slate-400 font-normal text-sm ml-2">管理システム</span></h1>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">
            サイトを表示
          </Link>
          <div className="h-4 w-px bg-slate-700"></div>
          <button type="button" onClick={handleLogout} className="text-sm font-medium text-slate-300 hover:text-white transition-colors">
            ログアウト
          </button>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div className="flex bg-white p-1 rounded-xl shadow-sm border border-slate-200">
            {(["weekly", "reservations", "patients"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className={`px-6 py-2.5 rounded-lg font-bold text-sm transition-all ${
                  tab === t ? "bg-brand text-white shadow-md" : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {t === "weekly" ? "週間表示" : t === "reservations" ? "予約一覧" : "患者名簿"}
              </button>
            ))}
          </div>

          {tab === "reservations" && (
            <button
              onClick={() => setShowAddReservation(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-sm shadow-sm transition-all hover:scale-105 active:scale-95"
            >
              <Plus className="w-4 h-4" />
              電話・窓口予約を入力
            </button>
          )}
        </div>

        {tab === "weekly" && (
          <section className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm overflow-x-auto">
            <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-brand" />
              週間スケジュール（直近7日間）
            </h2>
            <div className="flex gap-4 pb-4 overflow-x-auto snap-x">
              {Array.from({ length: 7 }).map((_, dayIndex) => {
                const d = new Date();
                d.setDate(d.getDate() + dayIndex);
                const iso = d.toISOString().slice(0, 10);
                const isToday = dayIndex === 0;
                const dayReservations = weeklySchedule[iso] || [];
                const weekdayJa = d.toLocaleDateString('ja-JP', { weekday: 'short' });

                return (
                  <div key={iso} className="min-w-[300px] flex-shrink-0 border border-slate-200 rounded-2xl overflow-hidden bg-white snap-start">
                    {/* 日付ヘッダー */}
                    <div className={`px-4 py-3 ${isToday ? "bg-brand/10 border-b border-brand/20" : "bg-slate-50 border-b border-slate-200"}`}>
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <div className={`text-center ${isToday ? "text-brand" : "text-slate-600"}`}>
                            <p className="text-[10px] font-bold uppercase leading-none">{weekdayJa}</p>
                            <p className={`text-xl font-black ${isToday ? "text-brand" : "text-slate-700"}`}>{d.getDate()}</p>
                          </div>
                          <div>
                            <p className="text-[10px] text-slate-500 leading-none mb-0.5">{d.getFullYear()}年</p>
                            <p className="text-xs font-bold text-slate-700 leading-none">{d.getMonth() + 1}月</p>
                          </div>
                        </div>
                        <span className="px-2 py-0.5 bg-slate-200/50 text-slate-600 rounded-full text-[10px] font-bold">
                          {dayReservations.length}件
                        </span>
                      </div>
                    </div>

                    {/* 予約リスト */}
                    <div className="max-h-[500px] overflow-y-auto">
                      {dayReservations.length === 0 ? (
                        <div className="px-4 py-12 text-center text-slate-400">
                          <p className="text-xs">予約がありません</p>
                        </div>
                      ) : (
                        <div className="divide-y divide-slate-100">
                          {dayReservations.map((reservation) => (
                            <div
                              key={reservation.id}
                              className="px-4 py-3 hover:bg-slate-50 transition-colors group"
                            >
                              <div className="flex items-center justify-between gap-3 mb-2">
                                <p className="text-base font-black text-brand leading-none">{formatTimeRange(reservation.time, reservation.endTime)}</p>
                                <div className="flex items-center gap-2">
                                  {reservation.arrived && (
                                    <span className="text-[10px] font-bold text-emerald-600">来院済み</span>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => handleToggleArrivalStatus(reservation.id, reservation.arrived ?? false)}
                                    className={`w-6 h-6 rounded flex items-center justify-center transition-all ${
                                      reservation.arrived
                                        ? "bg-emerald-500 text-white shadow-sm"
                                        : "bg-slate-200 text-slate-400 hover:bg-slate-300"
                                    }`}
                                    title={reservation.arrived ? "来院済み" : "未来院"}
                                  >
                                    <CheckCircle2 className={`w-4 h-4 ${reservation.arrived ? "block" : "hidden"}`} />
                                    {!reservation.arrived && <div className="w-3 h-3 border-2 border-slate-300 rounded-sm" />}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleCancelReservation(reservation.id)}
                                    className="p-1.5 text-slate-300 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100"
                                    title="予約を削除"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded text-[9px] font-bold flex-shrink-0">
                                  No.{reservation.membershipId}
                                </span>
                                <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold flex-shrink-0 ${
                                  reservation.source === 'admin'
                                    ? 'bg-blue-100 text-blue-700'
                                    : reservation.source === 'web'
                                    ? 'bg-green-100 text-green-700'
                                    : 'bg-slate-100 text-slate-500'
                                }`}>
                                  {getSourceLabel(reservation.source)}
                                </span>
                                <h3 className="font-bold text-sm text-slate-900 truncate">{reservation.patientName}</h3>
                              </div>
                              {reservation.comment && (
                                <p className="text-[10px] text-slate-500 bg-slate-50 p-1.5 rounded mt-1 border border-slate-100">
                                  {reservation.comment}
                                </p>
                              )}
                              <button
                                onClick={() => handleUpdateComment(reservation.id, reservation.comment || "")}
                                className="text-[10px] text-brand hover:underline mt-1 block"
                              >
                                {reservation.comment ? "コメントを編集" : "コメントを追加"}
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {tab === "reservations" && (
          <div className="space-y-6">
            {/* 検索バー */}
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-brand transition-colors" />
              <input
                type="text"
                placeholder="名前または診察券番号（4桁）で予約を検索..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl shadow-sm focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none transition-all text-lg"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery("")}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-100 rounded-full text-slate-400"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* 予約一覧 */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-brand" />
                  予約一覧
                  <span className="ml-2 px-2.5 py-0.5 bg-slate-200 text-slate-600 rounded-full text-xs font-medium">
                    {filteredReservations.length}件
                  </span>
                </h2>
                {loading && <div className="animate-spin rounded-full h-4 w-4 border-2 border-brand border-t-transparent"></div>}
              </div>

              {filteredReservations.length === 0 ? (
                <div className="bg-white border border-dashed border-slate-300 rounded-2xl py-12 text-center">
                  <p className="text-slate-400">該当する予約は見つかりませんでした。</p>
                </div>
              ) : (
                <div className="grid gap-3">
                  {filteredReservations.map((r) => (
                    <div
                      key={r.id}
                      className="bg-white border border-slate-200 rounded-2xl p-4 md:p-5 flex flex-wrap justify-between gap-4 items-center shadow-sm hover:border-brand/30 transition-colors group"
                    >
                      <div className="flex items-center gap-4 flex-1">
                        <div className="bg-slate-50 p-3 rounded-xl text-center min-w-[80px] group-hover:bg-brand/5 transition-colors">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{r.date.split('-')[0]}</p>
                          <p className="text-lg font-black text-slate-800 leading-none my-1">{r.date.split('-').slice(1).join('/')}</p>
                          <p className="text-xs font-bold text-brand">{formatTimeRange(r.time, r.endTime)}</p>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded text-[10px] font-bold">No.{r.membershipId}</span>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              r.source === 'admin'
                                ? 'bg-blue-100 text-blue-700'
                                : r.source === 'web'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-slate-100 text-slate-500'
                            }`}>
                              {getSourceLabel(r.source)}
                            </span>
                            <h3 className="font-bold text-lg text-slate-900">{r.patientName} <span className="text-slate-400 font-normal text-sm">様</span></h3>
                          </div>
                          <p className="text-xs text-slate-400 flex items-center gap-1">
                            <Bell className="w-3 h-3" /> 登録日: {new Date(r.createdAt).toLocaleDateString()}
                          </p>
                          {r.comment && (
                            <div className="mt-2 p-2 bg-emerald-50 border border-emerald-100 rounded-lg">
                              <p className="text-xs text-emerald-800 font-medium leading-relaxed">{r.comment}</p>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        {/* 来院ステータスチェックボックス */}
                        <div className="flex items-center gap-2">
                          {r.arrived && (
                            <span className="text-sm font-bold text-emerald-600">来院済み</span>
                          )}
                          <button
                            type="button"
                            onClick={() => handleToggleArrivalStatus(r.id, r.arrived ?? false)}
                            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                              r.arrived
                                ? "bg-emerald-500 text-white shadow-md shadow-emerald-100"
                                : "bg-slate-200 text-slate-400 hover:bg-slate-300"
                            }`}
                            title={r.arrived ? "来院済み" : "未来院"}
                          >
                            <CheckCircle2 className={`w-5 h-5 ${r.arrived ? "block" : "hidden"}`} />
                            {!r.arrived && <div className="w-4 h-4 border-2 border-slate-300 rounded" />}
                          </button>
                        </div>
                        {/* コメント編集ボタン */}
                        <button
                          type="button"
                          onClick={() => handleUpdateComment(r.id, r.comment || "")}
                          className="text-sm text-brand hover:text-brand-dark font-bold px-4 py-2 rounded-xl hover:bg-brand/5 transition-all"
                        >
                          コメント編集
                        </button>
                        {/* 削除ボタン */}
                        <button
                          type="button"
                          onClick={() => handleCancelReservation(r.id)}
                          className="text-sm text-slate-400 hover:text-red-600 font-bold px-4 py-2 rounded-xl hover:bg-red-50 transition-all flex items-center gap-2"
                        >
                          <Trash2 className="w-4 h-4" />
                          予約取消
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}

        {tab === "patients" && (
          <section className="grid md:grid-cols-3 gap-8">
            <div className="md:col-span-1">
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Plus className="w-5 h-5 text-brand" />
                患者を登録
              </h2>
              <form onSubmit={handleAddPatient} className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-sm">
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">診察券番号 (4桁)</label>
                  <input
                    value={newId}
                    maxLength={4}
                    placeholder="0001"
                    onChange={(e) => setNewId(e.target.value.replace(/\D/g, "").slice(0, 4))}
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 mt-1 focus:ring-2 focus:ring-brand/20 outline-none transition-all"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">氏名</label>
                  <input
                    value={newName}
                    placeholder="山田 太郎"
                    onChange={(e) => setNewName(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 mt-1 focus:ring-2 focus:ring-brand/20 outline-none transition-all"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">ステータス</label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value as "normal" | "blocked")}
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 mt-1 focus:ring-2 focus:ring-brand/20 outline-none transition-all appearance-none bg-no-repeat bg-[right_1rem_center]"
                  >
                    <option value="normal">予約可能</option>
                    <option value="blocked">ブロック中</option>
                  </select>
                </div>
                <button type="submit" className="w-full py-3.5 bg-brand text-white font-bold rounded-xl shadow-lg shadow-brand/20 hover:scale-[1.02] active:scale-[0.98] transition-all">
                  名簿に追加する
                </button>
              </form>
            </div>

            <div className="md:col-span-2">
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                <User className="w-5 h-5 text-brand" />
                登録済み患者一覧
                <span className="ml-2 px-2.5 py-0.5 bg-slate-200 text-slate-600 rounded-full text-xs font-medium">
                  {patients.length}名
                </span>
              </h2>
              <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">No.</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">氏名</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">状態</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {patients.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4 font-mono font-bold text-slate-700">{p.id}</td>
                        <td className="px-6 py-4 font-bold text-slate-900">{p.name}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                            p.status === "blocked" ? "bg-red-100 text-red-600" : "bg-emerald-100 text-emerald-600"
                          }`}>
                            {p.status === "blocked" ? "Blocked" : "Active"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            type="button"
                            onClick={() => handleDeletePatient(p.id)}
                            className="p-2 text-slate-300 hover:text-red-600 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}
      </div>

      {/* 手動予約モーダル */}
      {showAddReservation && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="bg-slate-900 px-6 py-4 flex items-center justify-between">
              <h3 className="text-white font-bold flex items-center gap-2">
                <Phone className="w-4 h-4 text-emerald-400" />
                電話・窓口予約の入力
              </h3>
              <button onClick={() => setShowAddReservation(false)} className="text-slate-400 hover:text-white transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleAddReservation} className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-1 relative">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">診察券番号</label>
                  <input
                    value={resPatientId}
                    maxLength={4}
                    placeholder="0001 (空欄で新規)"
                    onChange={(e) => setResPatientId(e.target.value.replace(/\D/g, ""))}
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 mt-1 focus:ring-2 focus:ring-brand/20 outline-none"
                  />
                  {idSuggestions.length > 0 && resPatientId.length > 0 && !resPatientName && (
                    <div className="absolute z-[110] left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-32 overflow-y-auto">
                      {idSuggestions.map(p => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => {
                            setResPatientId(p.id);
                            setResPatientName(p.name);
                            setIdSuggestions([]);
                          }}
                          className="w-full text-left px-4 py-2 hover:bg-slate-50 text-sm border-b border-slate-50 last:border-0"
                        >
                          <span className="font-mono font-bold text-brand">{p.id}</span>: {p.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div className="col-span-1 relative">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">氏名</label>
                  <input
                    value={resPatientName}
                    placeholder="山田 太郎"
                    onChange={(e) => setResPatientName(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 mt-1 focus:ring-2 focus:ring-brand/20 outline-none"
                    required
                  />
                  {nameSuggestions.length > 0 && resPatientName.length > 0 && !resPatientId && (
                    <div className="absolute z-[110] left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-32 overflow-y-auto">
                      {nameSuggestions.map(p => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => {
                            setResPatientId(p.id);
                            setResPatientName(p.name);
                            setNameSuggestions([]);
                          }}
                          className="w-full text-left px-4 py-2 hover:bg-slate-50 text-sm border-b border-slate-50 last:border-0"
                        >
                          {p.name} <span className="text-[10px] text-slate-400 font-mono">(No.{p.id})</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              {!resPatientId && resPatientName && (
                <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 flex items-center gap-2">
                  <Plus className="w-4 h-4 text-emerald-600" />
                  <p className="text-xs text-emerald-700 font-bold">新規患者として登録されます</p>
                </div>
              )}
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">予約日</label>
                <select
                  value={resDate}
                  onChange={(e) => {
                    setResDate(e.target.value);
                    setResTimes([]); // 日付変更時に時間をリセット
                  }}
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 mt-1 focus:ring-2 focus:ring-brand/20 outline-none"
                  required
                >
                  <option value="">日付を選択してください</option>
                  {availableDates.map(d => (
                    <option key={d} value={d}>{formatDateJa(d)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">予約時間</label>
                <div className="grid grid-cols-3 gap-2 mt-1 max-h-40 overflow-y-auto p-1">
                  {availableSlots.length === 0 ? (
                    <p className="col-span-3 text-xs text-slate-400 text-center py-2">日付を選択してください</p>
                  ) : (
                    availableSlots.map(slot => (
                        <button
                          key={slot.time}
                          type="button"
                          disabled={!slot.available}
                          onClick={() => {
                            setResTimes(prev => {
                              if (prev.includes(slot.time)) {
                                return prev.filter(t => t !== slot.time);
                              } else {
                                return [...prev, slot.time].sort();
                              }
                            });
                          }}
                          className={`py-2 rounded-lg text-[10px] font-bold border transition-all ${
                            !slot.available 
                              ? "bg-slate-50 text-slate-300 border-slate-100 line-through" 
                              : resTimes.includes(slot.time)
                                ? "bg-brand text-white border-brand shadow-md"
                                : "bg-white text-slate-600 border-slate-200 hover:border-brand"
                          }`}
                        >
                          {formatTimeRange(slot.time)}
                        </button>
                    ))
                  )}
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">コメント</label>
                <textarea
                  value={resComment}
                  placeholder="例：インプラント、ホワイトニングなど"
                  onChange={(e) => setResComment(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 mt-1 focus:ring-2 focus:ring-brand/20 outline-none resize-none h-20"
                />
              </div>
              <button type="submit" className="w-full py-4 bg-emerald-600 text-white font-bold rounded-2xl shadow-lg shadow-emerald-200 hover:bg-emerald-700 transition-all mt-2">
                予約を確定する
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
