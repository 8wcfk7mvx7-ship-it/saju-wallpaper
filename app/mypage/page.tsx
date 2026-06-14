"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import BirthInputForm, { BirthFormData, defaultBirthData } from "@/components/BirthInputForm";

interface SavedSaju {
  name: string;
  birthYear: number;
  birthMonth: number;
  birthDay: number;
  birthHour: number;
  birthHourUnknown: boolean;
  gender: string;
  savedAt: string;
  label?: string;
}

interface SavedReport {
  orderId: string;
  productName: string;
  amount: number;
  paidAt: string;
  url?: string;
}

const SAJU_STORAGE_KEY = "sp_saved_saju_list";
const REPORT_STORAGE_KEY = "sp_saved_reports";

function parseUser() {
  try {
    const match = document.cookie.split(";").find(c => c.trim().startsWith("sp_user="));
    if (!match) return null;
    const encoded = match.trim().split("=")[1];
    return JSON.parse(atob(encoded));
  } catch { return null; }
}

export default function MyPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ nickname: string; profileImage?: string } | null>(null);
  const [savedSajus, setSavedSajus] = useState<SavedSaju[]>([]);
  const [reports, setReports] = useState<SavedReport[]>([]);
  const [tab, setTab] = useState<"saju" | "reports">("saju");
  const [blueberries, setBlueberries] = useState(0);
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [editLabel, setEditLabel] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState<BirthFormData>(defaultBirthData());
  const [addName, setAddName] = useState("");

  useEffect(() => {
    setUser(parseUser());
    const bb = parseInt(localStorage.getItem("sp_blueberries") ?? "0", 10);
    setBlueberries(isNaN(bb) ? 0 : bb);
    try {
      const raw = localStorage.getItem(SAJU_STORAGE_KEY);
      if (raw) setSavedSajus(JSON.parse(raw));
    } catch {}
    try {
      const raw = localStorage.getItem(REPORT_STORAGE_KEY);
      if (raw) setReports(JSON.parse(raw));
    } catch {}
  }, []);

  function deleteSaju(index: number) {
    const next = savedSajus.filter((_, i) => i !== index);
    setSavedSajus(next);
    localStorage.setItem(SAJU_STORAGE_KEY, JSON.stringify(next));
  }

  function loadSaju(saju: SavedSaju) {
    const form = {
      name: saju.name,
      gender: saju.gender,
      birthYear: saju.birthYear,
      birthMonth: saju.birthMonth,
      birthDay: saju.birthDay,
      birthHour: saju.birthHour,
      birthMinute: 0,
      birthHourUnknown: saju.birthHourUnknown,
      birthPlace: "서울",
      style: "auto",
      productType: "report",
      useJajasi: false,
      lang: "ko",
    };
    sessionStorage.setItem("sajuForm", JSON.stringify(form));
    router.push("/service/saju");
  }

  function saveNewSaju() {
    if (!addName.trim() || !addForm.birthYear || !addForm.birthMonth || !addForm.birthDay) return;
    const entry: SavedSaju = {
      name: addName.trim(),
      birthYear: Number(addForm.birthYear),
      birthMonth: Number(addForm.birthMonth),
      birthDay: Number(addForm.birthDay),
      birthHour: addForm.birthHour ?? 0,
      birthHourUnknown: addForm.birthHour === null,
      gender: addForm.gender,
      savedAt: new Date().toISOString(),
    };
    const next = [...savedSajus, entry];
    setSavedSajus(next);
    localStorage.setItem(SAJU_STORAGE_KEY, JSON.stringify(next));
    setShowAddModal(false);
    setAddName("");
    setAddForm(defaultBirthData());
  }

  function saveLabel(index: number) {
    const next = savedSajus.map((s, i) => i === index ? { ...s, label: editLabel } : s);
    setSavedSajus(next);
    localStorage.setItem(SAJU_STORAGE_KEY, JSON.stringify(next));
    setEditIndex(null);
  }

  function formatBirth(s: SavedSaju) {
    const hour = s.birthHourUnknown ? "시 모름" : `${s.birthHour}시`;
    return `${s.birthYear}.${String(s.birthMonth).padStart(2,"0")}.${String(s.birthDay).padStart(2,"0")} ${hour}`;
  }

  const GENDER_LABEL: Record<string, string> = { male: "남", female: "여" };

  return (
    <main className="min-h-screen bg-[#06060e] text-white pb-24">
      <div className="max-w-lg mx-auto px-4 pt-6">
        {/* 유저 카드 */}
        {user ? (
          <div className="flex items-center gap-3 mb-6 p-4 rounded-2xl"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
            {user.profileImage ? (
              <img src={user.profileImage} alt="" className="w-10 h-10 rounded-full object-cover" />
            ) : (
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-lg"
                style={{ background: "rgba(201,168,76,0.15)" }}>👤</div>
            )}
            <div>
              <p className="font-bold text-white text-sm">{user.nickname}님</p>
              <p className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>네이버 로그인 완료</p>
            </div>
            <button
              onClick={() => { document.cookie = "sp_user=; max-age=0; path=/"; router.refresh(); }}
              className="ml-auto text-xs px-3 py-1.5 rounded-lg transition-colors"
              style={{ background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.4)" }}>
              로그아웃
            </button>
          </div>
        ) : (
          <div className="mb-6 p-5 rounded-2xl text-center"
            style={{ background: "rgba(3,199,90,0.05)", border: "1px solid rgba(3,199,90,0.2)" }}>
            <p className="text-sm text-white mb-1 font-bold">네이버로 로그인하면</p>
            <p className="text-xs mb-4" style={{ color: "rgba(255,255,255,0.4)" }}>
              저장한 사주와 결제 내역을 어디서든 볼 수 있어요
            </p>
            <a href="/api/auth/naver?redirect=/mypage"
              className="inline-flex items-center gap-2 text-white font-bold text-sm px-5 py-2.5 rounded-xl transition-all"
              style={{ background: "#03C75A" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M16.273 12.845L7.376 0H0v24h7.727V11.155L16.624 24H24V0h-7.727z" fill="#fff"/>
              </svg>
              네이버로 시작하기
            </a>
          </div>
        )}

        {/* 별조각 잔액 카드 — 로그인 시만 노출 */}
        {user && (
          <div className="mb-5 p-4 rounded-2xl flex items-center justify-between"
            style={{ background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.2)" }}>
            <div className="flex items-center gap-2.5">
              <span className="text-2xl">✦</span>
              <div>
                <p className="text-xs font-bold" style={{ color: "#a78bfa" }}>내 별조각</p>
                <p className="text-lg font-black text-white">{blueberries.toLocaleString()} <span className="text-xs font-normal" style={{ color: "rgba(255,255,255,0.4)" }}>개</span></p>
              </div>
            </div>
            <button
              onClick={() => router.push("/charge")}
              className="px-4 py-2 rounded-xl text-xs font-black transition-all active:scale-[0.97]"
              style={{ background: "linear-gradient(135deg, #6366f1, #818cf8)", color: "#fff" }}
            >
              충전하기 →
            </button>
          </div>
        )}

        {/* 광고 보고 별조각 받기 */}
        {user && (
          <button onClick={() => router.push("/ad-reward")}
            className="w-full mb-5 p-4 rounded-2xl flex items-center justify-between"
            style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <div className="flex items-center gap-2.5">
              <span className="text-2xl">🎬</span>
              <div className="text-left">
                <p className="text-sm font-bold text-white">광고 보고 별조각 받기</p>
                <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.4)" }}>무료로 별조각 충전하기</p>
              </div>
            </div>
            <span className="text-sm" style={{ color: "rgba(255,255,255,0.3)" }}>›</span>
          </button>
        )}

        {/* 탭 + 콘텐츠 — 로그인 시만 노출 */}
        {!user && (
          <div className="text-center py-12">
            <p className="text-3xl mb-3">🔒</p>
            <p className="text-sm font-bold text-white mb-1">로그인이 필요해요</p>
            <p className="text-xs mb-6" style={{ color: "rgba(255,255,255,0.4)" }}>저장된 사주와 결제 내역은 로그인 후 확인할 수 있어요</p>
          </div>
        )}

        {/* 탭 + 콘텐츠 — 로그인 시만 */}
        {user && <>
        <div className="flex gap-2 mb-5">
          {([
            { key: "saju", label: "저장된 생년월일" },
            { key: "reports", label: "저장된 보고서 (2종)" },
          ] as const).map(({ key, label }) => (
            <button key={key} onClick={() => setTab(key)}
              className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-all"
              style={{
                background: tab === key ? "rgba(201,168,76,0.15)" : "rgba(255,255,255,0.04)",
                color: tab === key ? "#e8c97a" : "rgba(255,255,255,0.4)",
                border: `1px solid ${tab === key ? "rgba(201,168,76,0.3)" : "rgba(255,255,255,0.07)"}`,
              }}>
              {label}
            </button>
          ))}
        </div>

        {/* 저장된 사주 탭 */}
        {tab === "saju" && (
          <div className="space-y-3">
            {savedSajus.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-4xl mb-3">📋</p>
                <p className="text-sm font-bold text-white mb-1">저장된 사주가 없습니다</p>
                <p className="text-xs mb-5" style={{ color: "rgba(255,255,255,0.35)" }}>
                  사주 분석 페이지에서 생년월일을 입력하면<br />자동으로 여기에 저장됩니다
                </p>
                <button onClick={() => setShowAddModal(true)}
                  className="text-sm px-5 py-2.5 rounded-xl font-bold transition-all"
                  style={{ background: "rgba(201,168,76,0.15)", color: "#e8c97a", border: "1px solid rgba(201,168,76,0.3)" }}>
                  새로운 생년월일 입력하기 →
                </button>
              </div>
            ) : (
              savedSajus.map((saju, i) => (
                <div key={i} className="rounded-2xl p-4"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      {editIndex === i ? (
                        <div className="flex items-center gap-2">
                          <input
                            value={editLabel}
                            onChange={e => setEditLabel(e.target.value)}
                            className="bg-white/10 border border-white/20 rounded-lg px-2 py-1 text-sm text-white focus:outline-none focus:border-amber-500/50"
                            placeholder="별명 입력 (예: 나, 엄마)"
                            autoFocus
                          />
                          <button onClick={() => saveLabel(i)}
                            className="text-xs px-2 py-1 rounded-lg bg-amber-500/20 text-amber-300">저장</button>
                          <button onClick={() => setEditIndex(null)}
                            className="text-xs px-2 py-1 rounded-lg bg-white/5 text-gray-400">취소</button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <p className="font-black text-white">{saju.label || saju.name}</p>
                          {saju.label && <p className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>({saju.name})</p>}
                          <button onClick={() => { setEditIndex(i); setEditLabel(saju.label || ""); }}
                            className="text-[10px] px-1.5 py-0.5 rounded"
                            style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.3)" }}>
                            수정
                          </button>
                        </div>
                      )}
                      <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.45)" }}>
                        {formatBirth(saju)} · {GENDER_LABEL[saju.gender] || saju.gender}
                      </p>
                    </div>
                    <button onClick={() => deleteSaju(i)}
                      className="text-xs px-2 py-1 rounded-lg transition-colors"
                      style={{ color: "rgba(255,255,255,0.25)", background: "rgba(255,255,255,0.04)" }}>
                      삭제
                    </button>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => loadSaju(saju)}
                      className="flex-1 py-2 rounded-xl text-xs font-bold transition-all"
                      style={{ background: "rgba(201,168,76,0.12)", color: "#e8c97a", border: "1px solid rgba(201,168,76,0.2)" }}>
                      이 사주로 분석하기 →
                    </button>
                    <button onClick={() => { loadSaju(saju); router.push("/service/gunghap"); }}
                      className="flex-1 py-2 rounded-xl text-xs font-bold transition-all"
                      style={{ background: "rgba(236,72,153,0.08)", color: "#f9a8d4", border: "1px solid rgba(236,72,153,0.15)" }}>
                      궁합 보기 →
                    </button>
                  </div>
                  <p className="text-[10px] mt-2 text-right" style={{ color: "rgba(255,255,255,0.2)" }}>
                    저장: {new Date(saju.savedAt).toLocaleDateString("ko-KR")}
                  </p>
                </div>
              ))
            )}
          </div>
        )}

        {/* 결제 내역 탭 */}
        {tab === "reports" && (
          <div className="space-y-3">
            {reports.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-4xl mb-3">📄</p>
                <p className="text-sm font-bold text-white mb-1">결제 내역이 없습니다</p>
                <p className="text-xs mb-5" style={{ color: "rgba(255,255,255,0.35)" }}>
                  결제 완료 후 레포트를 구매하면<br />여기서 다시 확인할 수 있어요
                </p>
                <button onClick={() => router.push("/service/daewoon")}
                  className="text-sm px-5 py-2.5 rounded-xl font-bold transition-all"
                  style={{ background: "rgba(201,168,76,0.15)", color: "#e8c97a", border: "1px solid rgba(201,168,76,0.3)" }}>
                  프리미엄 서비스 보기 →
                </button>
              </div>
            ) : (
              reports.map((r, i) => (
                <div key={i} className="rounded-2xl p-4"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-bold text-white text-sm">{r.productName}</p>
                      <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>
                        {new Date(r.paidAt).toLocaleString("ko-KR", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                    <p className="text-base font-black" style={{ color: "#c084fc" }}>
                      ₩{r.amount.toLocaleString()}
                    </p>
                  </div>
                  <p className="text-[10px] mb-3 font-mono" style={{ color: "rgba(255,255,255,0.2)" }}>
                    주문번호: {r.orderId}
                  </p>
                  {r.url && (
                    <button onClick={() => router.push(r.url!)}
                      className="w-full py-2 rounded-xl text-xs font-bold transition-all"
                      style={{ background: "rgba(192,132,252,0.1)", color: "#c084fc", border: "1px solid rgba(192,132,252,0.2)" }}>
                      결과 다시 보기 →
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        )}
        </>}
      </div>

      {/* 새 생년월일 입력 모달 */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
          style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}
          onClick={e => { if (e.target === e.currentTarget) setShowAddModal(false); }}>
          <div className="w-full max-w-lg rounded-t-3xl sm:rounded-3xl overflow-y-auto"
            style={{ background: "#0e0e1a", border: "1px solid rgba(255,255,255,0.1)", maxHeight: "90vh" }}>
            <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-4 border-b"
              style={{ background: "#0e0e1a", borderColor: "rgba(255,255,255,0.08)" }}>
              <h2 className="font-black text-white text-base">새로운 생년월일 입력</h2>
              <button onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-white transition text-xl leading-none">✕</button>
            </div>
            <div className="px-5 pt-4 pb-2">
              <label className="block text-xs font-bold mb-1.5" style={{ color: "rgba(255,255,255,0.5)" }}>이름 또는 별명</label>
              <input
                value={addName}
                onChange={e => setAddName(e.target.value)}
                placeholder="예: 나, 엄마, 친구"
                className="w-full px-4 py-3 rounded-xl text-sm text-white focus:outline-none mb-4"
                style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)" }}
              />
            </div>
            <div className="px-5 pb-4">
              <BirthInputForm
                value={addForm}
                onChange={setAddForm}
                accent="#c9a84c"
              />
            </div>
            <div className="sticky bottom-0 px-5 pb-6 pt-3 border-t"
              style={{ background: "#0e0e1a", borderColor: "rgba(255,255,255,0.08)" }}>
              <button
                onClick={saveNewSaju}
                disabled={!addName.trim() || !addForm.birthYear || !addForm.birthMonth || !addForm.birthDay}
                className="w-full py-3.5 rounded-2xl font-black text-sm transition-all disabled:opacity-40"
                style={{ background: "linear-gradient(135deg, #c9a84c, #e8c97a)", color: "#06060e" }}>
                저장하기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 모바일 하단 네비 */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 sm:hidden border-t"
        style={{ background: "rgba(6,6,14,0.97)", borderColor: "rgba(255,255,255,0.08)" }}>
        <div className="flex items-stretch h-16">
          {[
            { icon: "🏠", label: "홈", href: "/" },
            { icon: "🔮", label: "사주", href: "/service/saju" },
            { icon: "📦", label: "보관함", href: "/mypage", active: true },
            { icon: "💬", label: "문의", href: "http://pf.kakao.com/_cuksX", external: true },
          ].map((item) => (
            item.external ? (
              <a key={item.label} href={item.href} target="_blank" rel="noopener noreferrer"
                className="flex-1 flex flex-col items-center justify-center gap-0.5"
                style={{ color: "rgba(255,255,255,0.4)" }}>
                <span className="text-xl">{item.icon}</span>
                <span className="text-[10px]">{item.label}</span>
              </a>
            ) : (
              <button key={item.label} onClick={() => router.push(item.href)}
                className="flex-1 flex flex-col items-center justify-center gap-0.5"
                style={{ color: item.active ? "#c9a84c" : "rgba(255,255,255,0.4)" }}>
                <span className="text-xl">{item.icon}</span>
                <span className="text-[10px]" style={{ color: item.active ? "#c9a84c" : "rgba(255,255,255,0.4)" }}>{item.label}</span>
              </button>
            )
          ))}
        </div>
      </nav>
    </main>
  );
}
