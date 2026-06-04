"use client";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";

const KakaoLoginButton = dynamic(() => import("@/components/KakaoLoginButton"), { ssr: false });
const IljinCalendar = dynamic(() => import("@/components/IljinCalendar"), { ssr: false });

type Category = "전체" | "무료" | "연애·궁합" | "금전·투자" | "운명·대운" | "라이프" | "Special" | "19금";

// ── 언어 ─────────────────────────────────────────────────────────────────────
const LANGS = { ko: "한국어", en: "English", id: "Bahasa Indonesia", ta: "தமிழ்" } as const;
type Lang = keyof typeof LANGS;

const UI: Record<Lang, {
  h1: [string, string, string];
  heroSub: string;
  heroCta: string;
  servicesHeading: string;
  reviewsHeading: string;
  bannerCta: string;
  catLabel: Record<Category, string>;
  start: string;
  charging: string;
}> = {
  ko: {
    h1: ["당신의 사주,", "지금 이 순간도", "말하고 있습니다"],
    heroSub: "남들은 이미 확인했습니다. 당신만 아직 모르고 있었어요.",
    heroCta: "내 사주의 모든 것 파악하기",
    servicesHeading: "지금 바로 확인하세요",
    reviewsHeading: "실제 이용 후기",
    bannerCta: "배경화면 만들기 →",
    catLabel: { "전체": "전체", "무료": "무료", "연애·궁합": "연애·궁합", "금전·투자": "금전·투자", "운명·대운": "운명·대운", "라이프": "라이프", "Special": "Special", "19금": "19금" },
    start: "시작",
    charging: "블루베리 충전",
  },
  en: {
    h1: ["Your Saju", "is speaking to you", "right now"],
    heroSub: "Everyone else has already checked. You're the only one still in the dark.",
    heroCta: "Uncover My Full Destiny",
    servicesHeading: "Explore Services",
    reviewsHeading: "Real Reviews",
    bannerCta: "Create Wallpaper →",
    catLabel: { "전체": "All", "무료": "Free", "연애·궁합": "Love", "금전·투자": "Money", "운명·대운": "Destiny", "라이프": "Lifestyle", "Special": "Premium", "19금": "Adults" },
    start: "Start",
    charging: "Top Up",
  },
  id: {
    h1: ["Saju Anda", "sedang berbicara", "kepada Anda sekarang"],
    heroSub: "Yang lain sudah mengeceknya. Hanya Anda yang belum mengetahuinya.",
    heroCta: "Ungkap Seluruh Takdir Saya",
    servicesHeading: "Jelajahi Sekarang",
    reviewsHeading: "Ulasan Nyata",
    bannerCta: "Buat Wallpaper →",
    catLabel: { "전체": "Semua", "무료": "Gratis", "연애·궁합": "Cinta", "금전·투자": "Uang", "운명·대운": "Takdir", "라이프": "Gaya Hidup", "Special": "Premium", "19금": "Dewasa" },
    start: "Mulai",
    charging: "Isi Ulang",
  },
  ta: {
    h1: ["உங்கள் சாஜு,", "இப்போதும்", "பேசுகிறது"],
    heroSub: "மற்றவர்கள் ஏற்கனவே சரிபார்த்தனர். நீங்கள் மட்டும் இன்னும் தெரியாமல் இருக்கிறீர்கள்.",
    heroCta: "என் சாஜுவை முழுமையாக அறிக",
    servicesHeading: "இப்போதே பார்க்கவும்",
    reviewsHeading: "உண்மையான மதிப்புரைகள்",
    bannerCta: "வால்பேப்பர் உருவாக்கு →",
    catLabel: { "전체": "அனைத்தும்", "무료": "இலவசம்", "연애·궁합": "காதல்", "금전·투자": "பணம்", "운명·대운": "விதி", "라이프": "வாழ்க்கை", "Special": "சிறப்பு", "19금": "வயதுவந்தோர்" },
    start: "தொடங்கு",
    charging: "நிரப்பு",
  },
};

const CATEGORIES: { key: Category; icon: string; desc: string }[] = [
  { key: "전체",    icon: "☯",  desc: "전체 서비스" },
  { key: "무료",    icon: "",   desc: "무료 서비스" },
  { key: "연애·궁합", icon: "💑", desc: "연애·궁합" },
  { key: "금전·투자", icon: "💰", desc: "금전·재물운" },
  { key: "운명·대운", icon: "⏳", desc: "대운·세운" },
  { key: "라이프",  icon: "🌿",  desc: "라이프스타일" },
  { key: "19금",    icon: "🔞",  desc: "성인 전용" },
  { key: "Special", icon: "👑", desc: "프리미엄" },
];

