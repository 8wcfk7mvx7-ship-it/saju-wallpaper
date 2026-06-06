"use client";
import BackButton from "@/components/BackButton";
import { useEffect, useRef, useState } from "react";
import { analyzeSaju, SajuResult } from "@/lib/saju";
import BirthInputForm, { BirthFormData, defaultBirthData } from "@/components/BirthInputForm";
import { SIPSEONG_DESC, SIPSEONG_MONEY_COMBO } from "@/lib/saju2";

type Step = "gate" | "input" | "chat";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const COST_PER_CHAT = 5;
const BUNDLE_5 = { count: 5, price: 25, label: "5회권 (25개)" };
const BUNDLE_10 = { count: 10, price: 50, label: "10회권 (50개)" };

function getStars(): number {
  if (typeof window === "undefined") return 0;
  return parseInt(localStorage.getItem("sp_blueberries") ?? "0", 10);
}

function saveStars(n: number) {
  localStorage.setItem("sp_blueberries", String(n));
}

export default function SajuChatPage() {
  const [step, setStep] = useState<Step>("gate");
  const [stars, setStars] = useState(0);
  const [messages, setMessages] = useState<Message[]>([]);
  const [sajuContext, setSajuContext] = useState("");
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  // Input form state
  const [form, setForm] = useState<BirthFormData>(defaultBirthData("female"));

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setStars(getStars());
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function buyBundle(price: number) {
    if (stars < price) {
      alert(`별조각이 부족합니다 (현재 ${stars}개)`);
      return;
    }
    const next = stars - price;
    saveStars(next);
    setStars(next);
  }

  async function handleInputSubmit(e: React.FormEvent) {
    e.preventDefault();
    const yr = typeof form.birthYear === "number" ? form.birthYear : 0;
    const mo = typeof form.birthMonth === "number" ? form.birthMonth : 0;
    const dy = typeof form.birthDay === "number" ? form.birthDay : 0;
    if (!yr || !mo || !dy) {
      alert("생년월일을 입력해주세요");
      return;
    }

    let fy = yr, fm = mo, fd = dy;
    if (form.calendarType === "lunar") {
      try {
        // @ts-ignore
        const KLC = (await import("korean-lunar-calendar")).default;
        const cal = new KLC();
        cal.setLunarDate(fy, fm, fd, form.isLeapMonth);
        const sol = cal.getSolarCalendar();
        if (sol?.year) { fy = sol.year; fm = sol.month; fd = sol.day; }
      } catch {}
    }

    let result: SajuResult;
    try {
      result = analyzeSaju({
        birthYear: fy, birthMonth: fm, birthDay: fd,
        birthHour: form.birthHour, birthMinute: form.birthMinute ?? 0,
        name: "사용자", gender: form.gender,
        birthPlace: form.city || "서울", style: "auto",
        productType: "report", useJajasi: form.useJajasi,
      });
    } catch {
      alert("사주 분석 중 오류가 발생했습니다");
      return;
    }

    const sinsalNames = result.sinsalList.map((s) => s.name).join(", ") || "없음";
    const dominantStr = result.dominant.join(", ") || "없음";

    // 십신별 심화 설명 구성
    const sipseongSet = new Set<string>();
    for (const p of Object.values(result.pillarsDetail)) {
      const pd = p as { sipseongCg?: string; sipseongJj?: string };
      if (pd.sipseongCg) sipseongSet.add(pd.sipseongCg);
      if (pd.sipseongJj) sipseongSet.add(pd.sipseongJj);
    }
    const sipseongDesc = [...sipseongSet]
      .map(ss => SIPSEONG_DESC[ss] ? `${ss}(${SIPSEONG_DESC[ss].hanja}): ${SIPSEONG_DESC[ss].short}` : null)
      .filter(Boolean).join(", ");

    // 재물 구조 콤보 감지
    const moneyComboKeys = Object.keys(SIPSEONG_MONEY_COMBO);
    const detectedCombos = moneyComboKeys
      .filter(k => sinsalNames.includes(k) || result.fourPillars.includes(k))
      .map(k => `${SIPSEONG_MONEY_COMBO[k].name}(${SIPSEONG_MONEY_COMBO[k].hanja}): ${SIPSEONG_MONEY_COMBO[k].desc}`)
      .join("; ");

    const context = [
      `사주팔자: ${result.fourPillars}`,
      `일간: ${result.pillarsDetail.day.cg}`,
      `오행 점수 — 목:${result.scores.목} 화:${result.scores.화} 토:${result.scores.토} 금:${result.scores.금} 수:${result.scores.수}`,
      `강한 오행: ${dominantStr}`,
      `신살: ${sinsalNames}`,
      `십신 요약: ${sipseongDesc || "없음"}`,
      detectedCombos ? `재물구조: ${detectedCombos}` : "",
      `성별: ${form.gender === "male" ? "남" : "여"}`,
    ].filter(Boolean).join("\n");

    setSajuContext(context);
    setMessages([{
      role: "assistant",
      content: `안녕하세요! 저는 온갖 사주 데이터를 학습한 사주 전문 AI, 월령도사입니다 🌙\n\n사주팔자를 살펴봤어요: **${result.fourPillars}**\n\n연애·재물·건강·직업적성·대운·궁합·전생 등 뭐든 편하게 물어보세요. 사주로 볼 수 있는 건 뭐든 함께 이야기해 드릴게요!`,
    }]);
    setStep("chat");
  }

  async function sendMessage() {
    const text = input.trim();
    if (!text || loading) return;

    if (stars < COST_PER_CHAT) {
      alert(`별조각이 부족합니다 (현재 ${stars}개). 별조각을 충전해주세요.`);
      return;
    }

    const newMessages: Message[] = [...messages, { role: "user", content: text }];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    const nextStars = stars - COST_PER_CHAT;
    saveStars(nextStars);
    setStars(nextStars);

    try {
      const res = await fetch("/api/chat/saju", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages, sajuContext }),
      });
      const data = await res.json();
      if (data.reply) {
        setMessages((prev: Message[]) => [...prev, { role: "assistant", content: data.reply }]);
      } else {
        setMessages((prev: Message[]) => [...prev, { role: "assistant", content: "오류가 발생했습니다. 다시 시도해주세요." }]);
      }
    } catch {
      setMessages((prev: Message[]) => [...prev, { role: "assistant", content: "네트워크 오류가 발생했습니다." }]);
    } finally {
      setLoading(false);
    }
  }

  // ── Gate ──────────────────────────────────────────────────────────────────────
  if (step === "gate") {
    return (
      <div style={{
        minHeight: "100vh", background: "#06060e", color: "#e8e0ff",
        fontFamily: "'Apple SD Gothic Neo', 'Noto Sans KR', sans-serif",
        display: "flex", flexDirection: "column", alignItems: "center",
        justifyContent: "center", padding: "24px", position: "relative", overflow: "hidden",
      }}>
        <BackButton />

        {/* 배경 오라 */}
        <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0 }}>
          <div style={{
            position: "absolute", top: "-10%", left: "50%", transform: "translateX(-50%)",
            width: 600, height: 600, borderRadius: "50%",
            background: "radial-gradient(circle, rgba(124,58,237,0.15) 0%, transparent 65%)",
          }} />
          <div style={{
            position: "absolute", bottom: "5%", right: "-5%",
            width: 350, height: 350, borderRadius: "50%",
            background: "radial-gradient(circle, rgba(99,102,241,0.1) 0%, transparent 65%)",
          }} />
        </div>

        <div style={{ maxWidth: 460, width: "100%", zIndex: 1 }}>
          {/* 상단 뱃지 */}
          <div style={{ textAlign: "center", marginBottom: 20 }}>
            <span style={{
              display: "inline-block", fontSize: 11, fontWeight: 700,
              padding: "5px 14px", borderRadius: 20,
              background: "rgba(124,58,237,0.15)", border: "1px solid rgba(124,58,237,0.4)",
              color: "#a78bfa", letterSpacing: "0.08em",
            }}>
              AI 사주 전문가
            </span>
          </div>

          {/* 메인 타이틀 */}
          <div style={{ textAlign: "center", marginBottom: 32 }}>
            <h1 style={{
              fontSize: 34, fontWeight: 900, letterSpacing: "-0.5px",
              background: "linear-gradient(135deg, #e9d5ff 0%, #c4b5fd 50%, #a78bfa 100%)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
              margin: "0 0 10px",
            }}>
              월령도사
            </h1>
            <p style={{ fontSize: 14, color: "rgba(167,139,250,0.7)", margin: 0, lineHeight: 1.6 }}>
              수십만 사주 데이터를 학습한 AI 역술가<br />
              연애·재물·대운·궁합·전생 — 뭐든 물어보세요
            </p>
          </div>

          {/* 기능 카드 3개 */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
            {[
              { icon: "💬", title: "무제한 질문", desc: "사주로 볼 수 있는 모든 것, AI가 직접 답합니다" },
              { icon: "🔯", title: "정밀 사주 분석", desc: "사주팔자 입력 후 오행·십신·신살 완전 분석" },
              { icon: "✦", title: "별조각 5개 / 회", desc: `현재 잔액 ${stars}개` },
            ].map(item => (
              <div key={item.title} style={{
                display: "flex", alignItems: "center", gap: 14,
                background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)",
                borderRadius: 12, padding: "14px 18px",
              }}>
                <span style={{ fontSize: 22, flexShrink: 0 }}>{item.icon}</span>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#d8b4fe", marginBottom: 2 }}>{item.title}</div>
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>{item.desc}</div>
                </div>
              </div>
            ))}
          </div>

          {/* 시작 버튼 */}
          <button
            onClick={() => setStep("input")}
            style={{
              width: "100%", padding: "17px",
              background: "linear-gradient(135deg, #7c3aed 0%, #6d28d9 50%, #5b21b6 100%)",
              border: "1px solid rgba(167,139,250,0.3)",
              borderRadius: 14, color: "#fff", fontSize: 16, fontWeight: 800,
              cursor: "pointer", letterSpacing: "0.3px",
              boxShadow: "0 4px 32px rgba(124,58,237,0.4), inset 0 1px 0 rgba(255,255,255,0.1)",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-2px)";
              (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 8px 40px rgba(124,58,237,0.5), inset 0 1px 0 rgba(255,255,255,0.1)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)";
              (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 4px 32px rgba(124,58,237,0.4), inset 0 1px 0 rgba(255,255,255,0.1)";
            }}
          >
            월령도사와 대화 시작 →
          </button>

          <p style={{ textAlign: "center", fontSize: 12, color: "rgba(255,255,255,0.25)", marginTop: 14 }}>
            별조각이 부족하면 홈에서 충전하세요
          </p>
        </div>
      </div>
    );
  }

  // ── Input ────────────────────────────────────────────────────────────────────
  if (step === "input") {
    return (
      <div style={{
        minHeight: "100vh", background: "#06060e", color: "#e8e0ff",
        fontFamily: "'Apple SD Gothic Neo', 'Noto Sans KR', sans-serif",
        display: "flex", flexDirection: "column", alignItems: "center",
        justifyContent: "center", padding: "24px",
      }}>
        <BackButton />
        <div style={{ maxWidth: 420, width: "100%", zIndex: 1 }}>


          <h2 style={{ fontSize: 22, fontWeight: 700, color: "#c4b5fd", margin: "0 0 6px" }}>
            사주 정보 입력
          </h2>
          <p style={{ fontSize: 13, color: "#8b7faa", margin: "0 0 28px" }}>
            정확한 분석을 위해 생년월일과 성별을 입력해주세요.
          </p>

          <form onSubmit={handleInputSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <BirthInputForm value={form} onChange={setForm} accent="#7c3aed" />

            <button
              type="submit"
              style={{
                width: "100%", padding: "16px",
                background: "linear-gradient(135deg, #7c3aed, #5b21b6)",
                border: "none", borderRadius: 14,
                color: "#fff", fontSize: 15, fontWeight: 700,
                cursor: "pointer", marginTop: 8,
                boxShadow: "0 4px 24px rgba(124,58,237,0.3)",
              }}
            >
              사주 분석 후 채팅 시작 →
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ── Chat ──────────────────────────────────────────────────────────────────────
  return (
    <div style={{
      minHeight: "100vh", background: "#06060e", color: "#e8e0ff",
      fontFamily: "'Apple SD Gothic Neo', 'Noto Sans KR', sans-serif",
      display: "flex", flexDirection: "column",
    }}>
      {/* Header */}
      <div style={{
        position: "sticky", top: 0, zIndex: 10,
        background: "rgba(6,6,14,0.95)", backdropFilter: "blur(12px)",
        borderBottom: "1px solid rgba(124,58,237,0.2)",
        padding: "12px 20px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button
            onClick={() => setStep("gate")}
            style={{ background: "none", border: "none", color: "#8b7faa", cursor: "pointer", fontSize: 18, padding: 0 }}
          >
            ←
          </button>
          <span style={{ fontSize: 16, fontWeight: 700, color: "#c4b5fd" }}>🔮 월령도사</span>
        </div>
        <div style={{
          display: "flex", alignItems: "center", gap: 6,
          background: "rgba(251,191,36,0.1)", border: "1px solid rgba(251,191,36,0.25)",
          borderRadius: 20, padding: "6px 14px",
        }}>
          <span style={{ fontSize: 14 }}>✦</span>
          <span style={{ fontSize: 14, color: "#fbbf24", fontWeight: 600 }}>{stars}</span>
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: "auto", padding: "20px 16px", display: "flex", flexDirection: "column", gap: 16 }}>
        {messages.map((msg, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
            }}
          >
            {msg.role === "assistant" && (
              <div style={{
                width: 32, height: 32, borderRadius: "50%",
                background: "linear-gradient(135deg, #7c3aed, #5b21b6)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 16, flexShrink: 0, marginRight: 8, marginTop: 2,
              }}>
                🔮
              </div>
            )}
            <div style={{
              maxWidth: "75%",
              background: msg.role === "user"
                ? "linear-gradient(135deg, #7c3aed, #5b21b6)"
                : "rgba(255,255,255,0.06)",
              border: msg.role === "user" ? "none" : "1px solid rgba(255,255,255,0.08)",
              borderRadius: msg.role === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
              padding: "12px 16px",
              fontSize: 14, lineHeight: 1.7, color: "#e8e0ff",
              whiteSpace: "pre-wrap",
            }}>
              {msg.content}
            </div>
          </div>
        ))}

        {loading && (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{
              width: 32, height: 32, borderRadius: "50%",
              background: "linear-gradient(135deg, #7c3aed, #5b21b6)",
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16,
            }}>
              🔮
            </div>
            <div style={{
              background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: "18px 18px 18px 4px", padding: "12px 16px",
            }}>
              <span style={{ color: "#8b7faa", fontSize: 14 }}>분석 중...</span>
            </div>
          </div>
        )}

        {/* Insufficient stars notice */}
        {stars < COST_PER_CHAT && !loading && (
          <div style={{
            background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.25)",
            borderRadius: 12, padding: "14px 16px", textAlign: "center",
          }}>
            <p style={{ margin: "0 0 10px", fontSize: 14, color: "#fbbf24" }}>
              ✦ 별조각이 부족합니다 (현재 {stars}개)
            </p>
            <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
              {[BUNDLE_5, BUNDLE_10].map((b) => (
                <button
                  key={b.count}
                  onClick={() => buyBundle(b.price)}
                  style={{
                    padding: "8px 14px",
                    background: "rgba(124,58,237,0.15)",
                    border: "1px solid rgba(124,58,237,0.3)",
                    borderRadius: 8, color: "#c4b5fd",
                    fontSize: 13, cursor: "pointer",
                  }}
                >
                  {b.label}
                </button>
              ))}
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input bar */}
      <div style={{
        position: "sticky", bottom: 0,
        background: "rgba(6,6,14,0.95)", backdropFilter: "blur(12px)",
        borderTop: "1px solid rgba(124,58,237,0.15)",
        padding: "12px 16px",
        display: "flex", alignItems: "flex-end", gap: 10,
      }}>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              sendMessage();
            }
          }}
          placeholder="무엇이든 물어보세요 (✦5개 소모)"
          rows={1}
          style={{
            flex: 1, background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.12)",
            borderRadius: 12, padding: "12px 14px",
            color: "#e8e0ff", fontSize: 14,
            resize: "none", outline: "none",
            fontFamily: "inherit", lineHeight: 1.5,
          }}
        />
        <button
          onClick={sendMessage}
          disabled={loading || !input.trim() || stars < COST_PER_CHAT}
          style={{
            width: 44, height: 44, flexShrink: 0,
            background: loading || !input.trim() || stars < COST_PER_CHAT
              ? "rgba(124,58,237,0.2)"
              : "linear-gradient(135deg, #7c3aed, #5b21b6)",
            border: "none", borderRadius: 12,
            color: "#fff", fontSize: 18,
            cursor: loading || !input.trim() || stars < COST_PER_CHAT ? "not-allowed" : "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            transition: "all 0.2s",
          }}
        >
          ↑
        </button>
      </div>
    </div>
  );
}

