import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #06060e 0%, #0d0d1f 60%, #10101a 100%)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* 배경 글로우 */}
        <div style={{
          position: "absolute", top: -100, left: -100,
          width: 500, height: 500, borderRadius: "50%",
          background: "rgba(201,168,76,0.08)",
          display: "flex",
        }} />
        <div style={{
          position: "absolute", bottom: -80, right: -80,
          width: 400, height: 400, borderRadius: "50%",
          background: "rgba(99,102,241,0.07)",
          display: "flex",
        }} />

        {/* 브랜드 */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
          <div style={{
            fontSize: 20, fontWeight: 600, letterSpacing: 6,
            color: "#c9a84c", textTransform: "uppercase",
            display: "flex",
          }}>
            SUMMER PALACE
          </div>

          <div style={{
            fontSize: 68, fontWeight: 900, color: "#ffffff",
            lineHeight: 1.1, textAlign: "center",
            display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
          }}>
            <span>여름궁전</span>
            <span style={{ fontSize: 40, color: "#c9a84c", fontWeight: 700 }}>사주 명리 분석</span>
          </div>

          <div style={{
            fontSize: 22, color: "rgba(255,255,255,0.55)",
            marginTop: 12, textAlign: "center",
            display: "flex",
          }}>
            타고난 오행 에너지로 삶의 방향을 찾아드립니다
          </div>
        </div>

        {/* 하단 태그라인 */}
        <div style={{
          position: "absolute", bottom: 40,
          display: "flex", gap: 24,
        }}>
          {["사주 분석", "짝사랑 공략", "대운·세운", "길일·흉일"].map(tag => (
            <div key={tag} style={{
              padding: "8px 18px", borderRadius: 100,
              border: "1px solid rgba(201,168,76,0.3)",
              color: "rgba(255,255,255,0.45)", fontSize: 16,
              display: "flex",
            }}>
              {tag}
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size }
  );
}
