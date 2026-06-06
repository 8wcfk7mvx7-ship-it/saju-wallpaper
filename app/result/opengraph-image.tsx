import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div style={{
        width: "100%", height: "100%", display: "flex", flexDirection: "column",
        background: "linear-gradient(135deg, #06060e 0%, #0d0d1f 60%, #10101a 100%)",
        position: "relative", overflow: "hidden",
      }}>
        <div style={{
          position: "absolute", top: -120, right: -120, width: 500, height: 500,
          borderRadius: "50%", background: "rgba(201,168,76,0.1)", display: "flex",
        }} />
        <div style={{
          flex: 1, display: "flex", flexDirection: "column",
          justifyContent: "center", padding: "0 80px",
        }}>
          <div style={{
            fontSize: 16, letterSpacing: 5, color: "#c9a84c",
            marginBottom: 20, display: "flex",
          }}>
            🔮  SUMMER PALACE · 사주 명리 분석
          </div>
          <div style={{
            fontSize: 72, fontWeight: 900, color: "#ffffff",
            lineHeight: 1.1, marginBottom: 20, display: "flex",
          }}>
            내 사주의 모든 것
          </div>
          <div style={{
            fontSize: 26, color: "rgba(255,255,255,0.5)",
            lineHeight: 1.5, display: "flex", flexDirection: "column", gap: 4,
          }}>
            <span>일간 성격 · 신강·신약 체질 · 용신 오행</span>
            <span>건강 경향 · 직업 적성 · 인간관계 패턴</span>
          </div>
        </div>
        <div style={{
          padding: "24px 80px",
          borderTop: "1px solid rgba(201,168,76,0.2)",
          display: "flex", justifyContent: "space-between", alignItems: "center",
        }}>
          <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 16, display: "flex" }}>
            summerpalace.ai.kr
          </span>
          <span style={{
            padding: "10px 22px", borderRadius: 100,
            background: "rgba(201,168,76,0.15)", border: "1px solid rgba(201,168,76,0.4)",
            color: "#c9a84c", fontSize: 16, fontWeight: 700, display: "flex",
          }}>
            무료로 분석하기 →
          </span>
        </div>
      </div>
    ),
    { ...size }
  );
}