// ── 후기 데이터 ───────────────────────────────────────────────────────────────
const REVIEWS = [
  { name: "이○○", region: "서울", age: "32세", text: "배경화면 바꾸고 나서 진짜 기분인지 모르겠는데 취업됐어요. 믿기 싫었는데 신기합니다.", service: "오행 배경화면", stars: 5 },
  { name: "박○○", region: "부산", age: "28세", text: "궁합 봤는데 원진살이라고 나왔어요. 헤어지고 나니까 그게 맞더라고요. 좀 더 일찍 볼걸.", service: "궁합 분석", stars: 5 },
  { name: "김○○", region: "대구", age: "45세", text: "대운 분석이 너무 정확해서 소름 돋았습니다. 40대 중반에 큰 변화 온다고 했는데 딱 맞았어요.", service: "대운·세운", stars: 5 },
  { name: "최○○", region: "인천", age: "26세", text: "MBTI랑 사주 조합 분석이 진짜 신선했어요. INFJ-갑목 조합이 이렇게 맞을 수가 없어요.", service: "MBTI×사주", stars: 5 },
  { name: "정○○", region: "광주", age: "38세", text: "주식투자 스타일 분석 보고 포트폴리오 바꿨는데 수익률이 좋아졌어요. 신기하네요.", service: "주식 분석", stars: 5 },
  { name: "한○○", region: "수원", age: "33세", text: "쓰레기 사주 극복법 읽고 진짜 울었어요. 내가 왜 힘들었는지 처음으로 이해가 됐습니다.", service: "신살 극복", stars: 5 },
  { name: "윤○○", region: "서울", age: "29세", text: "도화살 있다고 나왔는데 진짜로 갑자기 연락 오는 사람 늘었어요. 우연이라 하기엔 너무 신기해서.", service: "신살 분석", stars: 5 },
  { name: "오○○", region: "경기", age: "35세", text: "남자친구 사주 염탐했는데 바람기 위험도 B등급 나왔고 실제로 좀 자유분방한 편인데 맞더라고요.", service: "염탐하기", stars: 5 },
  { name: "강○○", region: "대전", age: "41세", text: "취향 분석에서 나한테 맞는 영화 추천해줬는데 다 좋아하는 장르야. 어떻게 알았지 진짜.", service: "취향 분석", stars: 5 },
  { name: "조○○", region: "서울", age: "24세", text: "임수일간이라 자유형이라고 했는데 너무 맞아요 ㅋㅋ 구속받으면 진짜 숨막혀.", service: "사주 분석", stars: 5 },
  { name: "신○○", region: "부산", age: "37세", text: "대운 흐름 보고 이직 타이밍 잡았어요. 결과는... 지금까지 한 결정 중 제일 잘한 것 같아요.", service: "대운·세운", stars: 5 },
  { name: "류○○", region: "울산", age: "31세", text: "홍염살이 있다고 했을 때 처음엔 뭔 소린가 했는데 설명 읽고 나니까 딱 내 얘기네요.", service: "신살 분석", stars: 5 },
  { name: "임○○", region: "서울", age: "27세", text: "MBTI는 오래 했는데 사주랑 같이 보니까 훨씬 입체적으로 나를 이해하게 됐어요.", service: "MBTI×사주", stars: 5 },
  { name: "황○○", region: "인천", age: "44세", text: "역마살 있다고 나왔는데 실제로 직장 세 번 옮기고 이사도 다섯 번 했거든요. 신기방기.", service: "신살 분석", stars: 5 },
  { name: "문○○", region: "경기", age: "22세", text: "친구한테 강력 추천해서 같이 봤는데 둘 다 입 딱 벌리고 봤어요. 분석이 무서울 정도로 맞음.", service: "사주 분석", stars: 5 },
  { name: "손○○", region: "대구", age: "39세", text: "궁합에서 비겁 관계라고 나왔는데 진짜 맨날 경쟁하고 자존심 싸움하는 커플이에요 ㅠ", service: "궁합 분석", stars: 5 },
  { name: "배○○", region: "서울", age: "33세", text: "세운 분석에서 올해 금전 흐름 주의하라고 했는데 진짜 예상치 못한 지출이 많았어요.", service: "대운·세운", stars: 5 },
  { name: "채○○", region: "광주", age: "26세", text: "경금일간이라고 원칙형이라는 게 뭔가 싫었는데 읽을수록 나맞다는 거 인정하게 됨 ㅋ", service: "사주 분석", stars: 5 },
  { name: "서○○", region: "부산", age: "48세", text: "50대 진입하는 대운 분석이 그렇게 자세히 나올 줄 몰랐어요. 준비할 수 있어서 다행입니다.", service: "대운·세운", stars: 5 },
  { name: "전○○", region: "수원", age: "30세", text: "배경화면 오행 분석 후 나무 기운 배경으로 바꿨더니 뭔가 마음이 차분해졌어요. 플라시보든 뭐든.", service: "오행 배경화면", stars: 5 },
  { name: "마○○", region: "서울", age: "25세", text: "갑자기 좋아하는 사람이 생겼는데 염탐해봤어요. 도화살 있고 편재 강함. 그냥 포기해야겠다ㅠ", service: "염탐하기", stars: 5 },
  { name: "홍○○", region: "경기", age: "36세", text: "쓰레기 사주라는 표현이 처음엔 충격이었는데 읽고 나니까 오히려 위로가 됐어요.", service: "신살 극복", stars: 5 },
  { name: "권○○", region: "대전", age: "42세", text: "일진달력 보면서 오늘 하루가 왜 이렇게 피곤했는지 이해됐어요. 흙기운 강한 날이었네요.", service: "일진달력", stars: 5 },
  { name: "안○○", region: "서울", age: "28세", text: "취향 분석이 신기한 게 진짜 내가 좋아하는 영화 장르랑 다 맞아요. 어떻게 이런 게 가능한지.", service: "취향 분석", stars: 5 },
  { name: "양○○", region: "울산", age: "34세", text: "도시 추천에서 서울이 아닌 도시 나왔는데 실제로 거기서 일하게 됐어요. 진짜인지 의심스러울 정도.", service: "도시 추천", stars: 5 },
  { name: "노○○", region: "서울", age: "23세", text: "처음엔 그냥 재미로 봤는데 일간 분석이 너무 나를 설명해서 오히려 소름이었어요.", service: "사주 분석", stars: 5 },
  { name: "장○○", region: "경기", age: "38세", text: "주식 스타일이 코인보다 ETF가 맞는다고 나왔는데 실제로 코인에서 손해 많이 봤거든요 ㅠ", service: "주식 분석", stars: 5 },
  { name: "고○○", region: "인천", age: "31세", text: "궁합에서 합이 잘 맞는다고 했는데 연애하면서도 진짜 싸우는 게 별로 없어요.", service: "궁합 분석", stars: 5 },
  { name: "하○○", region: "대구", age: "27세", text: "사주 MBTI 조합 분석이 취업 준비할 때 방향 잡는 데 진짜 도움됐어요.", service: "MBTI×사주", stars: 5 },
  { name: "탁○○", region: "서울", age: "46세", text: "홍염살 설명 보고 어릴 때 왜 그렇게 이성한테 인기가 있었는지 뒤늦게 이해가 됐습니다.", service: "신살 분석", stars: 5 },
  { name: "변○○", region: "광주", age: "29세", text: "친구들이랑 각자 사주 보고 비교했는데 진짜 각자 성격이랑 너무 맞아서 다 놀랐어요.", service: "사주 분석", stars: 5 },
  { name: "남○○", region: "부산", age: "40세", text: "40대 대운이 나쁘게 나와서 불안했는데 극복 방향도 같이 나와서 오히려 마음이 정해졌습니다.", service: "대운·세운", stars: 5 },
  { name: "심○○", region: "수원", age: "26세", text: "기토일간이라 세심하고 실용적이라는 게 100% 나야요. 가족한테 보여줬더니 다들 웃었어요.", service: "사주 분석", stars: 5 },
  { name: "엄○○", region: "서울", age: "35세", text: "역마살이랑 도화살 같이 있는 사람 분석 처음 봤는데 이게 나한테 이렇게 잘 맞을 수가.", service: "신살 분석", stars: 5 },
  { name: "원○○", region: "경기", age: "32세", text: "염탐 기능이 좀 무서운 기능이긴 한데... 알고 싶은 게 있었고 답은 얻었습니다.", service: "염탐하기", stars: 5 },
  { name: "천○○", region: "대전", age: "43세", text: "오행 배경화면 그냥 예뻐서 만들었는데 실제로 운이 좋아진 것 같은 느낌이에요. 믿거나 말거나.", service: "오행 배경화면", stars: 5 },
  { name: "방○○", region: "서울", age: "24세", text: "일진달력 보면서 기운 좋은 날 면접 잡았어요. 결과는... 합격이었습니다 ㅎㅎ", service: "일진달력", stars: 5 },
  { name: "공○○", region: "부산", age: "37세", text: "병화일간 설명에서 태양처럼 에너지 넘친다는 거 진짜예요. 주변이 다 알아요 ㅋㅋ", service: "사주 분석", stars: 5 },
  { name: "현○○", region: "인천", age: "30세", text: "쓰레기 사주 극복법 결제하고 봤는데 솔직히 돈이 아깝지 않았어요. 필요했던 말들이었어요.", service: "신살 극복", stars: 5 },
  { name: "나○○", region: "서울", age: "22세", text: "신금일간 완벽주의 성향 읽고 내가 왜 이렇게 스트레스를 받는지 이해가 됐어요ㅠㅠ", service: "사주 분석", stars: 5 },
  { name: "봉○○", region: "경기", age: "49세", text: "50대 대운 진입 전에 미리 보게 돼서 다행입니다. 준비할 게 생겼어요.", service: "대운·세운", stars: 5 },
  { name: "지○○", region: "대구", age: "27세", text: "수기운 많은 사주라 감수성 풍부하다는 게 완전 맞아요. 혼자 영화 보다가 우는 타입이거든요.", service: "사주 분석", stars: 5 },
  { name: "석○○", region: "광주", age: "33세", text: "주식 분석에서 단타보다 중장기가 맞는다고 나왔는데 그 조언 따랐더니 수익률이 달라졌어요.", service: "주식 분석", stars: 5 },
  { name: "민○○", region: "서울", age: "28세", text: "취향 분석 책 추천이 신기해요. 내가 좋아하는 책 종류랑 딱 맞는 장르로 추천해줘요.", service: "취향 분석", stars: 5 },
  { name: "길○○", region: "수원", age: "36세", text: "무토일간 안정형 맞는데 주변에서도 항상 나더러 흔들리지 않는다고 하거든요.", service: "사주 분석", stars: 5 },
  { name: "복○○", region: "부산", age: "44세", text: "궁합에서 원진살이 있는데도 지금 10년 넘게 잘 살고 있어요. 의지로 극복하는 중.", service: "궁합 분석", stars: 4 },
  { name: "항○○", region: "경기", age: "25세", text: "처음엔 그냥 심심해서 해봤는데 지금은 거의 매일 일진달력 확인하고 있어요.", service: "일진달력", stars: 5 },
  { name: "두○○", region: "인천", age: "31세", text: "을목일간이라 유연해 보여도 속은 강철이라는 표현이 진짜 나를 표현하는 최고의 문장이에요.", service: "사주 분석", stars: 5 },
  { name: "라○○", region: "서울", age: "38세", text: "도시 추천 받아서 여행 가봤는데 진짜 맞는 에너지의 도시였어요. 충전이 됐달까.", service: "도시 추천", stars: 5 },
  { name: "단○○", region: "대전", age: "29세", text: "MBTI INFP에 임수 일간이라는 조합 읽고 내가 왜 이렇게 자유로운 걸 좋아하는지 납득이 됐어요.", service: "MBTI×사주", stars: 5 },
  { name: "결○○", region: "대구", age: "34세", text: "명리학을 이렇게 쉽게 풀어주는 곳이 없었어요. 어렵게 느껴졌던 게 재미있어졌습니다.", service: "사주 분석", stars: 5 },
  { name: "미○○", region: "서울", age: "21세", text: "친구들이랑 서로 염탐 기능 써봤는데 다들 너무 맞아서 진짜냐고 물어봤어요 ㅋㅋ", service: "염탐하기", stars: 5 },
  { name: "화○○", region: "경기", age: "40세", text: "갑목일간 리더십형이라는데 회사 팀장 맡고 있어요. 맞습니다 ㅎ 근데 고집도 맞아요.", service: "사주 분석", stars: 5 },
  { name: "수○○", region: "부산", age: "26세", text: "극복법 보고 내 신살들이 단점이 아니라 특성이라는 걸 처음으로 받아들이게 됐어요.", service: "신살 극복", stars: 5 },
];

