"use client";
import PixelIcon from "@/components/PixelIcon";

// ── 훈녀생정 면책 문구 ────────────────────────────────────────────────────
// 이 앱의 내용은 그 시절 민간요법·유행을 모아 둔 추억 콘텐츠이지, 검증된
// 의학 정보가 아니다. 사용자가 따라 하기 전에 알 수 있도록 눈에 띄는 자리에
// 반복해서 노출한다.

export const DISCLAIMER_TITLE = "읽기 전에 꼭 봐주세요";

export const DISCLAIMER_LINES = [
  "여기 담긴 내용은 1990~2000년대에 인터넷과 입소문으로 퍼졌던 민간요법과 생활 정보를 추억 삼아 모아 둔 것이에요.",
  "대부분 과학적으로 검증된 방법이 아니고, 의사의 진단이나 치료를 대신할 수 없어요.",
  "피부와 몸 상태는 사람마다 달라서 같은 방법도 결과가 다르고, 자극이나 알레르기가 생길 수 있어요.",
  "따끔거리거나 붉어지는 등 이상이 느껴지면 바로 멈추고 전문가와 상담해 주세요.",
  "지병이 있거나 임신 중이거나 약을 먹는 중이라면 먼저 의사와 상의해 주세요.",
];

export const DISCLAIMER_SHORT =
  "이 앱의 내용은 그 시절 민간요법을 모은 추억 콘텐츠입니다. 과학적으로 검증된 방법이 아니며 의학적 조언을 대신하지 않아요. 따라 하다 이상이 있으면 바로 멈추고 전문가와 상담해 주세요.";

// 박스형: 화면에서 한 번은 제대로 읽히도록
export function HunnyeoDisclaimerBox() {
  return (
    <div
      className="rounded-2xl p-3.5"
      style={{ background: "#fff8e6", border: "2.5px dashed #f0a500" }}
    >
      <p
        className="hn-cute text-[14px] mb-2 flex items-center gap-1.5"
        style={{ color: "#b06a00" }}
      >
        <PixelIcon name="warning" size={15} /> {DISCLAIMER_TITLE}
      </p>
      <ul className="space-y-1.5">
        {DISCLAIMER_LINES.map((line, i) => (
          <li
            key={i}
            className="flex gap-1.5 text-[12px] leading-relaxed font-bold"
            style={{ color: "#7a5a1e" }}
          >
            <span style={{ color: "#f0a500" }}>·</span>
            <span>{line}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// 한 줄형: 페이지 아래쪽 마무리용
export function HunnyeoDisclaimerLine() {
  return (
    <p
      className="text-center text-[11px] leading-relaxed font-bold px-6"
      style={{ color: "#b58aa2" }}
    >
      {DISCLAIMER_SHORT}
    </p>
  );
}
