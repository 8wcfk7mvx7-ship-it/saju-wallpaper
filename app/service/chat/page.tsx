"use client";
import BackButton from "@/components/BackButton";
import { useEffect, useRef, useState } from "react";
import { analyzeSaju, SajuResult } from "@/lib/saju";
import BirthInputForm, { BirthFormData, defaultBirthData } from "@/components/BirthInputForm";

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
    const context = [
      `사주팔자: ${result.fourPillars}`,
      `일간: ${result.pillarsDetail.day.cg}`,
      `오행 점수 — 목:${result.scores.목} 화:${result.scores.화} 토:${result.scores.토} 금:${result.scores.금} 수:${result.scores.수}`,
      `강한 오행: ${dominantStr}`,
      `신살: ${sinsalNames}`,
      `용신: ${result.yongshin.yongshin} / 희신: ${result.yongshin.heeshin} / 기신: ${result.yongshin.gishin}`,
      `성별: ${form.gender === "male" ? "남" : "여"}`,
    ].join("\n");

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
        justifyContent: "center", padding: "24px",
      }}>
        <BackButton />
        {/* Background glow */}
        <div style={{
          position: "fixed", top: "20%", left: "50%", transform: "translateX(-50%)",
          width: 400, height: 400, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(124,58,237,0.12) 0%, transparent 70%)",
          pointerEvents: "none",
        }} />

        <div style={{ maxWidth: 480, width: "100%", zIndex: 1 }}>
          {/* Icon */}
          <div style={{ textAlign: "center", marginBottom: 24 }}>
            <span style={{ fontSize: 64 }}>🔮</span>
          </div>

          {/* Title */}
          <h1 style={{
            textAlign: "center", fontSize: 28, fontWeight: 700,
            color: "#c4b5fd", margin: "0 0 8px",
          }}>
            월령도사
          </h1>
          <p style={{
            textAlign: "center", fontSize: 14, color: "#8b7faa",
            margin: "0 0 32px", lineHeight: 1.6,
          }}>
            온갖 사주 데이터를 학습한 사주 전문 AI 월령도사와 대화해 보세요
          </p>

          {/* Feature box */}
          <div style={{
            background: "rgba(124,58,237,0.08)", border: "1px solid rgba(124,58,237,0.25)",
            borderRadius: 16, padding: "20px 24px", marginBottom: 24,
          }}>
            <p style={{ margin: "0 0 12px", fontSize: 15, color: "#c4b5fd", fontWeight: 600 }}>
              모든 질문 가능
            </p>
            <p style={{ margin: "0 0 16px", fontSize: 13, color: "#9d8ccc", lineHeight: 1.7 }}>
              연애 · 재물 · 취업 · 건강 · 신살 · 대운 · 궁합 · 전생 · 죽음 등<br />
              사주로 볼 수 있는 모든 것 — AI가 거부하는 질문도 답합니다
            </p>
            <div style={{
              background: "rgba(124,58,237,0.12)", borderRadius: 10,
              padding: "12px 16px", display: "flex", alignItems: "center", gap: 8,
            }}>
              <span style={{ fontSize: 20 }}>✦</span>
              <span style={{ fontSize: 14, color: "#c4b5fd" }}>
                대화 1회 = 별조각 5개 소모
              </span>
            </div>
          </div>

          {/* Stars balance */}
          <div style={{
            background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 12, padding: "14px 20px", marginBottom: 16,
            display: "flex", alignItems: "center", justifyContent: "space-between",
          }}>
            <span style={{ fontSize: 14, color: "#8b7faa" }}>내 별조각 잔액</span>
            <span style={{ fontSize: 18, fontWeight: 700, color: "#fbbf24" }}>
              ✦ {stars}개
            </span>
          </div>

          {/* Bundle purchase */}
          <div style={{
            display: "flex", gap: 10, marginBottom: 24,
          }}>
            {[BUNDLE_5, BUNDLE_10].map((b) => (
              <button
                key={b.count}
                onClick={() => buyBundle(b.price)}
                style={{
                  flex: 1, padding: "12px 8px",
                  background: "rgba(124,58,237,0.12)",
                  border: "1px solid rgba(124,58,237,0.3)",
                  borderRadius: 10, color: "#c4b5fd",
                  fontSize: 13, cursor: "pointer",
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background = "rgba(124,58,237,0.2)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background = "rgba(124,58,237,0.12)";
                }}
              >
                <div style={{ fontWeight: 600, marginBottom: 2 }}>{b.label}</div>
                <div style={{ fontSize: 12, color: "#8b7faa" }}>✦ {b.price}개 사용</div>
              </button>
            ))}
          </div>

          {/* Start button */}
          <button
            onClick={() => setStep("input")}
            style={{
              width: "100%", padding: "16px",
              background: "linear-gradient(135deg, #7c3aed, #5b21b6)",
              border: "none", borderRadius: 14,
              color: "#fff", fontSize: 16, fontWeight: 700,
              cursor: "pointer", letterSpacing: "0.5px",
              boxShadow: "0 4px 24px rgba(124,58,237,0.3)",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-1px)";
              (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 6px 32px rgba(124,58,237,0.4)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)";
              (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 4px 24px rgba(124,58,237,0.3)";
            }}
          >
            채팅 시작하기 →
          </button>
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