// ── 공지사항 ──────────────────────────────────────────────────────────────────
const NOTICES = [
  { date: "2026.06.03", title: "카카오 로그인 서비스 오픈", badge: "NEW", color: "#fbbf24" },
  { date: "2026.06.02", title: "대운·세운 80년 분석 서비스 출시", badge: "NEW", color: "#fbbf24" },
  { date: "2026.06.01", title: "이용약관·환불규정 개정 안내", badge: "공지", color: "#94a3b8" },
  { date: "2026.05.28", title: "일진 달력 1975~2030 신규 오픈", badge: "NEW", color: "#fbbf24" },
];

// ── 실시간 활동 알림 ──────────────────────────────────────────────────────────
const ACTIVITIES = [
  "경술일주 차○○님이 대운 흐름을 확인했습니다",
  "갑오일간 김○○님이 사주 궁합을 분석했습니다",
  "무진일주 박○○님이 오행 배경화면을 생성했습니다",
  "갑자일주 정○○님이 MBTI 조합 분석을 완료했습니다",
  "신묘일주 이○○님이 매력 분석을 마쳤습니다",
  "을해일간 최○○님이 주식 스타일을 확인했습니다",
  "임신일주 오○○님이 세운 14년 흐름을 열었습니다",
  "병술일간 한○○님이 도시 추천을 받았습니다",
  "정유일간 윤○○님이 대운 보고서를 구입했습니다",
  "계축일주 강○○님이 궁합 위험도를 확인했습니다",
];

function ContactSection() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [errMsg, setErrMsg] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) return;
    setStatus("sending");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), email: email.trim(), message: message.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrMsg(data.error || "오류가 발생했습니다");
        setStatus("error");
      } else {
        setStatus("done");
      }
    } catch {
      setErrMsg("네트워크 오류. 잠시 후 다시 시도해주세요.");
      setStatus("error");
    }
  }

  return (
    <section className="py-4">
      <div className="max-w-full">
        <div className="text-center mb-8">
          <p className="text-xs tracking-[0.18em] uppercase mb-3 font-semibold" style={{ color: "#fbbf24" }}>
            Contact
          </p>
          <h2 className="text-2xl font-black text-white mb-2">문의하기</h2>
          <p className="text-sm" style={{ color: "rgba(255,255,255,0.55)" }}>
            궁금한 점, 오류 신고 등 편하게 보내주세요.
          </p>
        </div>

        {status === "done" ? (
          <div className="text-center py-10">
            <p className="text-4xl mb-4">✅</p>
            <p className="text-white font-bold text-lg mb-2">문의가 접수되었습니다</p>
            <p className="text-sm mb-6" style={{ color: "rgba(255,255,255,0.55)" }}>
              {email}로 접수 확인 메일을 보내드렸습니다.<br />
              영업일 기준 1~2일 이내에 답변 드리겠습니다.
            </p>
            <button
              onClick={() => { setStatus("idle"); setName(""); setEmail(""); setMessage(""); }}
              className="text-xs px-4 py-2 rounded-xl border transition"
              style={{ borderColor: "rgba(255,255,255,0.20)", color: "rgba(255,255,255,0.6)" }}
            >
              새 문의 작성
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs mb-1.5 font-medium" style={{ color: "rgba(255,255,255,0.7)" }}>
                  이름 <span className="text-amber-400">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="홍길동"
                  required
                  className="w-full rounded-2xl px-4 py-3 text-sm text-white placeholder-white/30 outline-none transition focus:border-amber-500/60"
                  style={{
                    background: "rgba(255,255,255,0.07)",
                    border: "1px solid rgba(255,255,255,0.18)",
                  }}
                />
              </div>
              <div>
                <label className="block text-xs mb-1.5 font-medium" style={{ color: "rgba(255,255,255,0.7)" }}>
                  이메일 <span className="text-amber-400">*</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                  className="w-full rounded-2xl px-4 py-3 text-sm text-white placeholder-white/30 outline-none transition focus:border-amber-500/60"
                  style={{
                    background: "rgba(255,255,255,0.07)",
                    border: "1px solid rgba(255,255,255,0.18)",
                  }}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs mb-1.5 font-medium" style={{ color: "rgba(255,255,255,0.7)" }}>
                문의 내용 <span className="text-amber-400">*</span>
              </label>
              <textarea
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder="문의 내용을 자세히 적어주세요..."
                required
                rows={5}
                className="w-full rounded-2xl px-4 py-3 text-sm text-white placeholder-white/30 outline-none transition focus:border-amber-500/60 resize-y"
                style={{
                  background: "rgba(255,255,255,0.07)",
                  border: "1px solid rgba(255,255,255,0.18)",
                  minHeight: 120,
                }}
              />
            </div>

            {status === "error" && (
              <p className="text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2">
                {errMsg}
              </p>
            )}

            <div className="flex flex-col sm:flex-row items-center gap-3 pt-1">
              <button
                type="submit"
                disabled={status === "sending" || !name.trim() || !email.trim() || !message.trim()}
                className="w-full sm:w-auto px-8 py-3.5 rounded-2xl text-sm font-black transition-all active:scale-[0.98] disabled:opacity-40"
                style={{
                  background: "linear-gradient(135deg, #f59e0b, #fbbf24)",
                  color: "#1a0f00",
                  boxShadow: "0 4px 20px rgba(251,191,36,0.35)",
                }}
              >
                {status === "sending" ? "전송 중..." : "문의 보내기"}
              </button>
              <span className="text-xs" style={{ color: "rgba(255,255,255,0.45)" }}>
                또는&nbsp;
                <a
                  href="http://pf.kakao.com/_cuksX"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition-colors underline underline-offset-2"
                  style={{ color: "#fde68a" }}
                >
                  카카오 채널로 빠르게 문의
                </a>
              </span>
            </div>
            <p className="text-[10px] pt-2" style={{ color: "rgba(255,255,255,0.25)" }}>
              환불 문의는 <button onClick={() => window?.open?.("/refund","_blank")} className="underline underline-offset-2 cursor-pointer hover:opacity-70 transition">환불규정 페이지</button>를 먼저 확인해주세요.
            </p>
          </form>
        )}
      </div>
    </section>
  );
}

