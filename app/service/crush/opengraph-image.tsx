import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div style={{
        width: "100%", height: "100%", display: "flex", flexDirection: "column",
        background: "linear-gradient(135deg, #06060e 0%, #1a0a10 50%, #0f0610 100%)",
        position: "relative", overflow: "hidden",
      }}>
        <div style={{
          position: "absolute", top: -100, left: "50%",
          width: 600, height: 600, borderRadius: "50%",
          background: "rgba(244,63,94,0.08)", display: "flex",
        }} />
        <div style={{
          flex: 1, display: "flex", flexDirection: "column",
          justifyContent: "center", padding: "0 80px",
        }}>
          <div style={{
            fontSize: 16, letterSpacing: 5, color: "#f43f5e",
            marginBottom: 20, display: "flex",
          }}>
            💘  SUMMER PALACE · 짝사랑 분석
          </div>
          <div style={{
            fontSize: 68, fontWeight: 900, color: "#ffffff",
            lineHeight: 1.1, marginBottom: 20, display: "flex",
          }}>
            짝사랑 성공 비결
          </div>
          <div style={{
            fontSize: 26, color: "rgba(255,255,255,0.5)",
            lineHeight: 1.5, display: "flex", flexDirection: "column", gap: 4,
          }}>
            <span>상대방 일간으로 분석하는 마음 공략법</span>
            <span>타이밍 · 접근법 · 절대 금물 완전 가이드</span>
          </div>
        </div>
        <div style={{
          padding: "24px 80px",
          borderTop: "1px solid rgba(244,63,94,0.2)",
          display: "flex", justifyContent: "space-between", alignItems: "center",
        }}>
          <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 16, display: "flex" }}>
            summerpalace.ai.kr
          </span>
          <span style={{
            padding: "10px 22px", borderRadius: 100,
            background: "rgba(244,63,94,0.15)", border: "1px solid rgba(244,63,94,0.4)",
            color: "#f43f5e", fontSize: 16, fontWeight: 700, display: "flex",
          }}>
            무료로 확인하기 →
          </span>
        </div>
      </div>
    ),
    { ...size }
  );
}
