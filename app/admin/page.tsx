"use client";
import { useState, useEffect, useCallback } from "react";

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

const CATEGORY_LABELS = {
  wallpaper: "🖼 배경화면 (DALL-E)",
  report: "📄 보고서 (Claude)",
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
  const [activeTab, setActiveTab] = useState<"wallpaper" | "report">("wallpaper");

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

  const filteredPrompts = prompts.filter(p => p.category === activeTab);

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

        {/* 탭 */}
        <div className="flex gap-2 mb-6">
          {(["wallpaper", "report"] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                activeTab === tab
                  ? "bg-indigo-600 text-white"
                  : "bg-white/5 text-gray-400 hover:text-white hover:bg-white/10"
              }`}
            >
              {CATEGORY_LABELS[tab]}
            </button>
          ))}
        </div>

        {/* 프롬프트 목록 */}
        <div className="space-y-4">
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
        </div>

        {/* 수채화+유화 조합 팁 */}
        {activeTab === "wallpaper" && (
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