// ── 서비스 목록 ───────────────────────────────────────────────────────────────
const SERVICES: {
  id: string; emoji: string; title: string; viral: string; desc: string;
  tags: string[]; href: string; badge: string; color: string; badgeBg: string;
  border: string; glow: string; categories: Category[]; saleSticker?: string;
}[] = [
  {
    id: "saju", emoji: "🔮",
    title: "사주 오행 배경화면",
    viral: "지금 배경화면이 에너지를 갉아먹고 있을 수 있습니다",
    desc: "내 사주에 부족한 오행을 채워주는 AI 맞춤 배경화면. 목·화·토·금·수 중 내가 보완해야 할 기운을 찾아드립니다.",
    tags: ["AI 생성", "오행 보정", "모바일·PC"],
    href: "/saju", badge: "분석 무료",
    color: "#a78bfa", badgeBg: "rgba(99,102,241,0.85)",
    border: "rgba(139,92,246,0.3)", glow: "rgba(99,102,241,0.15)",
    categories: ["전체", "라이프"],
    saleSticker: "50% OFF",
  },
  {
    id: "gunghap", emoji: "💑",
    title: "사주 궁합 분석",
    viral: "지금 만나는 사람, 내 에너지를 갉아먹는 사주일 수 있어요",
    desc: "원진살·귀문관살·합충 관계로 보는 깊은 궁합. 바람기 DNA부터 이별 위험도까지 전부 분석합니다.",
    tags: ["원진살", "합충", "바람기 분석"],
    href: "/gunghap", badge: "무료",
    color: "#f9a8d4", badgeBg: "rgba(139,92,246,0.85)",
    border: "rgba(236,72,153,0.3)", glow: "rgba(236,72,153,0.12)",
    categories: ["전체", "무료", "연애·궁합"],
  },
  {
    id: "spy", emoji: "🕵️",
    title: "애인 사주 염탐하기",
    viral: "당신의 편은 들지 않습니다. 오직 사실만 말합니다.",
    desc: "바람기·도화살·불륜 가능성까지. 매운맛 분석입니다. 애인의 생년월일만 입력하세요.",
    tags: ["바람기", "도화살", "이성 관계"],
    href: "/spy", badge: "무료",
    color: "#f87171", badgeBg: "rgba(220,38,38,0.85)",
    border: "rgba(239,68,68,0.3)", glow: "rgba(239,68,68,0.12)",
    categories: ["전체", "무료", "연애·궁합", "19금"],
  },
  {
    id: "eros", emoji: "🌹",
    title: "나의 성적 매력은?",
    viral: "홍염살·목욕·도화살. 타고난 이성 매력의 진짜 본질",
    desc: "외모·음기·은근한 매력·꼬시는 팁까지. 사주로 보는 나의 성적 매력 완전 분석.",
    tags: ["홍염살", "도화살", "이성 매력"],
    href: "/eros", badge: "무료",
    color: "#f472b6", badgeBg: "rgba(236,72,153,0.85)",
    border: "rgba(244,114,182,0.3)", glow: "rgba(244,114,182,0.12)",
    categories: ["전체", "무료", "연애·궁합", "19금"],
  },
  {
    id: "hotcompat", emoji: "🔥",
    title: "19금 사주 궁합",
    viral: "정임합·자오충·인오술합. 성적 케미의 진짜 순위",
    desc: "두 사람의 성적 케미를 사주로 분석합니다. 정임암합부터 자오충까지 완전 공개.",
    tags: ["정임합", "자오충", "성적 케미"],
    href: "/hotcompat", badge: "무료",
    color: "#fb7185", badgeBg: "rgba(244,63,94,0.85)",
    border: "rgba(251,113,133,0.3)", glow: "rgba(251,113,133,0.12)",
    categories: ["전체", "무료", "연애·궁합", "19금"],
  },
  {
    id: "charm", emoji: "✨",
    title: "사주 매력 분석",
    viral: "본인만 모르는 숨겨진 이성 매력이 있습니다",
    desc: "도화살·홍염살·12운성으로 보는 이성 매력. 나도 몰랐던 타고난 매력 포인트를 완전히 공개합니다.",
    tags: ["도화살", "홍염살", "이성운"],
    href: "/charm", badge: "₩1,900",
    color: "#fda4af", badgeBg: "rgba(225,29,72,0.85)",
    border: "rgba(244,63,94,0.3)", glow: "rgba(244,63,94,0.12)",
    categories: ["전체", "연애·궁합"],
  },
  {
    id: "mbti", emoji: "🧬",
    title: "사주 × MBTI 조합",
    viral: "MBTI만으로는 절반밖에 모릅니다",
    desc: "사주 오행 + MBTI 16유형의 시너지 분석. 타고난 나를 두 가지 렌즈로 완전 해석하고 최적 직업을 제안합니다.",
    tags: ["MBTI", "성격 분석", "직업 추천"],
    href: "/mbti", badge: "무료",
    color: "#e879f9", badgeBg: "rgba(162,28,175,0.9)",
    border: "rgba(217,70,239,0.3)", glow: "rgba(217,70,239,0.12)",
    categories: ["전체", "무료", "연애·궁합", "라이프"],
  },
  {
    id: "stock", emoji: "📈",
    title: "사주로 보는 주식 스타일",
    viral: "말아먹는 사주가 따로 있습니다. 지금 확인하세요",
    desc: "오행·12운성으로 보는 투자 DNA. ETF·개별주·코인·레버리지 중 내 사주에 맞는 투자 방식을 찾아드립니다.",
    tags: ["주식", "코인", "ETF·레버리지"],
    href: "/stock", badge: "무료",
    color: "#6ee7b7", badgeBg: "rgba(5,150,105,0.9)",
    border: "rgba(16,185,129,0.3)", glow: "rgba(16,185,129,0.12)",
    categories: ["전체", "무료", "금전·투자"],
  },
  {
    id: "daewoon", emoji: "⏳",
    title: "대운·세운 80년 분석",
    viral: "내 인생이 몇 살에 터지는지 AI가 직접 알려줍니다",
    desc: "10년 단위 대운 8개, 세운 14년 흐름, 교운기 리스크까지. 당신의 인생 타임라인을 완전히 해석합니다.",
    tags: ["대운", "세운", "교운기 전략"],
    href: "/daewoon", badge: "₩15,000",
    color: "#fbbf24", badgeBg: "rgba(161,98,7,0.9)",
    border: "rgba(202,138,4,0.3)", glow: "rgba(161,98,7,0.15)",
    categories: ["전체", "금전·투자", "운명·대운", "Special"],
    saleSticker: "50% OFF",
  },
  {
    id: "place", emoji: "🌍",
    title: "내 사주에 맞는 도시·나라",
    viral: "지금 사는 곳이 내 기운과 안 맞을 수 있습니다",
    desc: "용신 오행 방위로 찾는 최적의 거주지. 해외 이민·유학·출장에 유리한 나라를 오행 분석으로 추천합니다.",
    tags: ["거주지", "해외 추천", "용신 방위"],
    href: "/place", badge: "₩990",
    color: "#a5b4fc", badgeBg: "rgba(109,40,217,0.9)",
    border: "rgba(139,92,246,0.3)", glow: "rgba(99,102,241,0.12)",
    categories: ["전체", "운명·대운", "라이프", "Special"],
    saleSticker: "50% OFF",
  },
  {
    id: "overcome", emoji: "⚡",
    title: "쓰레기 사주 극복법",
    viral: "역마살·귀문관살도 방향 맞으면 최강 무기입니다",
    desc: "내 신살과 오행 불균형을 제대로 알고 극복하는 완벽 가이드. 나쁜 사주도 방향 틀면 달라집니다.",
    tags: ["신살 극복", "오행 보완", "개운법"],
    href: "/overcome", badge: "무료",
    color: "#fca5a5", badgeBg: "rgba(185,28,28,0.9)",
    border: "rgba(239,68,68,0.3)", glow: "rgba(239,68,68,0.12)",
    categories: ["전체", "무료", "운명·대운"],
  },
  {
    id: "calendar", emoji: "📅",
    title: "길일 찾기",
    viral: "결정의 날짜를 고르면 결과가 달라집니다",
    desc: "이사·결혼·시험·개업·계약·수술·여행·투자·연애·임신 — 내 사주와 맞는 최적의 날짜를 찾아드립니다.",
    tags: ["길일", "날짜 선택", "이사·결혼·시험"],
    href: "/calendar", badge: "무료",
    color: "#7dd3fc", badgeBg: "rgba(2,132,199,0.9)",
    border: "rgba(14,165,233,0.3)", glow: "rgba(14,165,233,0.12)",
    categories: ["전체", "무료", "운명·대운", "라이프"],
  },
  {
    id: "taste", emoji: "🎬",
    title: "사주로 보는 취향 분석",
    viral: "내가 왜 그 영화에 울었는지 사주로 설명됩니다",
    desc: "오행별 영화·책·음악·여행 취향 완전 분석. 지금까지 좋아했던 것들이 사주로 다 설명됩니다.",
    tags: ["영화", "책", "여행 스타일"],
    href: "/taste", badge: "무료",
    color: "#fcd34d", badgeBg: "rgba(180,83,9,0.9)",
    border: "rgba(245,158,11,0.3)", glow: "rgba(245,158,11,0.12)",
    categories: ["전체", "무료", "라이프"],
  },
];

