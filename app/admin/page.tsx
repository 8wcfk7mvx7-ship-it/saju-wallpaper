"use client";
import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

interface PromptItem {
  key: string;
  label: string;
  category: "wallpaper" | "report";
  description: string;
  defaultValue: string;
  currentValue: string;
  isCustomized: boolean;
  updatedAt: string | null;
}

interface Payment {
  id: number;
  order_id: string;
  amount: number;
  product_name: string;
  customer_name: string;
  customer_email: string | null;
  status: string;
  created_at: string;
}

interface KakaoUser {
  id: number;
  nickname: string;
  profile_image: string | null;
  email: string | null;
  created_at: string;
  last_login: string;
}

interface Stats {
  dbConnected: boolean;
  dbDiagnostics: { table: string; error: string }[];
  todayViews: number;
  totalViews: number;
  todayRevenue: number;
  thisMonthRevenue: number;
  prevMonthRevenue: number;
  totalRevenue: number;
  totalPaidCount: number;
  conversionRate: string;
  avgOrderValue: number;
  distinctCustomerCount: number;
  repeatCustomerCount: number;
  repeatRate: string;
  payments: Payment[];
  dailyViews: { date: string; count: number }[];
  dailyRevenue: { date: string; amount: number }[];
  hourlyViews: number[];
  topPages: { page: string; count: number }[];
  productRevenue: { name: string; count: number; revenue: number }[];
  kakaoUsers: KakaoUser[];
  kakaoTodayCount: number;
  kakaoTotalCount: number;
  blueberryPayments: { amount: number; product_name: string; created_at: string }[];
  blueberryRevenue: number;
  topQuestions: { question: string; count: number }[];
  shareLinkToday: number;
  shareLinkTotal: number;
  saveImageToday: number;
  saveImageTotal: number;
}

const TABS = [
  { id: "dashboard", label: "대시보드", color: "bg-sky-600" },
  { id: "revenue",   label: "매출 분석", color: "bg-emerald-600" },
  { id: "traffic",   label: "트래픽",    color: "bg-violet-600" },
  { id: "users",     label: "고객 관리", color: "bg-pink-600" },
  { id: "prompts",   label: "AI 프롬프트", color: "bg-indigo-600" },
  { id: "notice",    label: "공지사항",  color: "bg-orange-600" },
  { id: "preview",   label: "미리보기",  color: "bg-teal-600" },
] as const;
type Tab = typeof TABS[number]["id"];

function KpiCard({ label, value, sub, color }: { label: string; value: string; sub?: string; color: string }) {
  return (
    <div className={`rounded-2xl p-5 border`} style={{ background: `${color}18`, border: `1px solid ${color}35` }}>
      <p className="text-xs font-semibold mb-1" style={{ color }}>{label}</p>
      <p className="text-2xl font-black text-white leading-none">{value}</p>
      {sub && <p className="text-xs mt-1.5" style={{ color: "rgba(255,255,255,0.35)" }}>{sub}</p>}
    </div>
  );
}

function MiniBarChart({ data, colorFn, labelFn, valueFn }: {
  data: { label: string; value: number }[];
  colorFn?: (v: number, max: number) => string;
  labelFn?: (l: string) => string;
  valueFn?: (v: number) => string;
}) {
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <div className="flex items-end gap-1 h-20">
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1">
          <span className="text-[9px]" style={{ color: "rgba(255,255,255,0.3)" }}>
            {valueFn ? valueFn(d.value) : d.value > 0 ? d.value : ""}
          </span>
          <div className="w-full rounded-t-sm transition-all" style={{
            height: `${Math.max((d.value / max) * 60, d.value > 0 ? 4 : 0)}px`,
            background: colorFn ? colorFn(d.value, max) : "rgba(99,102,241,0.7)",
            minHeight: d.value > 0 ? 4 : 0,
          }} />
          <span className="text-[8px] text-gray-600">{labelFn ? labelFn(d.label) : d.label}</span>
        </div>
      ))}
    </div>
  );
}

