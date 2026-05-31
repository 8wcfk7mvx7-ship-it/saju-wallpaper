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

interface Stats {
  todayViews: number;
  totalViews: number;
  payments: Payment[];
  dbConnected: boolean;
}

const CATEGORY_LABELS = {
  dashboard: "📊 대시보드",
  wallpaper: "🖼 배경화면 (DALL-E)",
  report: "📄 보고서 (Claude)",
  notice: "📢 공지사항",
  preview: "👁 결과 미리보기",
};

export default function AdminPage() {
  const [password, setPassword] = useState("");
  const [authed, setAuthed] = useState(false);
  const [authError, setAuthError] = useState("");

  const [prompts, setPrompts] = useState<PromptItem[]>([]);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [saving, setSaving] = useState<string | null>(null); // key being saved
  const [savedMsg, setSavedMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"dashboard" | "wallpaper" | "report" | "notice" | "preview">("dashboard");
  const [dbConnected, setDbConnected] = useState(false);
  const [noticeText, setNoticeText] = useState("");
  const [noticeEditMode, setNoticeEditMode] = useState(false);
  const [noticeSaving, setNoticeSaving] = useState(false);
  const [stats, setStats] = useState<Stats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [previewYear, setPreviewYear] = useState("1990");
  const [previewMonth, setPreviewMonth] = useState("5");
  const [previewDay, setPreviewDay] = useState("15");
  const [previewHour, setPreviewHour] = useState("10");
  const [previewName, setPreviewName] = useState("테스트");
  const [previewGender, setPreviewGender] = useState("female");
  const router = useRouter();

  const storedPw = typeof window !== "undefined" ? sessionStorage.getItem("adminPw") : null;

  // 세션에 비밀번호 저장된 경우 자동 로그인
  useEffect(() => {
    if (storedPw) {
      setPassword(storedPw);
      fetchPrompts(storedPw);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function fetchPrompts(pw: string) {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/prompts", {
        headers: { "x-admin-password": pw },
      });
      if (res.status === 401) {
        setAuthError("비밀번호가 틀렸습니다.");
        sessionStorage.removeItem("adminPw");
        setAuthed(false);
        return;
      }
      const data = await res.json();
      setPrompts(data.prompts || []);
      setDbConnected(!!data.dbConnected);
      setAuthed(true);
      sessionStorage.setItem("adminPw", pw);
      setAuthError("");
    } catch {
      setAuthError("서버 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    fetchPrompts(password);
  }

  function startEdit(p: PromptItem) {
    setEditingKey(p.key);
    setEditValue(p.currentValue);
  }

  function cancelEdit() {
    setEditingKey(null);
    setEditValue("");
  }

  async function savePrompt(key: string) {
    setSaving(key);
    try {
      const res = await fetch("/api/admin/prompts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-password": password,
        },
        body: JSON.stringify({ key, value: editValue }),
      });
      if (!res.ok) throw new Error("저장 실패");
      // 로컬 상태 업데이트
      setPrompts(prev => prev.map(p =>
        p.key === key
          ? { ...p, currentValue: editValue, isCustomized: true, updatedAt: new Date().toISOString() }
          : p
      ));
      setEditingKey(null);
      setSavedMsg(`✅ '${prompts.find(p => p.key === key)?.label}' 저장 완료`);
      setTimeout(() => setSavedMsg(null), 3000);
    } catch {
      alert("저장에 실패했습니다.");
    } finally {
      setSaving(null);
    }
  }

  async function resetToDefault(key: string) {
    if (!confirm("기본값으로 초기화하시겠습니까?")) return;
    setSaving(key);
    try {
      await fetch("/api/admin/prompts", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "x-admin-password": password,
        },
        body: JSON.stringify({ key }),
      });
      const defaultVal = prompts.find(p => p.key === key)?.defaultValue || "";
      setPrompts(prev => prev.map(p =>
        p.key === key
          ? { ...p, currentValue: defaultVal, isCustomized: false, updatedAt: null }
          : p
      ));
      if (editingKey === key) cancelEdit();
      setSavedMsg(`↩️ '${prompts.find(p => p.key === key)?.label}' 기본값으로 초기화`);
      setTimeout(() => setSavedMsg(null), 3000);
    } catch {
      alert("초기화에 실패했습니다.");
    } finally {
      setSaving(null);
    }
  }

  const filteredPrompts = prompts.filter(p => p.category === (activeTab === "dashboard" ? "wallpaper" : activeTab));

  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const res = await fetch("/api/admin/stats", {
        headers: { "x-admin-password": password },
      });
      const data = await res.json();
      setStats(data);
    } catch {
      // ignore
    } finally {
      setStatsLoading(false);
    }
  }, [password]);

  useEffect(() => {
    if (authed && activeTab === "dashboard") fetchStats();
  }, [authed, activeTab, fetchStats]);

  function activatePreview(target: "result" | "report" | "stock" | "charm" | "generating") {
    sessionStorage.setItem("paymentDone", "true");
    const form = {
      name: previewName,
      gender: previewGender,
      birthYear: parseInt(previewYear),
      birthMonth: parseInt(previewMonth),
      birthDay: parseInt(previewDay),
      birthHour: parseInt(previewHour),
      birthMinute: 0,
      birthHourUnknown: false,
      birthPlace: "서울",
      style: "auto",
      productType: "report",
      useJajasi: false,
      lang: "ko",
    };
    sessionStorage.setItem("sajuForm", JSON.stringify(form));

    if (target === "generating") {
      router.push("/generating?type=report");
    } else if (target === "stock") {
      router.push("/stock");
    } else if (target === "charm") {
      router.push("/charm");
    } else if (target === "result") {
      router.push("/result");
    } else if (target === "report") {
      router.push("/report");
    }
  }

  // ── 로그인 화면 ──────────────────────────────
  if (!authed) {
    return (
      <div className="min-h-screen bg-[#0a0a14] flex items-center justify-center px-4">
        <form onSubmit={handleLogin} className="w-full max-w-sm">
          <div className="text-center mb-8">
            <p className="text-3xl mb-2">🔐</p>
            <h1 className="text-xl font-bold text-white">관리자 페이지</h1>
            <p className="text-gray-500 text-sm mt-1">이용자에게 표시되지 않는 영역입니다</p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
            <div>
              <label className="block text-xs text-gray-400 mb-1">비밀번호</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="ADMIN_PASSWORD 값을 입력"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                autoFocus
              />
            </div>
            {authError && (
              <p className="text-red-400 text-sm text-center">{authError}</p>
            )}
            <button
              type="submit"
              disabled={!password || loading}
              className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-medium text-sm transition-colors disabled:opacity-50"
            >
              {loading ? "확인 중..." : "로그인"}
            </button>
          </div>
        </form>
      </div>
    );
  }

  // ── 어드민 메인 ──────────────────────────────
  return (
    <div className="min-h-screen bg-[#0a0a14] text-white">
      {/* 헤더 */}
      <div className="border-b border-white/10 px-4 py-4 flex items-center justify-between max-w-4xl mx-auto">
        <div>
          <h1 className="text-lg font-bold">🛠 AI 프롬프트 관리</h1>
          <p className="text-xs text-gray-500 mt-0.5">이용자에게 보이지 않는 관리자 전용 페이지</p>
        </div>
        <button
          onClick={() => { setAuthed(false); sessionStorage.removeItem("adminPw"); }}
          className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
        >
          로그아웃
        </button>
      </div>

      {/* 저장 성공 토스트 */}
      {savedMsg && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-indigo-600 text-white text-sm px-4 py-2 rounded-xl shadow-lg">
          {savedMsg}
        </div>
      )}

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* 안내 박스 */}
        <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-4 mb-6">
          <p className="text-sm text-indigo-300 leading-relaxed">
            <strong>💡 사용법</strong><br />
            여기서 수정한 프롬프트는 <strong>다음 결제 후 AI 생성부터 즉시 반영</strong>됩니다.<br />
            배경화면(DALL-E) 프롬프트와 보고서(Claude) 프롬프트를 각각 커스터마이징하세요.<br />
            기본값으로 언제든지 돌아갈 수 있습니다.
          </p>
        </div>

        {/* DB 미연결 경고 */}
        {!dbConnected && (
          <div className="bg-red-500/10 border border-red-500/25 rounded-xl p-3 mb-4 flex items-center gap-2">
            <span className="text-red-400 text-lg">⚠️</span>
            <div>
              <p className="text-red-300 text-xs font-bold">Supabase 미연결 — 프롬프트 저장이 되지 않습니다</p>
              <p className="text-red-400/60 text-xs">Vercel 환경변수에 SUPABASE_URL · SUPABASE_SERVICE_KEY를 설정하세요</p>
            </div>
          </div>
        )}

        {/* 탭 */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {(["dashboard", "wallpaper", "report", "notice", "preview"] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                activeTab === tab
                  ? tab === "preview" ? "bg-emerald-600 text-white"
                    : tab === "dashboard" ? "bg-sky-600 text-white"
                    : tab === "notice" ? "bg-orange-600 text-white"
                    : "bg-indigo-600 text-white"
                  : "bg-white/5 text-gray-400 hover:text-white hover:bg-white/10"
              }`}
            >
              {CATEGORY_LABELS[tab]}
            </button>
          ))}
        </div>

        {/* 대시보드 탭 */}
        {activeTab === "dashboard" && (
          <div className="space-y-6">
            <div className="flex justify-end">
              <button onClick={fetchStats} disabled={statsLoading}
                className="text-xs text-sky-400 hover:text-sky-300 transition disabled:opacity-50">
                {statsLoading ? "로딩 중..." : "↻ 새로고침"}
              </button>
            </div>

            {/* 방문자 수 카드 */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-sky-500/10 border border-sky-500/20 rounded-2xl p-5">
                <p className="text-xs text-sky-400 mb-1">오늘 방문자</p>
                <p className="text-3xl font-black text-white">
                  {statsLoading ? "—" : (stats?.todayViews ?? 0).toLocaleString()}
                </p>
                {!stats?.dbConnected && <p className="text-xs text-gray-600 mt-1">DB 미연결</p>}
              </div>
              <div className="bg-violet-500/10 border border-violet-500/20 rounded-2xl p-5">
                <p className="text-xs text-violet-400 mb-1">누적 방문자</p>
                <p className="text-3xl font-black text-white">
                  {statsLoading ? "—" : (stats?.totalViews ?? 0).toLocaleString()}
                </p>
              </div>
            </div>

            {/* 결제 통계 */}
            {stats?.payments && stats.payments.length > 0 && (
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-5">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-xs text-emerald-400 mb-1">총 결제 건</p>
                    <p className="text-2xl font-black text-white">{stats.payments.length}</p>
                  </div>
                  <div>
                    <p className="text-xs text-emerald-400 mb-1">총 매출</p>
                    <p className="text-2xl font-black text-white">
                      ₩{stats.payments.reduce((s, p) => s + p.amount, 0).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-emerald-400 mb-1">오늘 매출</p>
                    <p className="text-2xl font-black text-white">
                      ₩{stats.payments
                        .filter(p => new Date(p.created_at).toDateString() === new Date().toDateString())
                        .reduce((s, p) => s + p.amount, 0).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* 결제 목록 */}
            <div>
              <h3 className="text-sm font-bold text-gray-300 mb-3">결제 내역</h3>
              {statsLoading ? (
                <p className="text-gray-600 text-sm text-center py-8">로딩 중...</p>
              ) : !stats?.dbConnected ? (
                <div className="bg-white/[0.03] border border-white/10 rounded-xl p-6 text-center">
                  <p className="text-gray-600 text-sm">Supabase 미연결</p>
                  <p className="text-gray-700 text-xs mt-1">SUPABASE_URL / SUPABASE_SERVICE_KEY 환경변수 설정 필요</p>
                </div>
              ) : stats.payments.length === 0 ? (
                <div className="bg-white/[0.03] border border-white/10 rounded-xl p-6 text-center">
                  <p className="text-gray-600 text-sm">결제 내역 없음</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {stats.payments.map(p => (
                    <div key={p.id} className="bg-white/[0.04] border border-white/8 rounded-xl p-4 flex items-center justify-between gap-4">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-sm font-semibold text-white">{p.product_name}</span>
                          <span className="text-xs bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded-full">{p.status}</span>
                        </div>
                        <p className="text-xs text-gray-500">
                          {p.customer_name}
                          {p.customer_email && ` · ${p.customer_email}`}
                        </p>
                        <p className="text-xs text-gray-700 mt-0.5 font-mono">{p.order_id}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-base font-black text-violet-300">₩{p.amount.toLocaleString()}</p>
                        <p className="text-xs text-gray-600">
                          {new Date(p.created_at).toLocaleString("ko-KR", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Supabase 테이블 생성 안내 */}
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
              <p className="text-xs text-amber-300 font-bold mb-2">⚙️ Supabase 테이블 설정 필요</p>
              <p className="text-xs text-amber-200/70 leading-relaxed mb-2">아래 SQL을 Supabase SQL Editor에서 실행하세요:</p>
              <pre className="text-xs text-gray-400 bg-black/30 rounded-lg p-3 overflow-x-auto whitespace-pre-wrap">{`-- 방문자 추적
create table if not exists page_views (
  id bigint generated always as identity primary key,
  page text not null default '/',
  created_at timestamptz default now()
);

-- 결제 내역
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

-- 카카오 사용자
create table if not exists kakao_users (
  id bigint generated always as identity primary key,
  kakao_id text unique not null,
  nickname text,
  profile_image text,
  email text,
  last_login timestamptz default now(),
  created_at timestamptz default now()
);`}</pre>
            </div>
          </div>
        )}

        {/* 결과 미리보기 탭 */}
        {activeTab === "preview" && (
          <div className="space-y-5">
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4">
              <p className="text-sm text-emerald-300 leading-relaxed">
                <strong>👁 결과 미리보기</strong><br />
                테스트용 사주 정보를 입력하고 결제 없이 모든 최종 결과 화면을 확인합니다.<br />
                <span className="text-emerald-400/70 text-xs">sessionStorage에 paymentDone=true가 설정되어 블러가 자동 해제됩니다.</span>
              </p>
            </div>

            {/* 테스트 사주 입력 */}
            <div className="bg-white/[0.04] border border-white/10 rounded-2xl p-5 space-y-4">
              <p className="text-sm font-semibold text-gray-300">테스트 사주 정보</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">이름</label>
                  <input value={previewName} onChange={e => setPreviewName(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">성별</label>
                  <select value={previewGender} onChange={e => setPreviewGender(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500">
                    <option value="female">여성</option>
                    <option value="male">남성</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">출생연도</label>
                  <input value={previewYear} onChange={e => setPreviewYear(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">월</label>
                  <input value={previewMonth} onChange={e => setPreviewMonth(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">일</label>
                  <input value={previewDay} onChange={e => setPreviewDay(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">시 (0~23)</label>
                  <input value={previewHour} onChange={e => setPreviewHour(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500" />
                </div>
              </div>
            </div>

            {/* 바로가기 버튼들 */}
            <div className="grid grid-cols-1 gap-3">
              {[
                { label: "🖼 배경화면 결과 (/result)", target: "result" as const, color: "bg-indigo-600 hover:bg-indigo-500", desc: "오행 배경화면 결과 페이지 (blur 해제)" },
                { label: "📄 전체 보고서 (/report)", target: "report" as const, color: "bg-violet-600 hover:bg-violet-500", desc: "유료 전체 보고서 페이지" },
                { label: "⚙️ AI 생성 중 (/generating)", target: "generating" as const, color: "bg-amber-600 hover:bg-amber-500", desc: "보고서 AI 생성 로딩 → /report 이동" },
                { label: "📈 주식 결과 (/stock)", target: "stock" as const, color: "bg-emerald-600 hover:bg-emerald-500", desc: "주식 투자 분석 결과 (blur 해제)" },
                { label: "✨ 매력 결과 (/charm)", target: "charm" as const, color: "bg-pink-600 hover:bg-pink-500", desc: "매력 분석 결과 (blur 해제)" },
              ].map(({ label, target, color, desc }) => (
                <div key={target} className="flex items-center gap-3">
                  <button
                    onClick={() => activatePreview(target)}
                    className={`flex-1 py-3 px-4 rounded-xl text-sm font-semibold text-white transition-all ${color} shadow-lg`}
                  >
                    {label}
                  </button>
                  <span className="text-xs text-gray-600 w-36 leading-snug">{desc}</span>
                </div>
              ))}
            </div>

            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3">
              <p className="text-xs text-amber-300/80 leading-relaxed">
                ⚠️ /result 와 /report 는 실제 saju 계산 데이터가 sessionStorage에 있어야 합니다.<br />
                <strong>배경화면(/result)</strong> → 먼저 /form에서 분석을 실행하거나 /loading을 통해 데이터를 생성하세요.<br />
                <strong>보고서(/report)</strong> → /generating을 통해 AI 생성 후 자동 이동됩니다.
              </p>
            </div>
          </div>
        )}

        {/* 공지사항 탭 */}
        {activeTab === "notice" && (
          <div className="space-y-5">
            <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-4">
              <p className="text-sm text-orange-300 leading-relaxed">
                <strong>📢 공지사항 관리</strong><br />
                여기서 입력한 내용이 메인 페이지 상단 공지 티커에 표시됩니다.<br />
                <span className="text-orange-400/70 text-xs">각 줄이 하나의 공지 항목이 됩니다. 엔터로 구분하세요.</span>
              </p>
            </div>

            <div className="bg-white/[0.04] border border-white/10 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-semibold text-gray-300">현재 공지사항 목록</p>
                {!noticeEditMode && (
                  <button
                    onClick={() => {
                      const stored = localStorage.getItem("admin_notices") || "🎉 Summer Palace AI 사주 — 지금 무료로 체험해보세요!\n🔮 19금 사주 분석 오픈 — 나의 성적 매력을 알아보세요\n✨ 일진달력 업데이트 — 오늘의 운세를 확인하세요";
                      setNoticeText(stored);
                      setNoticeEditMode(true);
                    }}
                    className="text-xs px-3 py-1.5 rounded-lg bg-orange-600/30 hover:bg-orange-600/50 text-orange-300 transition-colors"
                  >
                    수정
                  </button>
                )}
              </div>

              {noticeEditMode ? (
                <div className="space-y-3">
                  <textarea
                    value={noticeText}
                    onChange={e => setNoticeText(e.target.value)}
                    rows={8}
                    placeholder="공지사항 내용 (한 줄 = 하나의 공지)"
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-gray-200 leading-relaxed focus:outline-none focus:border-orange-500 resize-y font-mono"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setNoticeSaving(true);
                        try { localStorage.setItem("admin_notices", noticeText); } catch {}
                        setTimeout(() => {
                          setNoticeSaving(false);
                          setNoticeEditMode(false);
                          setSavedMsg("✅ 공지사항 저장 완료 (로컬)");
                          setTimeout(() => setSavedMsg(null), 3000);
                        }, 500);
                      }}
                      disabled={noticeSaving}
                      className="flex-1 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 font-medium text-sm transition-colors disabled:opacity-50"
                    >
                      {noticeSaving ? "저장 중..." : "💾 저장"}
                    </button>
                    <button
                      onClick={() => setNoticeEditMode(false)}
                      className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-sm text-gray-400 transition-colors"
                    >
                      취소
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  {(localStorage.getItem("admin_notices") || "🎉 Summer Palace AI 사주 — 지금 무료로 체험해보세요!\n🔮 19금 사주 분석 오픈 — 나의 성적 매력을 알아보세요\n✨ 일진달력 업데이트 — 오늘의 운세를 확인하세요").split("\n").filter(Boolean).map((line, i) => (
                    <div key={i} className="flex items-start gap-2 bg-white/[0.03] rounded-xl px-4 py-3">
                      <span className="text-orange-400/50 text-xs font-mono mt-0.5">{String(i + 1).padStart(2, "0")}</span>
                      <p className="text-sm text-gray-300 leading-relaxed">{line}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
              <p className="text-xs text-amber-300/70 leading-relaxed">
                💡 현재 공지는 브라우저 localStorage에 저장됩니다. Supabase 연결 후에는 DB에 저장되어 모든 기기에 공유됩니다.
              </p>
            </div>
          </div>
        )}

        {/* 프롬프트 목록 (wallpaper/report 탭일 때만) */}
        {(activeTab === "wallpaper" || activeTab === "report") && <div className="space-y-4">
          {filteredPrompts.map(p => {
            const isEditing = editingKey === p.key;
            const isSaving = saving === p.key;

            return (
              <div
                key={p.key}
                className={`rounded-2xl border transition-all ${
                  isEditing
                    ? "border-indigo-500/50 bg-indigo-500/5"
                    : p.isCustomized
                    ? "border-green-500/30 bg-green-500/5"
                    : "border-white/10 bg-white/3"
                }`}
              >
                {/* 프롬프트 헤더 */}
                <div className="p-4 flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-white">{p.label}</span>
                      {p.isCustomized && (
                        <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full">
                          ✏️ 커스텀
                        </span>
                      )}
                      {!p.isCustomized && (
                        <span className="text-xs bg-white/10 text-gray-500 px-2 py-0.5 rounded-full">
                          기본값
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{p.description}</p>
                    {p.isCustomized && p.updatedAt && (
                      <p className="text-xs text-gray-600 mt-0.5">
                        마지막 수정: {new Date(p.updatedAt).toLocaleString("ko-KR")}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    {!isEditing && (
                      <button
                        onClick={() => startEdit(p)}
                        className="text-xs px-3 py-1.5 rounded-lg bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 transition-colors"
                      >
                        수정
                      </button>
                    )}
                    {p.isCustomized && !isEditing && (
                      <button
                        onClick={() => resetToDefault(p.key)}
                        disabled={isSaving}
                        className="text-xs px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 transition-colors disabled:opacity-50"
                      >
                        초기화
                      </button>
                    )}
                  </div>
                </div>

                {/* 현재 값 미리보기 (편집 중이 아닐 때) */}
                {!isEditing && (
                  <div className="px-4 pb-4">
                    <div className="bg-black/30 rounded-xl p-3">
                      <p className="text-xs text-gray-400 whitespace-pre-wrap leading-relaxed line-clamp-3">
                        {p.currentValue}
                      </p>
                    </div>
                  </div>
                )}

                {/* 편집 텍스트에어리어 */}
                {isEditing && (
                  <div className="px-4 pb-4 space-y-3">
                    <textarea
                      value={editValue}
                      onChange={e => setEditValue(e.target.value)}
                      rows={8}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-gray-200 leading-relaxed focus:outline-none focus:border-indigo-500 resize-y font-mono"
                      placeholder="프롬프트 내용 입력..."
                      autoFocus
                    />

                    {/* 기본값 참고 */}
                    <details className="group">
                      <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-400 select-none">
                        📋 기본값 보기
                      </summary>
                      <div className="mt-2 bg-black/20 rounded-xl p-3">
                        <p className="text-xs text-gray-600 whitespace-pre-wrap leading-relaxed">
                          {p.defaultValue}
                        </p>
                        <button
                          onClick={() => setEditValue(p.defaultValue)}
                          className="mt-2 text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
                        >
                          ↺ 기본값으로 채우기
                        </button>
                      </div>
                    </details>

                    <div className="flex gap-2">
                      <button
                        onClick={() => savePrompt(p.key)}
                        disabled={isSaving || !editValue.trim()}
                        className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-medium text-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {isSaving ? (
                          <>
                            <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            저장 중...
                          </>
                        ) : (
                          "💾 저장"
                        )}
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-sm text-gray-400 transition-colors"
                      >
                        취소
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>}

        {/* 수채화+유화 조합 팁 */}
        {activeTab === "wallpaper" && prompts.length > 0 && (
          <div className="mt-6 bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4">
            <p className="text-sm text-yellow-300 font-medium mb-1">💡 수채화 + 유화 조합 팁</p>
            <p className="text-xs text-yellow-200/70 leading-relaxed">
              수채화 스타일 프롬프트에 유화 요소를 섞고 싶다면 두 프롬프트의 핵심 키워드를 합치면 됩니다.<br />
              예: <code className="bg-black/30 px-1 rounded text-yellow-300">watercolor painting with oil paint texture, layered brushstrokes...</code>
            </p>
          </div>
        )}

        {/* 실제 API 호출 흐름 안내 */}
        <div className="mt-6 bg-white/3 border border-white/8 rounded-xl p-4">
          <p className="text-xs text-gray-500 font-medium mb-2">🔄 프롬프트 반영 흐름</p>
          <div className="text-xs text-gray-600 space-y-1">
            <p>배경화면: 결제 → /generating → <code className="text-gray-500">/api/generate/wallpaper</code> → Supabase에서 스타일 프롬프트 로드 → DALL-E 3 생성</p>
            <p>보고서: 결제 → /generating → <code className="text-gray-500">/api/generate/report</code> → Supabase에서 system 프롬프트 로드 → Claude 분석</p>
          </div>
        </div>
      </div>
    </div>
  );
}