// ── 카드 컴포넌트 ─────────────────────────────────────────────────────────────
function ServiceCard({ svc, index, startLabel }: { svc: typeof SERVICES[0]; index: number; startLabel: string }) {
  const router = useRouter();
  const [hovered, setHovered] = useState(false);
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.1 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className="relative">
      {/* 50% OFF 거친 테이프 스티커 */}
      {svc.saleSticker && (
        <div className="absolute -top-3 -right-2 z-20 rotate-[8deg] pointer-events-none select-none" style={{ filter: "drop-shadow(0 2px 6px rgba(185,28,28,0.7))" }}>
          <svg width="80" height="28" viewBox="0 0 80 28" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* 왼쪽 거친 찢김 */}
            <path d="M0 8 Q1 5 3 9 Q5 13 7 7 Q9 1 11 6 Q13 11 15 5 L15 23 Q13 27 11 22 Q9 17 7 21 Q5 25 3 19 Q1 13 0 18 Z" fill="#991b1b"/>
            {/* 몸통 */}
            <rect x="13" y="2" width="52" height="24" fill="#dc2626"/>
            {/* 오른쪽 거친 찢김 */}
            <path d="M65 2 L65 26 Q67 22 69 27 Q71 32 73 26 Q75 20 77 25 Q79 30 80 27 L80 7 Q79 3 77 7 Q75 11 73 5 Q71 -1 69 4 Q67 9 65 2 Z" fill="#991b1b"/>
            {/* 테이프 반투명 광택 */}
            <rect x="13" y="2" width="52" height="9" fill="rgba(255,255,255,0.10)"/>
            {/* 가로줄 텍스처 */}
            <rect x="13" y="13" width="52" height="1" fill="rgba(0,0,0,0.08)"/>
            <text x="40" y="19" textAnchor="middle" fill="white" fontSize="10.5" fontWeight="900" fontFamily="Arial Black, Arial, sans-serif" letterSpacing="1">
              {svc.saleSticker}
            </text>
          </svg>
        </div>
      )}

      <div
        onClick={() => router.push(svc.href)}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? "translateY(0)" : "translateY(24px)",
          transition: `opacity 0.7s ease ${index * 60}ms, transform 0.7s cubic-bezier(0.22,1,0.36,1) ${index * 60}ms`,
          borderColor: hovered ? svc.border : "rgba(255,255,255,0.07)",
          boxShadow: hovered ? `0 8px 40px ${svc.glow}, inset 0 1px 0 rgba(255,255,255,0.06)` : "inset 0 1px 0 rgba(255,255,255,0.03)",
          background: hovered ? `radial-gradient(ellipse at top left, ${svc.glow} 0%, rgba(10,10,20,0.95) 60%)` : "rgba(10,10,20,0.6)",
        }}
        className="relative border rounded-2xl p-5 cursor-pointer transition-all duration-400 flex flex-col gap-3 backdrop-blur-sm"
      >
        {/* 뱃지 */}
        <div className="flex items-start justify-between">
          <div
            className="text-3xl w-12 h-12 flex items-center justify-center rounded-xl shrink-0"
            style={{ background: "rgba(255,255,255,0.05)", border: `1px solid ${svc.border}` }}
          >
            {svc.emoji}
          </div>
          <span
            className="text-xs font-black px-2.5 py-1 rounded-full text-white"
            style={{ background: svc.badgeBg }}
          >
            {svc.badge}
          </span>
        </div>

        <div>
          <h3 className="text-base font-black text-white mb-1 leading-tight">{svc.title}</h3>
          <p className="text-xs font-semibold mb-2" style={{ color: svc.color }}>
            &ldquo;{svc.viral}&rdquo;
          </p>
          <p className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.42)" }}>
            {svc.desc}
          </p>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex flex-wrap gap-1">
            {svc.tags.map(tag => (
              <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full"
                style={{ background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.35)", border: "1px solid rgba(255,255,255,0.07)" }}>
                {tag}
              </span>
            ))}
          </div>
          <span
            className="text-xs font-bold flex items-center gap-1 shrink-0"
            style={{ color: svc.color }}
          >
            {startLabel}
            <span style={{ transform: hovered ? "translateX(4px)" : "translateX(0)", transition: "transform 0.2s ease", display: "inline-block" }}>→</span>
          </span>
        </div>
      </div>
    </div>
  );
}