export default function AdminPage() {
  const [password, setPassword] = useState("");
  const [authed, setAuthed] = useState(false);
  const [authError, setAuthError] = useState("");
  const [prompts, setPrompts] = useState<PromptItem[]>([]);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [saving, setSaving] = useState<string | null>(null);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");
  const [dbConnected, setDbConnected] = useState(false);
  const [noticeText, setNoticeText] = useState("");
  const [noticeEditMode, setNoticeEditMode] = useState(false);
  const [noticeSaving, setNoticeSaving] = useState(false);
  const [stats, setStats] = useState<Stats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [paymentSearch, setPaymentSearch] = useState("");
  const [previewYear, setPreviewYear] = useState("1990");
  const [previewMonth, setPreviewMonth] = useState("5");
  const [previewDay, setPreviewDay] = useState("15");
  const [previewHour, setPreviewHour] = useState("10");
  const [previewName, setPreviewName] = useState("테스트");
  const [previewGender, setPreviewGender] = useState("female");
  const router = useRouter();

  const storedPw = typeof window !== "undefined" ? sessionStorage.getItem("adminPw") : null;

  useEffect(() => {
    if (storedPw) { setPassword(storedPw); fetchPrompts(storedPw); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function fetchPrompts(pw: string) {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/prompts", { headers: { "x-admin-password": pw } });
      if (res.status === 401) { setAuthError("비밀번호가 틀렸습니다."); sessionStorage.removeItem("adminPw"); setAuthed(false); return; }
      const data = await res.json();
      setPrompts(data.prompts || []);
      setDbConnected(!!data.dbConnected);
      setAuthed(true);
      sessionStorage.setItem("adminPw", pw);
      localStorage.setItem("sp_admin", "true");
      setAuthError("");
    } catch { setAuthError("서버 오류가 발생했습니다."); }
    finally { setLoading(false); }
  }

  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const res = await fetch("/api/admin/stats", { headers: { "x-admin-password": password } });
      const data = await res.json();
      setStats(data);
    } catch {}
    finally { setStatsLoading(false); }
  }, [password]);

  useEffect(() => {
    if (authed && (activeTab === "dashboard" || activeTab === "revenue" || activeTab === "traffic" || activeTab === "users")) {
      fetchStats();
    }
  }, [authed, activeTab, fetchStats]);

  async function savePrompt(key: string) {
    setSaving(key);
    try {
      const res = await fetch("/api/admin/prompts", { method: "POST", headers: { "Content-Type": "application/json", "x-admin-password": password }, body: JSON.stringify({ key, value: editValue }) });
      if (!res.ok) throw new Error("저장 실패");
      setPrompts(prev => prev.map(p => p.key === key ? { ...p, currentValue: editValue, isCustomized: true, updatedAt: new Date().toISOString() } : p));
      setEditingKey(null);
      setSavedMsg(`✅ '${prompts.find(p => p.key === key)?.label}' 저장 완료`);
      setTimeout(() => setSavedMsg(null), 3000);
    } catch { alert("저장에 실패했습니다."); }
    finally { setSaving(null); }
  }

  async function resetToDefault(key: string) {
    if (!confirm("기본값으로 초기화하시겠습니까?")) return;
    setSaving(key);
    try {
      await fetch("/api/admin/prompts", { method: "DELETE", headers: { "Content-Type": "application/json", "x-admin-password": password }, body: JSON.stringify({ key }) });
      const defaultVal = prompts.find(p => p.key === key)?.defaultValue || "";
      setPrompts(prev => prev.map(p => p.key === key ? { ...p, currentValue: defaultVal, isCustomized: false, updatedAt: null } : p));
      if (editingKey === key) { setEditingKey(null); setEditValue(""); }
      setSavedMsg(`↩️ '${prompts.find(p => p.key === key)?.label}' 기본값으로 초기화`);
      setTimeout(() => setSavedMsg(null), 3000);
    } catch { alert("초기화에 실패했습니다."); }
    finally { setSaving(null); }
  }

  function activatePreview(target: "result" | "report" | "stock" | "charm" | "generating") {
    sessionStorage.setItem("paymentDone", "true");
    sessionStorage.setItem("sajuForm", JSON.stringify({ name: previewName, gender: previewGender, birthYear: parseInt(previewYear), birthMonth: parseInt(previewMonth), birthDay: parseInt(previewDay), birthHour: parseInt(previewHour), birthMinute: 0, birthHourUnknown: false, birthPlace: "서울", style: "auto", productType: "report", useJajasi: false, lang: "ko" }));
    if (target === "generating") router.push("/generating?type=report");
    else if (target === "stock") router.push("/service/stock");
    else if (target === "charm") router.push("/service/charm");
    else if (target === "result") router.push("/loading");
    else if (target === "report") router.push("/report");
  }

  if (!authed) {
    return (
      <div className="min-h-screen bg-[#0a0a14] flex items-center justify-center px-4">
        <form onSubmit={e => { e.preventDefault(); fetchPrompts(password); }} className="w-full max-w-sm">
          <div className="text-center mb-8">
            <p className="text-3xl mb-2">🔐</p>
            <h1 className="text-xl font-bold text-white">관리자 페이지</h1>
            <p className="text-gray-500 text-sm mt-1">Summer Palace 운영 대시보드</p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
            <div>
              <label className="block text-xs text-gray-400 mb-1">비밀번호</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                placeholder="관리자 비밀번호" autoFocus
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors" />
            </div>
            {authError && <p className="text-red-400 text-sm text-center">{authError}</p>}
            <button type="submit" disabled={!password || loading}
              className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-medium text-sm transition-colors disabled:opacity-50">
              {loading ? "확인 중..." : "로그인"}
            </button>
          </div>
        </form>
      </div>
    );
  }

  const filteredPayments = (stats?.payments ?? []).filter(p =>
    !paymentSearch || p.customer_name?.includes(paymentSearch) || p.customer_email?.includes(paymentSearch) || p.product_name?.includes(paymentSearch) || p.order_id?.includes(paymentSearch)
  );

  const revenueGrowth = stats?.prevMonthRevenue && stats.prevMonthRevenue > 0
    ? (((stats.thisMonthRevenue - stats.prevMonthRevenue) / stats.prevMonthRevenue) * 100).toFixed(1)
    : null;

  return (
    <div className="min-h-screen bg-[#0a0a14] text-white">
      {/* 헤더 */}
      <div className="border-b border-white/10 px-4 py-3 flex items-center justify-between sticky top-0 z-30" style={{ background: "rgba(10,10,20,0.95)", backdropFilter: "blur(12px)" }}>
        <div className="flex items-center gap-3">
          <span className="text-base font-black text-white">Summer Palace</span>
          <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(99,102,241,0.2)", color: "#818cf8" }}>ADMIN</span>
          {dbConnected
            ? <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400">DB 연결됨</span>
            : <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/20 text-red-400">DB 미연결</span>}
        </div>
        <button onClick={() => { setAuthed(false); sessionStorage.removeItem("adminPw"); localStorage.removeItem("sp_admin"); }}
          className="text-xs text-gray-500 hover:text-gray-300 transition-colors">로그아웃</button>
      </div>

      {savedMsg && (
        <div className="fixed top-14 left-1/2 -translate-x-1/2 z-50 bg-indigo-600 text-white text-sm px-4 py-2 rounded-xl shadow-lg whitespace-nowrap">{savedMsg}</div>
      )}

      {/* 탭 */}
      <div className="sticky top-12 z-20 border-b border-white/8 px-4 overflow-x-auto scrollbar-none" style={{ background: "rgba(10,10,20,0.97)" }}>
        <div className="flex gap-0.5 py-2" style={{ minWidth: "max-content" }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${activeTab === t.id ? t.color + " text-white" : "text-gray-500 hover:text-gray-300 hover:bg-white/5"}`}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">

        {/* ── 대시보드 ── */}
        {activeTab === "dashboard" && (
          <>
            <div className="flex items-center justify-between">
              <h2 className="text-base font-black text-white">운영 현황</h2>
              <button onClick={fetchStats} disabled={statsLoading} className="text-xs text-sky-400 hover:text-sky-300 transition disabled:opacity-50">
                {statsLoading ? "로딩 중..." : "↻ 새로고침"}
              </button>
            </div>

            {/* DB 진단 — 특정 테이블 조회가 실패하면 원인을 바로 보여줌 */}
            {!statsLoading && (stats?.dbDiagnostics ?? []).length > 0 && (
              <div className="rounded-2xl p-4 space-y-2" style={{ background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.25)" }}>
                <p className="text-xs font-bold text-red-400">⚠ 일부 데이터를 불러오지 못했어요</p>
                {(stats?.dbDiagnostics ?? []).map((d, i) => (
                  <p key={i} className="text-[11px] text-gray-400">
                    <span className="font-mono text-red-300">{d.table}</span> 테이블 조회 오류 — {d.error}
                  </p>
                ))}
                <p className="text-[11px] text-gray-500">테이블이 아직 없다면 &apos;트래픽&apos; 탭 하단의 Supabase SQL을 실행해주세요.</p>
              </div>
            )}

            {/* KPI 8개 */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <KpiCard label="오늘 방문자" value={statsLoading ? "—" : (stats?.todayViews ?? 0).toLocaleString()} sub="페이지 뷰 기준" color="#38bdf8" />
              <KpiCard label="누적 방문자" value={statsLoading ? "—" : (stats?.totalViews ?? 0).toLocaleString()} color="#818cf8" />
              <KpiCard label="오늘 매출" value={statsLoading ? "—" : `₩${(stats?.todayRevenue ?? 0).toLocaleString()}`} color="#34d399" />
              <KpiCard label="이번 달 매출" value={statsLoading ? "—" : `₩${(stats?.thisMonthRevenue ?? 0).toLocaleString()}`}
                sub={revenueGrowth ? `전월 대비 ${revenueGrowth}%` : undefined} color="#4ade80" />
              <KpiCard label="누적 매출" value={statsLoading ? "—" : `₩${(stats?.totalRevenue ?? 0).toLocaleString()}`} color="#fbbf24" />
              <KpiCard label="결제 전환율" value={statsLoading ? "—" : `${stats?.conversionRate ?? 0}%`}
                sub={`총 ${(stats?.totalPaidCount ?? 0).toLocaleString()}건 결제`} color="#f472b6" />
              <KpiCard label="평균 결제 금액" value={statsLoading ? "—" : `₩${(stats?.avgOrderValue ?? 0).toLocaleString()}`} color="#22d3ee" />
              <KpiCard label="재구매 고객 비율" value={statsLoading ? "—" : `${stats?.repeatRate ?? 0}%`}
                sub={`최근 결제 고객 ${(stats?.distinctCustomerCount ?? 0)}명 중 ${(stats?.repeatCustomerCount ?? 0)}명`} color="#a78bfa" />
            </div>

            {/* 7일 방문 + 매출 차트 */}
            {stats?.dailyViews && stats.dailyViews.length > 0 && (
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-2xl p-4" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                  <p className="text-xs font-bold text-gray-400 mb-3">7일 방문자 추이</p>
                  <MiniBarChart
                    data={stats.dailyViews.map(d => ({ label: d.date.slice(5), value: d.count }))}
                    colorFn={() => "rgba(56,189,248,0.7)"}
                  />
                </div>
                <div className="rounded-2xl p-4" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                  <p className="text-xs font-bold text-gray-400 mb-3">7일 매출 추이</p>
                  <MiniBarChart
                    data={stats.dailyRevenue.map(d => ({ label: d.date.slice(5), value: d.amount }))}
                    colorFn={() => "rgba(52,211,153,0.7)"}
                    valueFn={v => v > 0 ? `₩${(v / 1000).toFixed(0)}k` : ""}
                  />
                </div>
              </div>
            )}

            {/* 카카오 유저 + 별조각 요약 */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl p-4" style={{ background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.2)" }}>
                <p className="text-xs text-yellow-400 font-bold mb-1">카카오 가입자</p>
                <p className="text-2xl font-black text-white">{statsLoading ? "—" : (stats?.kakaoTotalCount ?? 0).toLocaleString()}</p>
                <p className="text-xs text-gray-500 mt-1">오늘 +{stats?.kakaoTodayCount ?? 0}명</p>
              </div>
              <div className="rounded-2xl p-4" style={{ background: "rgba(139,92,246,0.08)", border: "1px solid rgba(139,92,246,0.2)" }}>
                <p className="text-xs text-violet-400 font-bold mb-1">별조각 충전 매출</p>
                <p className="text-2xl font-black text-white">₩{statsLoading ? "—" : (stats?.blueberryRevenue ?? 0).toLocaleString()}</p>
                <p className="text-xs text-gray-500 mt-1">{(stats?.blueberryPayments ?? []).length}건</p>
              </div>
            </div>

            {/* 친구 공유 + 이미지 저장 */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl p-4" style={{ background: "rgba(56,189,248,0.08)", border: "1px solid rgba(56,189,248,0.2)" }}>
                <p className="text-xs text-sky-400 font-bold mb-1">친구에게 공유</p>
                <p className="text-2xl font-black text-white">{statsLoading ? "—" : (stats?.shareLinkTotal ?? 0).toLocaleString()}</p>
                <p className="text-xs text-gray-500 mt-1">오늘 +{stats?.shareLinkToday ?? 0}회</p>
              </div>
              <div className="rounded-2xl p-4" style={{ background: "rgba(52,211,153,0.08)", border: "1px solid rgba(52,211,153,0.2)" }}>
                <p className="text-xs text-emerald-400 font-bold mb-1">이미지로 저장</p>
                <p className="text-2xl font-black text-white">{statsLoading ? "—" : (stats?.saveImageTotal ?? 0).toLocaleString()}</p>
                <p className="text-xs text-gray-500 mt-1">오늘 +{stats?.saveImageToday ?? 0}회</p>
              </div>
            </div>

            {/* 최근 결제 5건 */}
            <div>
              <p className="text-xs font-bold text-gray-400 mb-3">최근 결제</p>
              <div className="space-y-2">
                {(stats?.payments ?? []).slice(0, 5).map(p => (
                  <div key={p.id} className="flex items-center justify-between px-4 py-3 rounded-xl" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                    <div>
                      <span className="text-sm font-semibold text-white">{p.product_name}</span>
                      <span className="text-xs text-gray-500 ml-2">{p.customer_name}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-black text-emerald-400">₩{p.amount.toLocaleString()}</p>
                      <p className="text-[10px] text-gray-600">{new Date(p.created_at).toLocaleString("ko-KR", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" })}</p>
                    </div>
                  </div>
                ))}
                {(stats?.payments ?? []).length === 0 && <p className="text-xs text-gray-600 text-center py-4">결제 내역 없음</p>}
              </div>
            </div>
          </>
        )}

        {/* ── 매출 분석 ── */}
        {activeTab === "revenue" && (
          <>
            <div className="flex items-center justify-between">
              <h2 className="text-base font-black text-white">매출 분석</h2>
              <button onClick={fetchStats} disabled={statsLoading} className="text-xs text-emerald-400 hover:text-emerald-300 transition disabled:opacity-50">{statsLoading ? "로딩 중..." : "↻ 새로고침"}</button>
            </div>

            {/* 상품별 매출 */}
            <div className="rounded-2xl p-5" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
              <p className="text-xs font-bold text-gray-400 mb-4">상품별 매출 (최근 30일)</p>
              {(stats?.productRevenue ?? []).length === 0
                ? <p className="text-xs text-gray-600 text-center py-4">데이터 없음</p>
                : (stats?.productRevenue ?? []).map((p, i) => {
                    const max = (stats?.productRevenue ?? [])[0]?.revenue || 1;
                    return (
                      <div key={i} className="mb-3">
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-gray-300 truncate max-w-[60%]">{p.name}</span>
                          <span className="text-emerald-400 font-bold shrink-0">₩{p.revenue.toLocaleString()} ({p.count}건)</span>
                        </div>
                        <div className="h-2 rounded-full" style={{ background: "rgba(255,255,255,0.06)" }}>
                          <div className="h-2 rounded-full transition-all" style={{ width: `${(p.revenue / max) * 100}%`, background: "rgba(52,211,153,0.8)" }} />
                        </div>
                      </div>
                    );
                  })}
            </div>

            {/* 전체 결제 내역 (검색 포함) */}
            <div>
              <div className="flex items-center gap-3 mb-3">
                <p className="text-xs font-bold text-gray-400">전체 결제 내역</p>
                <input value={paymentSearch} onChange={e => setPaymentSearch(e.target.value)}
                  placeholder="이름 / 이메일 / 상품 검색"
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500 transition" />
              </div>
              <div className="space-y-2">
                {filteredPayments.map(p => (
                  <div key={p.id} className="rounded-xl p-4" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="text-sm font-semibold text-white">{p.product_name}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400">{p.status}</span>
                        </div>
                        <p className="text-xs text-gray-400">{p.customer_name}{p.customer_email && ` · ${p.customer_email}`}</p>
                        <p className="text-[10px] text-gray-600 font-mono mt-0.5">{p.order_id}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-base font-black text-emerald-300">₩{p.amount.toLocaleString()}</p>
                        <p className="text-xs text-gray-600">{new Date(p.created_at).toLocaleString("ko-KR", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" })}</p>
                      </div>
                    </div>
                  </div>
                ))}
                {filteredPayments.length === 0 && <p className="text-xs text-gray-600 text-center py-6">결제 내역 없음</p>}
              </div>
            </div>
          </>
        )}

        {/* ── 트래픽 ── */}
        {activeTab === "traffic" && (
          <>
            <div className="flex items-center justify-between">
              <h2 className="text-base font-black text-white">트래픽 분석</h2>
              <button onClick={fetchStats} disabled={statsLoading} className="text-xs text-violet-400 hover:text-violet-300 transition disabled:opacity-50">{statsLoading ? "로딩 중..." : "↻ 새로고침"}</button>
            </div>

            {/* 시간대별 방문 */}
            {stats?.hourlyViews && (
              <div className="rounded-2xl p-5" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                <p className="text-xs font-bold text-gray-400 mb-4">오늘 시간대별 방문 (0시~23시)</p>
                <div className="flex items-end gap-0.5 h-24">
                  {stats.hourlyViews.map((v, h) => {
                    const max = Math.max(...stats.hourlyViews, 1);
                    return (
                      <div key={h} className="flex-1 flex flex-col items-center gap-0.5 group relative">
                        <div className="w-full rounded-t-sm" style={{ height: `${Math.max((v / max) * 72, v > 0 ? 4 : 0)}px`, background: v > 0 ? "rgba(139,92,246,0.75)" : "rgba(255,255,255,0.04)", transition: "background 0.2s" }} />
                        <span className="text-[8px] text-gray-600">{h}</span>
                        {v > 0 && <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-[9px] px-1 py-0.5 rounded opacity-0 group-hover:opacity-100 transition whitespace-nowrap z-10">{v}</div>}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 인기 페이지 */}
            <div className="rounded-2xl p-5" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
              <p className="text-xs font-bold text-gray-400 mb-4">인기 페이지 TOP 10 (최근 7일)</p>
              {(stats?.topPages ?? []).length === 0
                ? <p className="text-xs text-gray-600 text-center py-4">데이터 없음</p>
                : (stats?.topPages ?? []).map((p, i) => {
                    const max = (stats?.topPages ?? [])[0]?.count || 1;
                    return (
                      <div key={i} className="mb-2.5">
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-gray-300 font-mono">{p.page}</span>
                          <span className="text-violet-400 font-bold">{p.count.toLocaleString()}회</span>
                        </div>
                        <div className="h-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.06)" }}>
                          <div className="h-1.5 rounded-full" style={{ width: `${(p.count / max) * 100}%`, background: "rgba(139,92,246,0.7)" }} />
                        </div>
                      </div>
                    );
                  })}
            </div>

            {/* 월령도사 인기 질문 (익명화·정규화 집계) */}
            <div className="rounded-2xl p-5" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
              <p className="text-xs font-bold text-gray-400 mb-1">월령도사 인기 질문 TOP 20</p>
              <p className="text-[10px] text-gray-600 mb-4">숫자·구두점을 제거한 정규화 문구별 누적 횟수 (원문은 저장하지 않음)</p>
              {(stats?.topQuestions ?? []).length === 0
                ? <p className="text-xs text-gray-600 text-center py-4">데이터 없음</p>
                : (stats?.topQuestions ?? []).map((q, i) => {
                    const max = (stats?.topQuestions ?? [])[0]?.count || 1;
                    return (
                      <div key={i} className="mb-2.5">
                        <div className="flex justify-between text-xs mb-1 gap-2">
                          <span className="text-gray-300 truncate">{q.question}</span>
                          <span className="text-violet-400 font-bold shrink-0">{q.count.toLocaleString()}회</span>
                        </div>
                        <div className="h-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.06)" }}>
                          <div className="h-1.5 rounded-full" style={{ width: `${(q.count / max) * 100}%`, background: "rgba(139,92,246,0.7)" }} />
                        </div>
                      </div>
                    );
                  })}
            </div>

            {/* DB SQL 안내 */}
            <div className="rounded-xl p-4" style={{ background: "rgba(251,191,36,0.07)", border: "1px solid rgba(251,191,36,0.18)" }}>
              <p className="text-xs text-yellow-400 font-bold mb-2">Supabase 테이블 설정 (초기 1회)</p>
              <pre className="text-[10px] text-gray-500 overflow-x-auto whitespace-pre-wrap leading-relaxed">{`create table if not exists page_views (
  id bigint generated always as identity primary key,
  page text not null default '/',
  created_at timestamptz default now()
);
create table if not exists payments (
  id bigint generated always as identity primary key,
  order_id text unique not null,
  amount integer not null,
  product_name text not null,
  customer_name text,
  customer_email text,
  payment_key text,
  status text default 'paid',
  created_at timestamptz default now()
);
create table if not exists kakao_users (
  id bigint generated always as identity primary key,
  kakao_id text unique not null,
  nickname text,
  profile_image text,
  email text,
  last_login timestamptz default now(),
  created_at timestamptz default now()
);
create table if not exists chat_questions (
  question_norm text primary key,
  count integer not null default 1,
  updated_at timestamptz default now()
);
create table if not exists saju_trait_events (
  id bigint generated always as identity primary key,
  trait_key text not null,
  page text not null default '/',
  created_at timestamptz default now()
);`}</pre>
            </div>
          </>
        )}

        {/* ── 고객 관리 ── */}
        {activeTab === "users" && (
          <>
            <div className="flex items-center justify-between">
              <h2 className="text-base font-black text-white">고객 관리</h2>
              <button onClick={fetchStats} disabled={statsLoading} className="text-xs text-pink-400 hover:text-pink-300 transition disabled:opacity-50">{statsLoading ? "로딩 중..." : "↻ 새로고침"}</button>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <KpiCard label="총 가입자" value={(stats?.kakaoTotalCount ?? 0).toLocaleString()} sub="카카오 로그인" color="#f472b6" />
              <KpiCard label="오늘 신규" value={(stats?.kakaoTodayCount ?? 0).toLocaleString()} color="#fb7185" />
              <KpiCard label="결제 고객" value={(stats?.totalPaidCount ?? 0).toLocaleString()} color="#c084fc" />
            </div>

            <div className="rounded-2xl p-5" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
              <p className="text-xs font-bold text-gray-400 mb-4">카카오 가입자 목록 (최신 50명)</p>
              {(stats?.kakaoUsers ?? []).length === 0
                ? <p className="text-xs text-gray-600 text-center py-4">가입자 없음 또는 DB 미연결</p>
                : (stats?.kakaoUsers ?? []).map(u => (
                    <div key={u.id} className="flex items-center gap-3 py-2.5 border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
                      {u.profile_image
                        ? <img src={u.profile_image} alt="" className="w-8 h-8 rounded-full shrink-0 object-cover" />
                        : <div className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-xs font-bold" style={{ background: "rgba(244,114,182,0.2)", color: "#f472b6" }}>{u.nickname?.[0] ?? "?"}</div>
                      }
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-white truncate">{u.nickname || "이름 없음"}</p>
                        <p className="text-xs text-gray-500 truncate">{u.email || "이메일 없음"}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-[10px] text-gray-500">가입 {new Date(u.created_at).toLocaleDateString("ko-KR")}</p>
                        <p className="text-[10px] text-gray-600">최근 {new Date(u.last_login).toLocaleDateString("ko-KR")}</p>
                      </div>
                    </div>
                  ))}
            </div>

            {/* 별조각 충전 내역 */}
            <div className="rounded-2xl p-5" style={{ background: "rgba(139,92,246,0.05)", border: "1px solid rgba(139,92,246,0.15)" }}>
              <div className="flex items-center justify-between mb-4">
                <p className="text-xs font-bold text-violet-400">별조각 충전 내역</p>
                <span className="text-xs font-black text-violet-300">총 ₩{(stats?.blueberryRevenue ?? 0).toLocaleString()}</span>
              </div>
              {(stats?.blueberryPayments ?? []).length === 0
                ? <p className="text-xs text-gray-600 text-center py-3">충전 내역 없음</p>
                : (stats?.blueberryPayments ?? []).slice(0, 20).map((p, i) => (
                    <div key={i} className="flex justify-between items-center py-2 border-b" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
                      <span className="text-xs text-gray-400">{p.product_name}</span>
                      <div className="text-right">
                        <span className="text-xs font-bold text-violet-300">₩{p.amount.toLocaleString()}</span>
                        <span className="text-[10px] text-gray-600 ml-2">{new Date(p.created_at).toLocaleDateString("ko-KR")}</span>
                      </div>
                    </div>
                  ))}
            </div>
          </>
        )}

        {/* ── AI 프롬프트 ── */}
        {activeTab === "prompts" && (
          <>
            <div className="rounded-xl p-4 mb-2" style={{ background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.2)" }}>
              <p className="text-xs text-indigo-300 leading-relaxed">여기서 수정한 프롬프트는 <strong>다음 AI 생성부터 즉시 반영</strong>됩니다. 배경화면(DALL-E)과 보고서(Claude) 프롬프트를 각각 관리합니다.</p>
            </div>

            <div className="flex gap-2 mb-4">
              {(["wallpaper", "report"] as const).map(cat => (
                <button key={cat} onClick={() => {}}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold bg-indigo-600/30 text-indigo-300">
                  {cat === "wallpaper" ? "🖼 배경화면 프롬프트" : "📄 보고서 프롬프트"}
                </button>
              ))}
            </div>

            <div className="space-y-4">
              {prompts.map(p => {
                const isEditing = editingKey === p.key;
                return (
                  <div key={p.key} className="rounded-2xl border" style={{ background: isEditing ? "rgba(99,102,241,0.05)" : "rgba(255,255,255,0.03)", borderColor: isEditing ? "rgba(99,102,241,0.5)" : p.isCustomized ? "rgba(52,211,153,0.3)" : "rgba(255,255,255,0.1)" }}>
                    <div className="p-4 flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-semibold text-white">{p.label}</span>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full ${p.isCustomized ? "bg-emerald-500/20 text-emerald-400" : "bg-white/10 text-gray-500"}`}>{p.isCustomized ? "커스텀" : "기본값"}</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">{p.description}</p>
                        {p.isCustomized && p.updatedAt && <p className="text-[10px] text-gray-600 mt-0.5">수정: {new Date(p.updatedAt).toLocaleString("ko-KR")}</p>}
                      </div>
                      <div className="flex gap-2 shrink-0">
                        {!isEditing && <button onClick={() => { setEditingKey(p.key); setEditValue(p.currentValue); }} className="text-xs px-3 py-1.5 rounded-lg bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 transition-colors">수정</button>}
                        {p.isCustomized && !isEditing && <button onClick={() => resetToDefault(p.key)} disabled={saving === p.key} className="text-xs px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 transition-colors disabled:opacity-50">초기화</button>}
                      </div>
                    </div>
                    {!isEditing && <div className="px-4 pb-4"><div className="rounded-xl p-3" style={{ background: "rgba(0,0,0,0.3)" }}><p className="text-xs text-gray-400 whitespace-pre-wrap leading-relaxed line-clamp-3">{p.currentValue}</p></div></div>}
                    {isEditing && (
                      <div className="px-4 pb-4 space-y-3">
                        <textarea value={editValue} onChange={e => setEditValue(e.target.value)} rows={8} autoFocus
                          className="w-full rounded-xl px-4 py-3 text-sm text-gray-200 leading-relaxed focus:outline-none resize-y font-mono"
                          style={{ background: "rgba(0,0,0,0.4)", border: "1px solid rgba(99,102,241,0.4)" }} />
                        <details>
                          <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-400">기본값 보기</summary>
                          <div className="mt-2 rounded-xl p-3" style={{ background: "rgba(0,0,0,0.2)" }}>
                            <p className="text-xs text-gray-600 whitespace-pre-wrap leading-relaxed">{p.defaultValue}</p>
                            <button onClick={() => setEditValue(p.defaultValue)} className="mt-2 text-xs text-indigo-400 hover:text-indigo-300">↺ 기본값으로 채우기</button>
                          </div>
                        </details>
                        <div className="flex gap-2">
                          <button onClick={() => savePrompt(p.key)} disabled={saving === p.key || !editValue.trim()}
                            className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-medium text-sm transition disabled:opacity-50 flex items-center justify-center gap-2">
                            {saving === p.key ? <><span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />저장 중...</> : "💾 저장"}
                          </button>
                          <button onClick={() => setEditingKey(null)} className="px-4 py-2.5 rounded-xl text-sm text-gray-400 transition" style={{ background: "rgba(255,255,255,0.05)" }}>취소</button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* ── 공지사항 ── */}
        {activeTab === "notice" && (
          <div className="space-y-5">
            <div className="rounded-xl p-4" style={{ background: "rgba(249,115,22,0.08)", border: "1px solid rgba(249,115,22,0.2)" }}>
              <p className="text-xs text-orange-300 leading-relaxed">여기서 입력한 내용이 메인 페이지 상단 공지 티커에 표시됩니다. 각 줄이 하나의 공지 항목입니다.</p>
            </div>
            <div className="rounded-2xl p-5" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-semibold text-gray-300">공지사항 목록</p>
                {!noticeEditMode && (
                  <button onClick={() => { setNoticeText(localStorage.getItem("admin_notices") || ""); setNoticeEditMode(true); }}
                    className="text-xs px-3 py-1.5 rounded-lg bg-orange-600/30 hover:bg-orange-600/50 text-orange-300 transition">수정</button>
                )}
              </div>
              {noticeEditMode ? (
                <div className="space-y-3">
                  <textarea value={noticeText} onChange={e => setNoticeText(e.target.value)} rows={8}
                    placeholder="공지사항 (한 줄 = 하나의 공지)"
                    className="w-full rounded-xl px-4 py-3 text-sm text-gray-200 leading-relaxed focus:outline-none resize-y font-mono"
                    style={{ background: "rgba(0,0,0,0.4)", border: "1px solid rgba(249,115,22,0.4)" }} />
                  <div className="flex gap-2">
                    <button onClick={() => { setNoticeSaving(true); try { localStorage.setItem("admin_notices", noticeText); } catch {} setTimeout(() => { setNoticeSaving(false); setNoticeEditMode(false); setSavedMsg("✅ 공지사항 저장"); setTimeout(() => setSavedMsg(null), 3000); }, 500); }} disabled={noticeSaving}
                      className="flex-1 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 font-medium text-sm transition disabled:opacity-50">{noticeSaving ? "저장 중..." : "💾 저장"}</button>
                    <button onClick={() => setNoticeEditMode(false)} className="px-4 py-2.5 rounded-xl text-sm text-gray-400" style={{ background: "rgba(255,255,255,0.05)" }}>취소</button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  {(localStorage.getItem("admin_notices") || "").split("\n").filter(Boolean).map((line, i) => (
                    <div key={i} className="flex items-start gap-2 px-4 py-3 rounded-xl" style={{ background: "rgba(255,255,255,0.03)" }}>
                      <span className="text-orange-400/50 text-xs font-mono shrink-0 mt-0.5">{String(i + 1).padStart(2, "0")}</span>
                      <p className="text-sm text-gray-300 leading-relaxed">{line}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── 미리보기 ── */}
        {activeTab === "preview" && (
          <div className="space-y-5">
            <div className="rounded-xl p-4" style={{ background: "rgba(20,184,166,0.08)", border: "1px solid rgba(20,184,166,0.2)" }}>
              <p className="text-xs text-teal-300 leading-relaxed">결제 없이 모든 최종 결과 화면 확인. sessionStorage에 paymentDone=true 설정됩니다.</p>
            </div>
            <div className="rounded-2xl p-5 space-y-4" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <p className="text-sm font-semibold text-gray-300">테스트 사주 정보</p>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "이름", value: previewName, setter: setPreviewName, type: "text" },
                  { label: "출생연도", value: previewYear, setter: setPreviewYear, type: "text" },
                  { label: "월", value: previewMonth, setter: setPreviewMonth, type: "text" },
                  { label: "일", value: previewDay, setter: setPreviewDay, type: "text" },
                  { label: "시 (0~23)", value: previewHour, setter: setPreviewHour, type: "text" },
                ].map(({ label, value, setter, type }) => (
                  <div key={label}>
                    <label className="text-xs text-gray-500 mb-1 block">{label}</label>
                    <input type={type} value={value} onChange={e => setter(e.target.value)}
                      className="w-full rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-teal-500 transition"
                      style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }} />
                  </div>
                ))}
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">성별</label>
                  <select value={previewGender} onChange={e => setPreviewGender(e.target.value)}
                    className="w-full rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-teal-500"
                    style={{ background: "rgba(30,30,50,1)", border: "1px solid rgba(255,255,255,0.1)" }}>
                    <option value="female">여성</option><option value="male">남성</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-3">
              {[
                { label: "🖼 배경화면 결과", target: "result" as const, color: "bg-indigo-600 hover:bg-indigo-500" },
                { label: "📄 전체 보고서", target: "report" as const, color: "bg-violet-600 hover:bg-violet-500" },
                { label: "⚙️ AI 생성 화면", target: "generating" as const, color: "bg-amber-600 hover:bg-amber-500" },
                { label: "📈 주식 결과", target: "stock" as const, color: "bg-emerald-600 hover:bg-emerald-500" },
                { label: "✨ 매력 결과", target: "charm" as const, color: "bg-pink-600 hover:bg-pink-500" },
              ].map(({ label, target, color }) => (
                <button key={target} onClick={() => activatePreview(target)}
                  className={`w-full py-3 px-4 rounded-xl text-sm font-semibold text-white transition-all shadow-lg ${color}`}>{label}</button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