// ── 메인 ─────────────────────────────────────────────────────────────────────
export default function MainPage() {
  const router = useRouter();
  const [counter] = useState(() => {
    if (typeof window === "undefined") return 12000;
    const stored = parseInt(localStorage.getItem("sp_main_counter") ?? "0", 10);
    const base = stored >= 10000 ? stored : 12000;
    const next = Math.min(base + Math.floor(Math.random() * 3) + 1, 29800);
    localStorage.setItem("sp_main_counter", String(next));
    return next;
  });
  const [todayCounter] = useState(() => {
    const minuteOfDay = new Date().getHours() * 60 + new Date().getMinutes();
    return 180 + Math.floor(minuteOfDay / 4) + Math.floor(Math.random() * 8);
  });
  const [activityIndex, setActivityIndex] = useState(0);
  const [activityVisible, setActivityVisible] = useState(true);
  const [noticeIndex, setNoticeIndex] = useState(0);
  const [noticeVisible, setNoticeVisible] = useState(true);
  const [activeCategory, setActiveCategory] = useState<Category>("전체");

  // 언어
  const [lang, setLang] = useState<Lang>("ko");
  const [showLangMenu, setShowLangMenu] = useState(false);
  const langMenuRef = useRef<HTMLDivElement>(null);

  // 블루베리 잔액
  const [blueberries, setBlueberries] = useState(0);

  const t = UI[lang];

  useEffect(() => {
    const savedLang = localStorage.getItem("sp_lang") as Lang | null;
    if (savedLang && savedLang in LANGS) setLang(savedLang);
    const bb = parseInt(localStorage.getItem("sp_blueberries") ?? "0", 10);
    setBlueberries(isNaN(bb) ? 0 : bb);
  }, []);

  useEffect(() => {
    if (!showLangMenu) return;
    const handleClick = (e: MouseEvent) => {
      if (langMenuRef.current && !langMenuRef.current.contains(e.target as Node)) {
        setShowLangMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showLangMenu]);

  useEffect(() => {
    fetch("/api/track", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ page: "/" }) }).catch(() => {});
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setActivityVisible(false);
      setTimeout(() => {
        setActivityIndex(i => (i + 1) % ACTIVITIES.length);
        setActivityVisible(true);
      }, 400);
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setNoticeVisible(false);
      setTimeout(() => {
        setNoticeIndex(i => (i + 1) % NOTICES.length);
        setNoticeVisible(true);
      }, 350);
    }, 1500);
    return () => clearInterval(interval);
  }, []);

  return (
    <main className="min-h-screen bg-[#06060e] text-white">

      {/* ── 배경 글로우 ── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[900px] h-[900px] rounded-full bg-indigo-950/50 blur-[250px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[800px] h-[800px] rounded-full bg-violet-950/40 blur-[220px]" />
        <div className="absolute top-[40%] left-[30%] w-[500px] h-[500px] rounded-full blur-[180px]" style={{ background: "rgba(201,168,76,0.03)" }} />
      </div>

      {/* ── 상단 네비게이션 ── */}
      <nav className="sticky top-0 z-50 border-b border-white/[0.06] backdrop-blur-xl"
        style={{ background: "rgba(6,6,14,0.85)" }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <button onClick={() => router.push("/")} className="flex items-center gap-2.5">
            <span className="text-lg" style={{ color: "#c9a84c" }}>☯</span>
            <span className="font-black text-base tracking-tight text-white">Summer Palace</span>
            <span className="hidden sm:block text-xs px-2 py-0.5 rounded-full font-medium"
              style={{ background: "rgba(201,168,76,0.12)", color: "#c9a84c", border: "1px solid rgba(201,168,76,0.25)" }}>
              AI 사주
            </span>
          </button>

          <div className="flex items-center gap-2">
            {/* 보관함 — PC only */}
            <button
              onClick={() => router.push("/mypage")}
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-bold transition-colors hover:bg-amber-500/15"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.45)" }}
            >
              <span>📂</span>
              <span>보관함</span>
            </button>
            {/* 블루베리 잔액/충전 */}
            <button
              onClick={() => router.push("/charge")}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-bold transition-colors hover:bg-indigo-500/20"
              style={{
                background: blueberries > 0 ? "rgba(99,102,241,0.15)" : "rgba(255,255,255,0.04)",
                border: blueberries > 0 ? "1px solid rgba(99,102,241,0.35)" : "1px solid rgba(255,255,255,0.08)",
                color: blueberries > 0 ? "#a78bfa" : "rgba(255,255,255,0.4)",
              }}
            >
              <span>🫐</span>
              <span className="hidden sm:inline">
                {blueberries > 0 ? blueberries.toLocaleString() : t.charging}
              </span>
              <span className="sm:hidden">
                {blueberries > 0 ? blueberries.toLocaleString() : "+"}
              </span>
            </button>

            {/* 언어 선택기 */}
            <div ref={langMenuRef} className="relative">
              <button
                onClick={() => setShowLangMenu(v => !v)}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-bold transition-colors"
                style={{
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  color: "rgba(255,255,255,0.55)",
                }}
              >
                <span>🌐</span>
                <span className="hidden sm:inline">{LANGS[lang]}</span>
                <span className="sm:hidden">{lang.toUpperCase()}</span>
                <span style={{ fontSize: 7, opacity: 0.6 }}>▼</span>
              </button>

              {showLangMenu && (
                <div
                  className="absolute right-0 top-full mt-2 rounded-xl overflow-hidden z-50"
                  style={{
                    background: "rgba(12,12,24,0.98)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    boxShadow: "0 16px 48px rgba(0,0,0,0.6)",
                    minWidth: 170,
                  }}
                >
                  {(Object.entries(LANGS) as [Lang, string][]).map(([code, name]) => (
                    <button
                      key={code}
                      onClick={() => {
                        setLang(code);
                        localStorage.setItem("sp_lang", code);
                        setShowLangMenu(false);
                      }}
                      className="w-full text-left px-4 py-3 text-sm transition-colors"
                      style={{
                        color: code === lang ? "#c9a84c" : "rgba(255,255,255,0.65)",
                        background: code === lang ? "rgba(201,168,76,0.07)" : "transparent",
                        borderBottom: "1px solid rgba(255,255,255,0.05)",
                      }}
                    >
                      {name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <KakaoLoginButton redirectTo="/" />
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 pb-20">

        {/* ── 히어로 섹션 ── */}
        <section className="py-14 sm:py-20 text-center relative">
          {/* 실시간 활동 알림 */}
          <div className="flex justify-center mb-6">
            <div className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
              <span
                style={{
                  color: "rgba(255,255,255,0.5)",
                  opacity: activityVisible ? 1 : 0,
                  transition: "opacity 0.4s ease",
                }}
              >
                {ACTIVITIES[activityIndex]}
              </span>
            </div>
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black leading-[1.1] mb-5 tracking-tight"
            style={{
              background: "linear-gradient(160deg, #ffffff 0%, rgba(255,255,255,0.9) 40%, rgba(201,168,76,0.75) 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}>
            {t.h1[0]}<br />
            <span style={{ WebkitTextFillColor: "#c9a84c" }}>{t.h1[1]}</span><br />
            {t.h1[2]}
          </h1>

          <p className="text-sm sm:text-base max-w-md mx-auto mb-3 leading-relaxed"
            style={{ color: "rgba(255,255,255,0.42)" }}>
            {t.heroSub}
          </p>

          {/* 강렬한 바이럴 카피 */}
          <div className="max-w-xl mx-auto mb-8 space-y-2">
            {[
              "내 사주에 맞는 배경화면이 따로 있습니다 — 지금 쓰는 배경화면이 기운을 막고 있을 수 있어요",
              "인오술 삼합이라도 자오충 앞에서는 무너집니다 — 궁합, 가볍게 넘기지 마세요",
              "대운 터지는 나이가 정해져 있습니다 — 내가 몇 살에 운이 열리는지 알고 싶지 않으세요?",
            ].map((copy, i) => (
              <div key={i} className="text-xs text-left rounded-xl px-4 py-2.5 flex items-start gap-2"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.45)" }}>
                <span style={{ color: "#c9a84c" }} className="shrink-0 mt-0.5">✦</span>
                <span>{copy}</span>
              </div>
            ))}
          </div>

          {/* 통계 */}
          <div className="flex items-center justify-center gap-0 mb-8">
            {[
              { label: "누적 분석", value: `${counter.toLocaleString()}명` },
              { label: "오늘 방문", value: `${todayCounter.toLocaleString()}명` },
              { label: "만족도", value: "98.3%" },
              { label: "평균 분석", value: "3분" },
            ].map((s, i) => (
              <div key={i} className="flex items-center">
                <div className="text-center px-4 sm:px-6">
                  <p className="text-lg sm:text-xl font-black" style={{ color: "#e8c97a" }}>{s.value}</p>
                  <p className="text-[10px] mt-0.5" style={{ color: "rgba(255,255,255,0.3)" }}>{s.label}</p>
                </div>
                {i < 3 && <div className="w-px h-8" style={{ background: "rgba(201,168,76,0.15)" }} />}
              </div>
            ))}
          </div>

          <button
            onClick={() => router.push("/saju")}
            className="inline-flex items-center gap-2 font-black text-base px-8 py-4 rounded-2xl transition-all duration-300 hover:scale-105 active:scale-95"
            style={{
              background: "linear-gradient(135deg, #7c3aed, #c9a84c)",
              color: "#fff",
              boxShadow: "0 8px 32px rgba(124,58,237,0.35)",
            }}
          >
            {t.heroCta}
            <span>→</span>
          </button>

          {/* ── 히어로 하단 카테고리 퀵메뉴 ── */}
          <div className="mt-10 relative">
            <p className="text-sm font-bold mb-3 tracking-wide" style={{ color: "rgba(255,255,255,0.55)" }}>카테고리로 찾기 ↓</p>
            <div className="flex gap-2 justify-center flex-wrap">
              {CATEGORIES.map(({ key, icon }) => (
                <button
                  key={key}
                  onClick={() => {
                    setActiveCategory(key);
                    document.getElementById("services-section")?.scrollIntoView({ behavior: "smooth" });
                  }}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all duration-200"
                  style={{
                    background: activeCategory === key ? "rgba(201,168,76,0.15)" : "rgba(255,255,255,0.04)",
                    border: activeCategory === key ? "1px solid rgba(201,168,76,0.3)" : "1px solid rgba(255,255,255,0.07)",
                    color: activeCategory === key ? "#e8c97a" : "rgba(255,255,255,0.4)",
                  }}
                >
                  <span>{icon}</span>
                  <span className="hidden sm:inline">{t.catLabel[key]}</span>
                  <span className="sm:hidden">{t.catLabel[key]}</span>
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* ── 공지사항 (1줄 롤링) ── */}
        <section className="mb-10">
          <div
            className="flex items-center gap-3 px-4 py-2.5 rounded-xl cursor-pointer hover:bg-white/[0.03] transition-colors"
            style={{ background: "rgba(10,10,20,0.5)", border: "1px solid rgba(255,255,255,0.07)" }}
            onClick={() => router.push("/notice")}
          >
            <span className="text-xs font-bold shrink-0" style={{ color: "#fbbf24" }}>📢</span>
            <span
              className="text-xs font-bold shrink-0 px-2 py-0.5 rounded-full"
              style={{
                background: NOTICES[noticeIndex].badge === "NEW" ? "rgba(251,191,36,0.15)" : "rgba(255,255,255,0.06)",
                color: NOTICES[noticeIndex].color,
                transition: "opacity 0.35s ease",
                opacity: noticeVisible ? 1 : 0,
              }}
            >
              {NOTICES[noticeIndex].badge}
            </span>
            <span
              className="text-xs flex-1 truncate"
              style={{
                color: "rgba(255,255,255,0.6)",
                transition: "opacity 0.35s ease",
                opacity: noticeVisible ? 1 : 0,
              }}
            >
              {NOTICES[noticeIndex].title}
            </span>
            <span className="text-gray-600 text-xs shrink-0">›</span>
          </div>
        </section>

        {/* ── 서비스 섹션 ── */}
        <section id="services-section" className="mb-14">
          <div className="flex items-end justify-between mb-4">
            <div>
              <p className="text-xs font-semibold mb-1" style={{ color: "#c9a84c" }}>AI SERVICES</p>
              <h2 className="text-xl sm:text-2xl font-black text-white">{t.servicesHeading}</h2>
            </div>
            <span className="text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>
              {SERVICES.filter(s => s.categories.includes(activeCategory)).length}가지 서비스
            </span>
          </div>

          {/* ── 카테고리 필터 탭 ── */}
          <div className="relative mb-5">
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none"
              style={{ msOverflowStyle: "none", scrollbarWidth: "none" }}>
              {CATEGORIES.map(({ key, icon }) => {
                const isActive = activeCategory === key;
                const count = key === "전체" ? SERVICES.length : SERVICES.filter(s => s.categories.includes(key)).length;
                return (
                  <button
                    key={key}
                    onClick={() => setActiveCategory(key)}
                    className="shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all duration-200 whitespace-nowrap"
                    style={{
                      background: isActive
                        ? key === "Special" ? "linear-gradient(135deg, rgba(201,168,76,0.25), rgba(161,98,7,0.3))"
                          : key === "무료" ? "rgba(16,185,129,0.2)"
                          : key === "연애·궁합" ? "rgba(236,72,153,0.2)"
                          : key === "금전·투자" ? "rgba(16,185,129,0.2)"
                          : key === "운명·대운" ? "rgba(202,138,4,0.2)"
                          : key === "라이프" ? "rgba(99,102,241,0.2)"
                          : "rgba(255,255,255,0.1)"
                        : key === "무료" ? "rgba(16,185,129,0.07)" : key === "Special" ? "rgba(201,168,76,0.06)" : "rgba(255,255,255,0.04)",
                      border: isActive
                        ? key === "Special" ? "1px solid rgba(201,168,76,0.4)"
                          : key === "무료" ? "1px solid rgba(16,185,129,0.35)"
                          : key === "연애·궁합" ? "1px solid rgba(236,72,153,0.35)"
                          : key === "금전·투자" ? "1px solid rgba(16,185,129,0.35)"
                          : key === "운명·대운" ? "1px solid rgba(202,138,4,0.35)"
                          : key === "라이프" ? "1px solid rgba(99,102,241,0.35)"
                          : "1px solid rgba(255,255,255,0.18)"
                        : key === "무료" ? "1px solid rgba(16,185,129,0.2)" : key === "Special" ? "1px solid rgba(201,168,76,0.2)" : "1px solid rgba(255,255,255,0.07)",
                      color: isActive
                        ? key === "Special" ? "#e8c97a"
                          : key === "무료" ? "#6ee7b7"
                          : key === "연애·궁합" ? "#f9a8d4"
                          : key === "금전·투자" ? "#6ee7b7"
                          : key === "운명·대운" ? "#fbbf24"
                          : key === "라이프" ? "#a78bfa"
                          : "rgba(255,255,255,0.9)"
                        : key === "무료" ? "rgba(52,211,153,0.8)" : key === "Special" ? "rgba(232,201,122,0.7)" : "rgba(255,255,255,0.38)",
                    }}
                  >
                    <span>{icon}</span>
                    <span>{t.catLabel[key]}</span>
                    {isActive && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full font-black"
                        style={{ background: "rgba(255,255,255,0.12)" }}>
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
            {/* 오른쪽 페이드 */}
            <div className="absolute right-0 top-0 bottom-1 w-8 pointer-events-none"
              style={{ background: "linear-gradient(to right, transparent, #06060e)" }} />
          </div>

          {/* 데스크탑: 2컬럼, 모바일: 1컬럼 — 카드 overflow 허용으로 스티커 노출 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 overflow-visible">
            {SERVICES
              .filter(s => s.categories.includes(activeCategory))
              .map((svc, i) => (
                <ServiceCard key={svc.id} svc={svc} index={i} startLabel={t.start} />
              ))}
          </div>

          {SERVICES.filter(s => s.categories.includes(activeCategory)).length === 0 && (
            <div className="text-center py-16 text-gray-600 text-sm">
              준비 중인 서비스입니다
            </div>
          )}
        </section>

        {/* ── 바이럴 띠 배너 ── */}
        <section className="mb-14 -mx-4 sm:-mx-6">
          <div className="relative py-10 sm:py-14 px-6 sm:px-12 text-center overflow-hidden"
            style={{ background: "linear-gradient(135deg, rgba(124,58,237,0.18) 0%, rgba(10,10,20,0.9) 40%, rgba(201,168,76,0.12) 100%)", borderTop: "1px solid rgba(201,168,76,0.15)", borderBottom: "1px solid rgba(201,168,76,0.15)" }}>
            <div className="absolute inset-0 flex items-center justify-center opacity-[0.025] text-[220px] font-black select-none pointer-events-none"
              style={{ fontFamily: "'Noto Serif KR', serif" }}>☯</div>
            <p className="text-xs font-semibold mb-3 tracking-widest uppercase" style={{ color: "rgba(201,168,76,0.65)" }}>Before & After</p>
            <h3 className="text-xl sm:text-3xl font-black text-white mb-4 leading-snug">
              &ldquo;몰랐던 내 사주의 진실을 알고 나서<br />
              <span style={{ color: "#c9a84c" }}>처음으로 방향이 보였습니다&rdquo;</span>
            </h3>
            <p className="text-sm max-w-md mx-auto" style={{ color: "rgba(255,255,255,0.4)" }}>
              사주는 운명을 바꾸는 도구가 아닙니다.<br />
              타고난 에너지를 이해하고, 그에 맞게 살아가는 나침반입니다.
            </p>
          </div>
        </section>

        {/* ── 후기 게시판 ── */}
        <section className="mb-14">
          <style>{`
            @keyframes reviewTicker {
              0% { transform: translateX(0); }
              100% { transform: translateX(-50%); }
            }
            .review-ticker:hover { animation-play-state: paused; }
          `}</style>

          <div className="flex items-end justify-between mb-5">
            <div>
              <p className="text-xs font-semibold mb-1" style={{ color: "#c9a84c" }}>REVIEWS</p>
              <h2 className="text-xl sm:text-2xl font-black text-white">{t.reviewsHeading}</h2>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-yellow-400 text-sm">★★★★★</span>
              <span className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>4.9 / 5.0</span>
            </div>
          </div>

          {/* 무한 가로 스크롤 필름 */}
          <div className="overflow-hidden -mx-4 sm:-mx-6">
            <div
              className="review-ticker flex gap-3 py-2"
              style={{ animation: "reviewTicker 180s linear infinite", width: "max-content" }}
            >
              {[...REVIEWS, ...REVIEWS].map((r, i) => (
                <div key={i} className="w-72 shrink-0 rounded-2xl p-4 flex flex-col gap-3"
                  style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-bold text-white">{r.name}</p>
                      <p className="text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>{r.region} · {r.age}</p>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full shrink-0"
                      style={{ background: "rgba(201,168,76,0.1)", color: "#c9a84c", border: "1px solid rgba(201,168,76,0.2)" }}>
                      {r.service}
                    </span>
                  </div>
                  <div className="flex gap-0.5">
                    {Array.from({ length: r.stars }).map((_, j) => (
                      <span key={j} className="text-yellow-400 text-xs">★</span>
                    ))}
                  </div>
                  <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.6)" }}>
                    &ldquo;{r.text}&rdquo;
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── 하단 CTA ── */}
        <section className="text-center py-10">
          <p className="text-xs mb-2" style={{ color: "rgba(255,255,255,0.25)" }}>
            더 많은 AI 서비스가 준비 중입니다
          </p>
          <div className="flex justify-center gap-2 mb-8">
            {[0,1,2].map(i => (
              <span key={i} className="w-1 h-1 rounded-full" style={{ background: "rgba(201,168,76,0.3)" }} />
            ))}
          </div>
        </section>

      </div>

      {/* ── 일진달력 + 문의하기 (PC 나란히 / 모바일 세로) ── */}
      <section className="border-t" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="rounded-2xl p-6" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.09)" }}>
            <IljinCalendar />
          </div>
          <div className="rounded-2xl p-6" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.09)" }}>
            <ContactSection />
          </div>
        </div>
      </section>

      {/* ── 푸터 ── */}
      <footer className="border-t pt-8 pb-40 sm:pb-8" style={{ borderColor: "rgba(255,255,255,0.06)", background: "rgba(6,6,14,0.9)" }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs mb-6"
            style={{ color: "rgba(255,255,255,0.35)" }}>
            <button onClick={() => router.push("/terms")} className="hover:text-amber-400/70 transition-colors">이용약관</button>
            <span style={{ color: "rgba(255,255,255,0.15)" }}>|</span>
            <button onClick={() => router.push("/privacy")} className="hover:text-amber-400/70 transition-colors font-semibold" style={{ color: "rgba(255,255,255,0.55)" }}>개인정보처리방침</button>
            <span style={{ color: "rgba(255,255,255,0.15)" }}>|</span>
            <button onClick={() => router.push("/refund")} className="hover:text-amber-400/70 transition-colors">환불규정</button>
            <span style={{ color: "rgba(255,255,255,0.15)" }}>|</span>
            <a href="http://pf.kakao.com/_cuksX" target="_blank" rel="noopener noreferrer" className="hover:text-yellow-400/70 transition-colors">고객센터(카카오 채널)</a>
          </div>

          <div className="text-center space-y-1.5 mb-4" style={{ color: "rgba(255,255,255,0.22)", fontSize: 11 }}>
            <p>상호: 여름궁전(Summer Palace) · 대표: 정다정 · 이메일: smple@outlook.kr</p>
            <p>통신판매업 신고번호: 제2025-경남-00000호 · 사업자등록번호: 707-28-01614</p>
            <p>
              주소: 경상남도 거제시 장평3로2길 40-3, 102 · 카카오채널:&nbsp;
              <a href="http://pf.kakao.com/_cuksX" target="_blank" rel="noopener noreferrer" className="hover:text-yellow-400/50 transition-colors underline underline-offset-2">클릭</a>
            </p>
            <p>호스팅 서비스: Vercel Inc. · 결제: 토스페이먼츠(주)</p>
          </div>

          <p className="text-center text-xs mb-3" style={{ color: "rgba(255,255,255,0.14)", fontSize: 11 }}>
            Summer Palace의 모든 분석 결과는 오락·참고 목적의 AI 생성 콘텐츠입니다. 투자·의료·법률 결정의 근거로 사용하지 마세요.
          </p>

          <p className="text-center text-xs" style={{ color: "rgba(255,255,255,0.15)" }}>© 2026 Summer Palace. All rights reserved.</p>
        </div>
      </footer>

      {/* ── 모바일 카카오 플로팅 CTA ── */}
      <div className="fixed bottom-[4.5rem] left-4 right-4 z-40 sm:hidden">
        <KakaoLoginButton redirectTo="/" floating />
      </div>

      {/* ── 모바일 하단 네비게이션 ── */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 sm:hidden border-t"
        style={{ background: "rgba(6,6,14,0.97)", borderColor: "rgba(255,255,255,0.08)", backdropFilter: "blur(20px)" }}>
        <div className="flex items-stretch h-[4.5rem]">
          {[
            { icon: "🏠", label: "홈", href: "/" },
            { icon: "🔮", label: "사주", href: "/saju" },
            { icon: "💰", label: "블루베리 충전", href: "/charge" },
            { icon: "💬", label: "문의", href: "http://pf.kakao.com/_cuksX", external: true },
          ].map((item) => (
            item.external ? (
              <a key={item.label} href={item.href} target="_blank" rel="noopener noreferrer"
                className="flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors"
                style={{ color: "rgba(255,255,255,0.4)" }}>
                <span className="text-xl">{item.icon}</span>
                <span className="text-[10px]">{item.label}</span>
              </a>
            ) : (
              <button key={item.label} onClick={() => router.push(item.href)}
                className="flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors"
                style={{ color: item.href === "/" ? "#c9a84c" : "rgba(255,255,255,0.4)" }}>
                <span className="text-xl">{item.icon}</span>
                <span className="text-[10px] leading-tight text-center px-0.5">{item.label}</span>
              </button>
            )
          ))}
        </div>
      </nav>
    </main>
  );
}
