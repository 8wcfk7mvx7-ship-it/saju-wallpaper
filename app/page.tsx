"use client";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import Image from "next/image";
import AdBanner from "@/components/AdBanner";

const KakaoLoginButton = dynamic(() => import("@/components/KakaoLoginButton"), { ssr: false });
const IljinCalendar = dynamic(() => import("@/components/IljinCalendar"), { ssr: false });
const NaverFirstLoginModal = dynamic(() => import("@/components/NaverFirstLoginModal"), { ssr: false });

type Category = "전체" | "무료" | "연애·궁합" | "금전·투자" | "운명·대운" | "라이프" | "Special" | "매력";

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
  navBadge: string;
  nav: [string, string, string, string];
  mypage: string;
  trustHeadline: string;
  trustBullets: [string, string, string];
  ratingLabel: string;
  counterLabel: string;
  guideChip: string;
  guideTitle: string;
  guideDesc: string;
  guideBtn: string;
  bannerMain: string;
  bannerHighlight: string;
  bannerSub1: string;
  bannerSub2: string;
  emptyServices: string;
  servicesCountUnit: string;
  disclaimerShort: string;
  mobileNav: [string, string, string, string];
  mobileMenu: [string, string, string, string, string, string, string, string];
}> = {
  ko: {
    h1: ["지금 이 순간", "당신에게 필요한", "한 가지"],
    heroSub: "사주에 다 나와있습니다. 내 오행 에너지, 지금 확인하세요.",
    heroCta: "무료로 만세력 확인하기",
    servicesHeading: "지금 바로 확인하세요",
    reviewsHeading: "실제 이용 후기",
    bannerCta: "배경화면 만들기 →",
    catLabel: { "전체": "전체", "무료": "무료", "연애·궁합": "연애·궁합", "금전·투자": "직업·금전", "운명·대운": "운세·대운", "라이프": "라이프", "Special": "프리미엄", "매력": "매력" },
    start: "시작",
    charging: "별조각 충전",
    navBadge: "AI 사주",
    nav: ["사주", "가이드", "일진달력", "문의하기"],
    mypage: "마이페이지",
    trustHeadline: "사주를 캡처해서 AI에 올려 묻는 것과는 분석 방식 자체가 다릅니다.",
    trustBullets: [
      "명리학 원전 이론과 사주 명식 계산 로직을 직접 구현한 <strong style=\"color:#fff\">전용 분석 엔진</strong>으로 풀이합니다",
      "생년월일시로 산출한 <strong style=\"color:#fff\">사주 명식·십성·신살 데이터</strong>를 기준으로 항목별 풀이를 구성합니다",
      "일반 대화형 AI가 즉석에서 답하는 방식이 아니라, <strong style=\"color:#fff\">정해진 명리학 규칙</strong>에 따라 일관되게 분석합니다",
    ],
    ratingLabel: "실제 후기",
    counterLabel: "누적 분석 {n}건",
    guideChip: "사주 명리학 가이드",
    guideTitle: "사주가 처음이신가요?",
    guideDesc: "오행·천간지지·신살·대운 등 기초를 단계별로 설명합니다.",
    guideBtn: "가이드 보기 →",
    bannerMain: "몰랐던 내 사주의 진실을 알고 나서 ",
    bannerHighlight: "처음으로 방향이 보였습니다",
    bannerSub1: "사주는 운명을 바꾸는 도구가 아닙니다.",
    bannerSub2: "타고난 에너지를 이해하고, 그에 맞게 살아가는 나침반입니다.",
    emptyServices: "준비 중인 서비스입니다",
    servicesCountUnit: "가지",
    disclaimerShort: "본 서비스는 오락·참고 목적의 AI 콘텐츠입니다. 실제 의사결정의 근거로 사용하지 마세요.",
    mobileNav: ["홈", "서비스", "보관함", "문의"],
    mobileMenu: ["홈", "전체 서비스", "만세력", "AI 채팅", "오늘의 운세", "일진달력", "사주 가이드", "마이페이지"],
  },
  en: {
    h1: ["Your current wallpaper", "might be blocking", "your energy"],
    heroSub: "Everyone else has already checked. You're the only one still in the dark.",
    heroCta: "Uncover My Full Destiny",
    servicesHeading: "Explore Services",
    reviewsHeading: "Real Reviews",
    bannerCta: "Create Wallpaper →",
    catLabel: { "전체": "All", "무료": "Free", "연애·궁합": "Love", "금전·투자": "Money", "운명·대운": "Destiny", "라이프": "Lifestyle", "Special": "Premium", "매력": "Charm" },
    start: "Start",
    charging: "Top Up",
    navBadge: "AI Saju",
    nav: ["Saju", "Guide", "Daily Calendar", "Contact"],
    mypage: "My Page",
    trustHeadline: "This isn't the same as uploading your chart to a generic AI chatbot.",
    trustBullets: [
      "Built on classical theory with <strong style=\"color:#fff\">a dedicated analysis engine</strong> that directly implements saju calculation logic",
      "Interprets results using <strong style=\"color:#fff\">your exact chart, ten gods, and sign data</strong> calculated from your birth info",
      "Unlike conversational AI that answers on the fly — analyses follow <strong style=\"color:#fff\">consistent classical astrology rules</strong>",
    ],
    ratingLabel: "Real reviews",
    counterLabel: "{n} analyses done",
    guideChip: "Saju Astrology Guide",
    guideTitle: "New to Saju?",
    guideDesc: "Step-by-step intro to Five Elements, stems & branches, signs, and fortune cycles.",
    guideBtn: "View Guide →",
    bannerMain: "After finally understanding what my chart was really telling me, ",
    bannerHighlight: "I saw my path clearly for the first time.",
    bannerSub1: "Saju isn't a tool to change your fate.",
    bannerSub2: "It's a compass — helping you understand your natural energy and live in alignment with it.",
    emptyServices: "Coming soon",
    servicesCountUnit: " services",
    disclaimerShort: "This service provides AI-generated content for entertainment and reference only. Do not use it as a basis for real-life decisions.",
    mobileNav: ["Home", "Services", "My Library", "Contact"],
    mobileMenu: ["Home", "All Services", "Full Chart", "AI Chat", "Today's Fortune", "Daily Calendar", "Saju Guide", "My Page"],
  },
  id: {
    h1: ["Wallpaper Anda saat ini", "mungkin menghalangi", "energi Anda"],
    heroSub: "Yang lain sudah memeriksanya. Hanya Anda yang belum mengetahuinya.",
    heroCta: "Ungkap Seluruh Takdir Saya",
    servicesHeading: "Jelajahi Sekarang",
    reviewsHeading: "Ulasan Nyata",
    bannerCta: "Buat Wallpaper →",
    catLabel: { "전체": "Semua", "무료": "Gratis", "연애·궁합": "Cinta", "금전·투자": "Uang", "운명·대운": "Takdir", "라이프": "Gaya Hidup", "Special": "Premium", "매력": "Daya Tarik" },
    start: "Mulai",
    charging: "Isi Ulang",
    navBadge: "AI Saju",
    nav: ["Saju", "Panduan", "Kalender Harian", "Kontak"],
    mypage: "Halaman Saya",
    trustHeadline: "Ini berbeda dari sekadar mengunggah grafik Anda ke chatbot AI biasa.",
    trustBullets: [
      "Dibangun berdasarkan teori klasik dengan <strong style=\"color:#fff\">mesin analisis khusus</strong> yang langsung mengimplementasikan logika kalkulasi saju",
      "Menginterpretasikan hasil menggunakan <strong style=\"color:#fff\">data bagan, sepuluh dewa, dan tanda Anda</strong> yang dihitung dari info kelahiran Anda",
      "Berbeda dari AI percakapan yang menjawab spontan — analisis mengikuti <strong style=\"color:#fff\">aturan astrologi klasik yang konsisten</strong>",
    ],
    ratingLabel: "Ulasan nyata",
    counterLabel: "{n} analisis selesai",
    guideChip: "Panduan Astrologi Saju",
    guideTitle: "Baru mengenal Saju?",
    guideDesc: "Pengantar langkah demi langkah tentang Lima Elemen, batang & cabang, tanda, dan siklus nasib.",
    guideBtn: "Lihat Panduan →",
    bannerMain: "Setelah akhirnya memahami apa yang sebenarnya dikatakan grafik saya, ",
    bannerHighlight: "saya melihat jalan saya dengan jelas untuk pertama kalinya.",
    bannerSub1: "Saju bukanlah alat untuk mengubah takdir Anda.",
    bannerSub2: "Ini adalah kompas — membantu Anda memahami energi alami dan hidup selaras dengannya.",
    emptyServices: "Segera hadir",
    servicesCountUnit: " layanan",
    disclaimerShort: "Layanan ini menyediakan konten AI untuk hiburan dan referensi saja. Jangan gunakan sebagai dasar keputusan nyata.",
    mobileNav: ["Beranda", "Layanan", "Pustaka", "Kontak"],
    mobileMenu: ["Beranda", "Semua Layanan", "Grafik Lengkap", "Obrolan AI", "Keberuntungan Hari Ini", "Kalender Harian", "Panduan Saju", "Halaman Saya"],
  },
  ta: {
    h1: ["உங்கள் வால்பேப்பர்", "உங்கள் ஆற்றலை", "தடுக்கலாம்"],
    heroSub: "மற்றவர்கள் ஏற்கனவே சரிபார்த்தனர். நீங்கள் மட்டும் இன்னும் தெரியாமல் இருக்கிறீர்கள்.",
    heroCta: "என் சாஜுவை முழுமையாக அறிக",
    servicesHeading: "இப்போதே பார்க்கவும்",
    reviewsHeading: "உண்மையான மதிப்புரைகள்",
    bannerCta: "வால்பேப்பர் உருவாக்கு →",
    catLabel: { "전체": "அனைத்தும்", "무료": "இலவசம்", "연애·궁합": "காதல்", "금전·투자": "பணம்", "운명·대운": "விதி", "라이프": "வாழ்க்கை", "Special": "சிறப்பு", "매력": "ஈர்ப்பு" },
    start: "தொடங்கு",
    charging: "நிரப்பு",
    navBadge: "AI சாஜு",
    nav: ["சாஜு", "வழிகாட்டி", "தினசரி நாட்காட்டி", "தொடர்பு"],
    mypage: "என் பக்கம்",
    trustHeadline: "இது ஒரு பொதுவான AI சாட்போட்டில் உங்கள் ஜாதகத்தை பதிவேற்றுவதிலிருந்து வேறுபட்டது.",
    trustBullets: [
      "சாஜு கணக்கீட்டு தர்க்கத்தை நேரடியாக செயல்படுத்தும் <strong style=\"color:#fff\">அர்ப்பணிக்கப்பட்ட பகுப்பாய்வு என்ஜின்</strong> கொண்டு கட்டமைக்கப்பட்டது",
      "உங்கள் பிறப்பு தகவலிலிருந்து கணக்கிடப்பட்ட <strong style=\"color:#fff\">விளக்கப்படம், பத்து கடவுளர்கள் மற்றும் அடையாள தரவு</strong> அடிப்படையில் பகுப்பாய்வு செய்கிறது",
      "உரையாடல் AI போல் தானாகவே பதிலளிக்காமல் — <strong style=\"color:#fff\">நிலையான பழமையான ஜோதிட விதிகளை</strong> பின்பற்றி பகுப்பாய்வு செய்கிறது",
    ],
    ratingLabel: "உண்மையான மதிப்புரைகள்",
    counterLabel: "{n} பகுப்பாய்வுகள் முடிந்தன",
    guideChip: "சாஜு ஜோதிட வழிகாட்டி",
    guideTitle: "சாஜு புதிதா?",
    guideDesc: "ஐந்து தத்துவங்கள், தண்டு மற்றும் கிளைகள், அடையாளங்கள் மற்றும் விதி சுழற்சிகளுக்கான படிப்படியான அறிமுகம்.",
    guideBtn: "வழிகாட்டியைப் பார்க்கவும் →",
    bannerMain: "என் ஜாதகம் உண்மையில் என்ன சொல்கிறது என்று புரிந்த பிறகு, ",
    bannerHighlight: "முதல் முறையாக என் பாதை தெளிவாக தெரிந்தது.",
    bannerSub1: "சாஜு உங்கள் விதியை மாற்றும் கருவி அல்ல.",
    bannerSub2: "இது ஒரு திசைகாட்டி — உங்கள் இயற்கை ஆற்றலை புரிந்துகொண்டு அதனோடு இணைந்து வாழ உதவுகிறது.",
    emptyServices: "விரைவில் வரவிருக்கிறது",
    servicesCountUnit: " சேவைகள்",
    disclaimerShort: "இந்த சேவை பொழுதுபோக்கு மற்றும் குறிப்பு மட்டுமான AI உள்ளடக்கத்தை வழங்குகிறது. உண்மையான முடிவுகளுக்கு அடிப்படையாக பயன்படுத்த வேண்டாம்.",
    mobileNav: ["முகப்பு", "சேவைகள்", "நூலகம்", "தொடர்பு"],
    mobileMenu: ["முகப்பு", "அனைத்து சேவைகள்", "முழு விளக்கப்படம்", "AI அரட்டை", "இன்றைய அதிர்வு", "தினசரி நாட்காட்டி", "சாஜு வழிகாட்டி", "என் பக்கம்"],
  },
};

// ── 60갑자 로마자 표기 (한글 미적용 언어용) ──────────────────────────────────
const STEM_ROMAN = ["Gap", "Eul", "Byeong", "Jeong", "Mu", "Gi", "Gyeong", "Sin", "Im", "Gye"];
const BRANCH_ROMAN = ["Ja", "Chuk", "In", "Myo", "Jin", "Sa", "O", "Mi", "Sin", "Yu", "Sul", "Hae"];
const SURNAME_ROMAN: Record<string, string> = {
  "김": "Kim", "이": "Lee", "박": "Park", "최": "Choi", "정": "Jeong", "강": "Kang", "조": "Cho", "윤": "Yoon", "장": "Jang", "임": "Lim",
  "한": "Han", "오": "Oh", "서": "Seo", "신": "Shin", "권": "Kwon", "황": "Hwang", "안": "Ahn", "송": "Song", "전": "Jeon", "홍": "Hong",
  "유": "Yu", "고": "Ko", "문": "Moon", "양": "Yang", "손": "Son", "배": "Bae", "백": "Baek", "허": "Heo", "남": "Nam", "심": "Shim",
  "노": "Noh", "하": "Ha", "곽": "Kwak", "성": "Seong", "차": "Cha", "주": "Joo", "우": "Woo", "구": "Koo", "민": "Min", "류": "Ryu",
};

const CATEGORIES: { key: Category; icon: string; desc: string }[] = [
  { key: "전체",    icon: "☯",  desc: "전체 서비스" },
  { key: "연애·궁합", icon: "💑", desc: "연애·궁합" },
  { key: "금전·투자", icon: "💰", desc: "직업·금전" },
  { key: "운명·대운", icon: "⏳", desc: "운세·대운" },
  { key: "라이프",  icon: "🌿",  desc: "라이프스타일" },
  { key: "매력",    icon: "💋",  desc: "이성·매력" },
  { key: "Special", icon: "👑", desc: "프리미엄 콘텐츠" },
];

// ── 후기 데이터 ───────────────────────────────────────────────────────────────
const REVIEWS = [
  // ★★★★★ 5점
  { name: "이○○", region: "서울", age: "32세", text: "배경화면 바꾸고 나서 진짜 기분인지 모르겠는데 취업됐어요. 믿기 싫었는데 신기합니다.", service: "오행 배경화면", stars: 5 },
  { name: "박○○", region: "부산", age: "28세", text: "궁합 봤는데 원진살이라고 나왔어요. 헤어지고 나니까 그게 맞더라고요. 좀 더 일찍 볼걸.", service: "궁합 분석", stars: 5 },
  { name: "김○○", region: "대구", age: "45세", text: "대운 분석이 너무 정확해서 소름 돋았습니다. 40대 중반에 큰 변화 온다고 했는데 딱 맞았어요.", service: "대운·세운", stars: 5 },
  { name: "최○○", region: "인천", age: "26세", text: "MBTI랑 사주 조합 분석이 진짜 신선했어요. INFJ-갑목 조합이 이렇게 맞을 수가 없어요.", service: "MBTI×사주", stars: 5 },
  { name: "한○○", region: "수원", age: "33세", text: "쓰레기 사주 극복법 읽고 진짜 울었어요. 내가 왜 힘들었는지 처음으로 이해가 됐습니다.", service: "신살 극복", stars: 5 },
  { name: "윤○○", region: "서울", age: "29세", text: "도화살 있다고 나왔는데 진짜로 갑자기 연락 오는 사람 늘었어요. 우연이라 하기엔 너무 신기해서.", service: "신살 분석", stars: 5 },
  { name: "오○○", region: "경기", age: "35세", text: "남자친구 사주 염탐했는데 바람기 위험도 B등급 나왔고 실제로 좀 자유분방한 편인데 맞더라고요.", service: "염탐하기", stars: 5 },
  { name: "강○○", region: "대전", age: "41세", text: "취향 분석에서 나한테 맞는 영화 추천해줬는데 다 좋아하는 장르예요. 어떻게 알았지 진짜.", service: "취향 분석", stars: 5 },
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
  { name: "방○○", region: "서울", age: "24세", text: "일진달력 보면서 기운 좋은 날 면접 잡았어요. 결과는... 합격이었습니다 ㅎㅎ", service: "일진달력", stars: 5 },
  { name: "공○○", region: "부산", age: "37세", text: "병화일간 설명에서 태양처럼 에너지 넘친다는 거 진짜예요. 주변이 다 알아요 ㅋㅋ", service: "사주 분석", stars: 5 },
  { name: "현○○", region: "인천", age: "30세", text: "쓰레기 사주 극복법 결제하고 봤는데 솔직히 돈이 아깝지 않았어요. 필요했던 말들이었어요.", service: "신살 극복", stars: 5 },
  { name: "나○○", region: "서울", age: "22세", text: "신금일간 완벽주의 성향 읽고 내가 왜 이렇게 스트레스를 받는지 이해가 됐어요ㅠㅠ", service: "사주 분석", stars: 5 },
  { name: "봉○○", region: "경기", age: "49세", text: "50대 대운 진입 전에 미리 보게 돼서 다행입니다. 준비할 게 생겼어요.", service: "대운·세운", stars: 5 },
  { name: "지○○", region: "대구", age: "27세", text: "수기운 많은 사주라 감수성 풍부하다는 게 완전 맞아요. 혼자 영화 보다가 우는 타입이거든요.", service: "사주 분석", stars: 5 },
  { name: "석○○", region: "광주", age: "33세", text: "주식 분석에서 단타보다 중장기가 맞는다고 나왔는데 그 조언 따랐더니 수익률이 달라졌어요.", service: "주식 분석", stars: 5 },
  { name: "민○○", region: "서울", age: "28세", text: "취향 분석 책 추천이 신기해요. 내가 좋아하는 책 종류랑 딱 맞는 장르로 추천해줘요.", service: "취향 분석", stars: 5 },
  { name: "길○○", region: "수원", age: "36세", text: "무토일간 안정형 맞는데 주변에서도 항상 나더러 흔들리지 않는다고 하거든요.", service: "사주 분석", stars: 5 },
  { name: "항○○", region: "경기", age: "25세", text: "처음엔 그냥 심심해서 해봤는데 지금은 거의 매일 일진달력 확인하고 있어요.", service: "일진달력", stars: 5 },
  { name: "두○○", region: "인천", age: "31세", text: "을목일간이라 유연해 보여도 속은 강철이라는 표현이 진짜 나를 표현하는 최고의 문장이에요.", service: "사주 분석", stars: 5 },
  { name: "라○○", region: "서울", age: "38세", text: "도시 추천 받아서 여행 가봤는데 진짜 맞는 에너지의 도시였어요. 충전이 됐달까.", service: "도시 추천", stars: 5 },
  { name: "단○○", region: "대전", age: "29세", text: "MBTI INFP에 임수 일간이라는 조합 읽고 내가 왜 이렇게 자유로운 걸 좋아하는지 납득이 됐어요.", service: "MBTI×사주", stars: 5 },
  { name: "결○○", region: "대구", age: "34세", text: "명리학을 이렇게 쉽게 풀어주는 곳이 없었어요. 어렵게 느껴졌던 게 재미있어졌습니다.", service: "사주 분석", stars: 5 },
  { name: "미○○", region: "서울", age: "21세", text: "친구들이랑 서로 염탐 기능 써봤는데 다들 너무 맞아서 진짜냐고 물어봤어요 ㅋㅋ", service: "염탐하기", stars: 5 },
  { name: "화○○", region: "경기", age: "40세", text: "갑목일간 리더십형이라는데 회사 팀장 맡고 있어요. 맞습니다 ㅎ 근데 고집도 맞아요.", service: "사주 분석", stars: 5 },
  { name: "수○○", region: "부산", age: "26세", text: "극복법 보고 내 신살들이 단점이 아니라 특성이라는 걸 처음으로 받아들이게 됐어요.", service: "신살 극복", stars: 5 },
  { name: "감○○", region: "서울", age: "30세", text: "정화일간이라 집중력 강하다는 게 딱 맞아요. 뭔가 꽂히면 끝장을 보는 스타일이라.", service: "사주 분석", stars: 5 },
  { name: "봄○○", region: "경기", age: "23세", text: "재회운 분석에서 지금 시기가 아니라고 나왔는데 그 사람한테 먼저 연락 안 했어요. 잘한 것 같아요.", service: "재회운", stars: 5 },
  { name: "여○○", region: "대전", age: "41세", text: "길일 확인하고 계약서 쓴 날 진짜 문제없이 잘 됐어요. 우연이라 해도 이제 꼭 확인하게 됐습니다.", service: "길일·흉일", stars: 5 },
  { name: "름○○", region: "부산", age: "33세", text: "ESTP-병화 조합이라는 거 읽고 내가 왜 이렇게 즉흥적이고 현장파인지 이해됐어요.", service: "MBTI×사주", stars: 5 },
  { name: "겨○○", region: "서울", age: "47세", text: "대운 흐름에서 이 시기가 인생의 전환점이라고 나왔는데 실제로 큰 결정 앞에 있습니다. 도움이 됐어요.", service: "대운·세운", stars: 5 },
  { name: "울○○", region: "인천", age: "29세", text: "짝사랑 공략법 보고 접근 방식 바꿨는데 상대방이 먼저 연락 오더라고요. 신기해요.", service: "짝사랑", stars: 5 },
  { name: "눈○○", region: "광주", age: "35세", text: "계수일간이라 지략가 스타일이라는 게 너무 맞아요. 뭐든 혼자 다 계획하는 편이거든요.", service: "사주 분석", stars: 5 },
  { name: "꽃○○", region: "수원", age: "22세", text: "취향 분석에서 추천한 영화 장르가 진짜 제가 즐겨보던 거랑 똑같아서 소름이었어요.", service: "취향 분석", stars: 5 },
  { name: "달○○", region: "서울", age: "38세", text: "오행 배경화면 만들고 폰 배경으로 썼는데 색깔 조합이 진짜 예쁘고 기분 좋아요.", service: "오행 배경화면", stars: 5 },
  { name: "빛○○", region: "경기", age: "44세", text: "남편 사주 분석해봤더니 성격 특성이 너무 딱 맞아서 웃음이 나왔어요. 오래 살아봐야 아는데 사주가 다 알더라고요.", service: "사주 분석", stars: 5 },
  { name: "강○○", region: "제주", age: "31세", text: "제주 살다가 도시 추천에서 다른 지역 나왔는데 실제로 이사 고민 중이에요. 방향 잡는 데 도움됐습니다.", service: "도시 추천", stars: 5 },
  { name: "해○○", region: "세종", age: "27세", text: "신살 분석에서 학당귀인 있다고 나왔는데 공부할 때마다 집중이 잘 되는 편이에요. 맞는 것 같아요.", service: "신살 분석", stars: 5 },
  { name: "솔○○", region: "천안", age: "36세", text: "대운 분석 읽고 지금 시기를 왜 이렇게 버텨왔는지 이해됐어요. 힘들었던 이유가 있었구나 싶었습니다.", service: "대운·세운", stars: 5 },
  { name: "산○○", region: "서울", age: "25세", text: "짝사랑 분석에서 상대 일간 분석이 너무 정확했어요. 그 사람한테 딱 맞는 접근법이라 감탄했어요.", service: "짝사랑", stars: 5 },
  { name: "바○○", region: "전주", age: "42세", text: "무관살 있다고 나왔는데 실제로 법 관련 직종에서 일하고 있어요. 맞는 게 신기해요.", service: "신살 분석", stars: 5 },
  { name: "람○○", region: "창원", age: "28세", text: "궁합 분석에서 두 사람 오행 보완 관계가 잘 설명돼 있어서 서로 이해하는 데 도움이 됐어요.", service: "궁합 분석", stars: 5 },
  { name: "들○○", region: "청주", age: "33세", text: "을목일간 설명 보다가 내 전 남자친구가 딱 을목 유형이었다는 걸 깨달았어요. 왜 맞지 않았는지 이제 알겠어요.", service: "사주 분석", stars: 5 },
  { name: "강○○", region: "서울", age: "19세", text: "수능 전에 길일 확인하고 그날 모의고사 봤는데 점수 잘 나왔어요. 긴장이 덜했던 것 같아요.", service: "길일·흉일", stars: 5 },
  { name: "새○○", region: "울산", age: "46세", text: "정재성 분석에서 저축 성향 강하다는 게 딱 맞아요. 돈 쓰는 게 불안해서 통장에 그냥 넣어두는 타입이거든요.", service: "사주 분석", stars: 5 },
  { name: "아○○", region: "경북", age: "30세", text: "재회운에서 가능성 있다고 나왔는데 실제로 그 사람이 먼저 연락 왔어요. 진짜인지 아직도 신기해요.", service: "재회운", stars: 5 },
  { name: "침○○", region: "부산", age: "37세", text: "묘목일간이라 예술적 감성 강하다는 거 딱 맞아요. 주변에서 항상 감성적이라고 하거든요.", service: "사주 분석", stars: 5 },
  { name: "구○○", region: "수원", age: "22세", text: "길일에 이사했는데 진짜 생활이 안정되는 느낌이에요. 이전 집이랑 분위기가 달라요.", service: "길일·흉일", stars: 5 },
  { name: "름○○", region: "인천", age: "43세", text: "40대 중반 대운이 힘들 수 있다고 나왔는데 실제로 힘들었고, 극복 조언이 큰 위안이 됐습니다.", service: "대운·세운", stars: 5 },
  { name: "터○○", region: "서울", age: "27세", text: "INTJ-경금 조합이라는 거 보고 왜 내가 이렇게 냉정하고 계획적인지 처음으로 설명이 됐어요.", service: "MBTI×사주", stars: 5 },
  { name: "눈○○", region: "대전", age: "34세", text: "편인 강한 사주라서 독립적이고 독창적이라는 게 딱 맞아요. 혼자 하는 일이 항상 더 잘 돼요.", service: "사주 분석", stars: 5 },
  { name: "서○○", region: "광주", age: "29세", text: "짝사랑 분석에서 절대 금물이라는 행동이 제가 하려던 거였어요. 안 했길 잘했다는 생각이 들어요.", service: "짝사랑", stars: 5 },
  { name: "이○○", region: "경기", age: "50세", text: "50대 대운이 오히려 인생 전성기라고 나와서 희망이 생겼어요. 진짜 요즘 뭔가 풀리는 것 같아요.", service: "대운·세운", stars: 5 },
  { name: "우○○", region: "전주", age: "24세", text: "취향 분석에서 여행 스타일이 계획보다 즉흥 여행이라는 게 맞아요. 계획 짜놓고 항상 바꾸거든요.", service: "취향 분석", stars: 5 },
  { name: "주○○", region: "세종", age: "39세", text: "오행 배경화면 만들고 집 전체 컬러를 바꿔봤는데 진짜 집에 있는 시간이 좋아졌어요.", service: "오행 배경화면", stars: 5 },
  { name: "만○○", region: "부산", age: "32세", text: "염탐 기능으로 부모님 사주 봤더니 두 분이 어떻게 수십 년을 함께했는지 이해가 됐어요.", service: "염탐하기", stars: 5 },
  { name: "세○○", region: "대구", age: "46세", text: "갱년기 시기 대운 분석이 너무 정확했어요. 이 시기를 잘 이해하고 넘어갈 수 있었습니다.", service: "대운·세운", stars: 5 },
  { name: "기○○", region: "서울", age: "20세", text: "사주 보기 전엔 그냥 미신 같은 거라 생각했는데 분석 읽고 나니 진짜 학문이구나 싶었어요.", service: "사주 분석", stars: 5 },
  { name: "쁜○○", region: "수원", age: "35세", text: "길일에 계약서 쓰고 사업 시작했는데 첫 달부터 생각보다 잘 돼서 신기했어요.", service: "길일·흉일", stars: 5 },

  // ★★★★☆ 4점 (~15%)
  { name: "전○○", region: "수원", age: "30세", text: "배경화면 오행 분석 후 나무 기운으로 바꿨더니 뭔가 차분해졌어요. 플라시보인지 진짜인지는 모르겠지만 기분은 좋아요.", service: "오행 배경화면", stars: 4 },
  { name: "원○○", region: "경기", age: "32세", text: "염탐 기능이 좀 독특한 기능이긴 한데... 알고 싶은 게 있었고 답은 얻었습니다. 전적으로 믿진 않지만 참고가 됐어요.", service: "염탐하기", stars: 4 },
  { name: "복○○", region: "부산", age: "44세", text: "궁합에서 원진살이 있는데도 지금 10년 넘게 잘 살고 있어요. 의지로 극복하는 중이에요.", service: "궁합 분석", stars: 4 },
  { name: "정○○", region: "광주", age: "38세", text: "주식투자 스타일 분석 보고 포트폴리오 바꿨는데 수익률이 조금 나아졌어요. 100% 믿긴 어렵지만 방향 잡는 데 참고됩니다.", service: "주식 분석", stars: 4 },
  { name: "천○○", region: "대전", age: "43세", text: "오행 배경화면 예뻐서 만들었는데 운이 좋아진 것 같기도 하고 아닌 것 같기도 해요. 그냥 예쁜 건 확실해요.", service: "오행 배경화면", stars: 4 },
  { name: "이○○", region: "부산", age: "36세", text: "아주 정확하진 않지만 재미있어요. 전반적인 성격 흐름은 맞는 것 같은데 세부적으론 좀 다른 부분도 있어요.", service: "사주 분석", stars: 4 },
  { name: "권○○", region: "서울", age: "42세", text: "일부는 딱 맞고 일부는 좀 애매했어요. 그래도 100% 안 믿어도 나를 돌아보는 계기가 됐습니다.", service: "사주 분석", stars: 4 },
  { name: "박○○", region: "인천", age: "25세", text: "처음 기대보다 살짝 덜했는데 시간 지나고 다시 보니 맞더라고요. 즉시가 아니라 나중에 공감이 오는 타입인 것 같아요.", service: "대운·세운", stars: 4 },
  { name: "유○○", region: "경기", age: "33세", text: "전반적으로 재미있고 나를 돌아보게 됐어요. 모든 게 딱 맞지는 않지만 큰 흐름은 비슷해서 도움이 됐습니다.", service: "MBTI×사주", stars: 4 },
  { name: "임○○", region: "대구", age: "28세", text: "취향 분석에서 음악 추천은 잘 맞는데 영화 쪽은 좀 달랐어요. 그래도 전체적으로 재미있게 봤어요.", service: "취향 분석", stars: 4 },
  { name: "송○○", region: "광주", age: "45세", text: "길일에 이사하려고 했는데 일정이 안 맞아서 못 했어요. 그래도 참고용으로 좋은 서비스예요.", service: "길일·흉일", stars: 4 },
  { name: "오○○", region: "서울", age: "31세", text: "궁합 분석이 전부 나쁘게만 나와서 좀 불안했는데, 극복 방법도 같이 있어서 다행이었어요. 조금 더 긍정적 메시지가 있으면 좋겠어요.", service: "궁합 분석", stars: 4 },
  { name: "최○○", region: "세종", age: "37세", text: "도시 추천이 예상과 다르게 나왔어요. 근데 왜 그 도시인지 설명을 읽으니까 나름 납득이 됐습니다.", service: "도시 추천", stars: 4 },
  { name: "윤○○", region: "전주", age: "29세", text: "사주 분석 전체는 재미있게 봤는데 직업 부분은 저한테 맞지 않는 것도 있었어요. 참고만 할게요.", service: "사주 분석", stars: 4 },
  { name: "홍○○", region: "제주", age: "40세", text: "짝사랑 분석이 도움은 됐는데 너무 일반적인 것 같기도 해요. 상대방 일간별로 다르다는 건 신선했습니다.", service: "짝사랑", stars: 4 },
  { name: "한○○", region: "청주", age: "23세", text: "재미로 보기 좋아요. 100% 믿기보다 자기 이해 도구로 쓰면 좋을 것 같습니다. 분석 자체는 꽤 상세해요.", service: "사주 분석", stars: 4 },
  { name: "안○○", region: "수원", age: "48세", text: "MBTI 분석이랑 결합한 건 신선했는데 사주 쪽은 좀 더 자세하면 좋겠어요. 전체적으로 괜찮습니다.", service: "MBTI×사주", stars: 4 },
  { name: "정○○", region: "대전", age: "34세", text: "신살 극복법이 위로가 됐어요. 모든 내용이 딱 들어맞지는 않았지만 힘들 때 읽기 좋았습니다.", service: "신살 극복", stars: 4 },

  // ★★★☆☆ 3점 (~4%)
  { name: "김○○", region: "서울", age: "27세", text: "재미로 보기엔 좋은데 너무 진지하게 받아들이긴 어려워요. 분석이 포괄적이라 어느 정도는 누구한테나 해당될 것 같기도 해요.", service: "사주 분석", stars: 3 },
  { name: "이○○", region: "경기", age: "41세", text: "좀 더 구체적이고 세밀했으면 좋겠어요. 전반적인 방향은 이해가 됐는데 실제 삶에 적용하기엔 추상적인 부분이 있어요.", service: "대운·세운", stars: 3 },
  { name: "박○○", region: "인천", age: "33세", text: "결과가 맞는 부분도 있고 다른 부분도 있어요. 완전히 믿기보다 여러 관점 중 하나로 참고하는 게 좋을 것 같아요.", service: "궁합 분석", stars: 3 },
  { name: "최○○", region: "부산", age: "22세", text: "흥미롭긴 한데 과학적 근거가 없다는 점이 계속 걸려요. 재미는 있어요. 진지하게 결정에 활용하기엔 무리인 것 같아요.", service: "사주 분석", stars: 3 },
  { name: "강○○", region: "대구", age: "38세", text: "일부 내용은 꽤 맞았는데 일부는 전혀 공감이 안 됐어요. 반반 정도 맞는 것 같아요. 참고용으로는 괜찮아요.", service: "신살 분석", stars: 3 },
  { name: "정○○", region: "광주", age: "46세", text: "분석 내용 자체는 잘 정리돼 있어요. 결과를 어떻게 해석하느냐에 따라 다 달라지는 것 같아서 점수를 이렇게 줬습니다.", service: "사주 분석", stars: 3 },
];

// ── 공지사항 ──────────────────────────────────────────────────────────────────
const NOTICES = [
  { date: "2026.06.04", title: "짝사랑 성공 비결 서비스 오픈", badge: "NEW", color: "#fbbf24" },
  { date: "2026.06.03", title: "네이버 로그인 서비스 오픈", badge: "NEW", color: "#fbbf24" },
  { date: "2026.06.02", title: "대운·세운 80년 분석 서비스 출시", badge: "NEW", color: "#fbbf24" },
  { date: "2026.06.01", title: "이용약관·환불규정 개정 안내", badge: "공지", color: "#94a3b8" },
  { date: "2026.05.28", title: "일진 달력 1975~2030 신규 오픈", badge: "NEW", color: "#fbbf24" },
];

// ── 실시간 활동 알림 ──────────────────────────────────────────────────────────
const STEMS_KO = ["갑", "을", "병", "정", "무", "기", "경", "신", "임", "계"];
const BRANCHES_KO = ["자", "축", "인", "묘", "진", "사", "오", "미", "신", "유", "술", "해"];
// 60갑자 일주
const ILJU_60 = Array.from({ length: 60 }, (_, i) => `${STEMS_KO[i % 10]}${BRANCHES_KO[i % 12]}일주`);

const SURNAMES = [
  "김", "이", "박", "최", "정", "강", "조", "윤", "장", "임",
  "한", "오", "서", "신", "권", "황", "안", "송", "전", "홍",
  "유", "고", "문", "양", "손", "배", "백", "허", "남", "심",
  "노", "하", "곽", "성", "차", "주", "우", "구", "민", "류",
];

const ACTIONS = [
  "오행 배경화면을 생성했습니다",
  "사주 궁합을 분석했습니다",
  "MBTI 조합 분석을 완료했습니다",
  "매력 분석을 마쳤습니다",
  "주식 스타일을 확인했습니다",
  "세운 14년 흐름을 열었습니다",
  "성적매력 분석을 받았습니다",
  "대운 보고서를 구입했습니다",
  "궁합 위험도를 확인했습니다",
  "재회 가능성을 분석했습니다",
  "일진달력을 확인했습니다",
  "사주 채팅을 시작했습니다",
  "풍수지리 가이드를 읽었습니다",
  "짝사랑 분석을 완료했습니다",
  "극복 플랜을 받았습니다",
  "낙정관살을 발견했습니다",
  "나체도화를 확인했습니다",
  "만세력을 조회했습니다",
  "사주 핵심 기운 분석을 완료했습니다",
  "대운 흐름을 확인했습니다",
  "짝사랑 공략법을 받았습니다",
  "궁합 점수를 받았습니다",
  "재회 전략을 열었습니다",
  "세운 흐름을 확인했습니다",
  "도화살을 발견했습니다",
  "음인살을 확인했습니다",
  "역마살을 확인했습니다",
  "신살 목록을 확인했습니다",
  "오행 보완법을 확인했습니다",
  "자미두수 차트를 확인했습니다",
  "지역 운세를 확인했습니다",
  "도화살 유형을 확인했습니다",
];

// ko 외 언어용 ACTIONS 번역 (ACTIONS와 동일한 순서/개수)
const ACTIONS_TR: Record<Lang, string[]> = {
  ko: ACTIONS,
  en: [
    "created a Five Elements wallpaper", "analyzed their saju compatibility", "completed an MBTI combination analysis",
    "finished a charm analysis", "checked their investment style", "unlocked a 14-year fortune timeline",
    "received a sexual charm analysis", "purchased a decade-fortune report", "checked their compatibility risk",
    "analyzed reunion chances", "checked the daily fortune calendar", "started a saju chat",
    "read a feng shui guide", "completed a one-sided love analysis", "received an improvement plan",
    "discovered a hidden hazard sign", "checked a romance-attraction sign", "looked up their full chart",
    "completed a core energy analysis", "checked their decade-fortune flow", "received a one-sided love strategy",
    "received a compatibility score", "unlocked a reunion strategy", "checked their annual fortune flow",
    "discovered a romance-attraction sign", "checked a hidden sign", "checked a travel-fortune sign",
    "checked their list of fortune signs", "checked a Five Elements balancing method", "checked a Zi Wei Dou Shu chart",
    "checked their regional fortune", "checked their romance-attraction type",
  ],
  id: [
    "membuat wallpaper Lima Elemen", "menganalisis kecocokan saju", "menyelesaikan analisis kombinasi MBTI",
    "menyelesaikan analisis daya tarik", "memeriksa gaya investasi", "membuka alur keberuntungan 14 tahun",
    "menerima analisis daya tarik seksual", "membeli laporan keberuntungan dekade", "memeriksa tingkat risiko kecocokan",
    "menganalisis peluang rujuk kembali", "memeriksa kalender keberuntungan harian", "memulai obrolan saju",
    "membaca panduan feng shui", "menyelesaikan analisis cinta bertepuk sebelah tangan", "menerima rencana perbaikan diri",
    "menemukan tanda bahaya tersembunyi", "memeriksa tanda daya tarik asmara", "memeriksa chart saju lengkap",
    "menyelesaikan analisis energi inti", "memeriksa alur keberuntungan dekade", "menerima strategi cinta bertepuk sebelah tangan",
    "menerima skor kecocokan", "membuka strategi rujuk kembali", "memeriksa alur keberuntungan tahunan",
    "menemukan tanda daya tarik asmara", "memeriksa tanda tersembunyi", "memeriksa tanda keberuntungan perjalanan",
    "memeriksa daftar tanda keberuntungan", "memeriksa metode penyeimbang Lima Elemen", "memeriksa chart Zi Wei Dou Shu",
    "memeriksa keberuntungan regional", "memeriksa tipe daya tarik asmara",
  ],
  ta: [
    "ஐந்து தத்துவ வால்பேப்பரை உருவாக்கினார்", "சாஜு பொருத்தத்தை பகுப்பாய்வு செய்தார்", "MBTI இணைவு பகுப்பாய்வை முடித்தார்",
    "கவர்ச்சி பகுப்பாய்வை முடித்தார்", "முதலீட்டு பாங்கை சரிபார்த்தார்", "14 ஆண்டு வருடாந்திர அதிர்வை திறந்தார்",
    "பாலியல் கவர்ச்சி பகுப்பாய்வைப் பெற்றார்", "தசா அறிக்கையை வாங்கினார்", "பொருத்தம் ஆபத்து அளவைச் சரிபார்த்தார்",
    "மீண்டும் இணையும் வாய்ப்பை பகுப்பாய்வு செய்தார்", "தினசரி அதிர்வு நாட்காட்டியை சரிபார்த்தார்", "சாஜு அரட்டையைத் தொடங்கினார்",
    "ஃபெங் சுயி வழிகாட்டியைப் படித்தார்", "ஒருதலை காதல் பகுப்பாய்வை முடித்தார்", "முன்னேற்றத் திட்டத்தைப் பெற்றார்",
    "மறைந்த ஆபத்து அடையாளத்தைக் கண்டறிந்தார்", "காதல் கவர்ச்சி அடையாளத்தைச் சரிபார்த்தார்", "முழு ஜாதகத்தைப் பார்வையிட்டார்",
    "தத்துவ சமநிலை பகுப்பாய்வை முடித்தார்", "தசா அதிர்வைச் சரிபார்த்தார்", "ஒருதலை காதல் உபாயத்தைப் பெற்றார்",
    "பொருத்த மதிப்பெண்ணைப் பெற்றார்", "மீண்டும் இணையும் உபாயத்தைத் திறந்தார்", "வருடாந்திர அதிர்வைச் சரிபார்த்தார்",
    "காதல் கவர்ச்சி அடையாளத்தைக் கண்டறிந்தார்", "மறைந்த அடையாளத்தைச் சரிபார்த்தார்", "பயண அதிர்வு அடையாளத்தைச் சரிபார்த்தார்",
    "அதிர்வு அடையாளங்களின் பட்டியலைச் சரிபார்த்தார்", "ஐந்து தத்துவ சமநிலை முறையைச் சரிபார்த்தார்", "ஜி வெய் தௌ சு விளக்கப்படத்தைச் சரிபார்த்தார்",
    "பிராந்திய அதிர்வைச் சரிபார்த்தார்", "காதல் கவர்ச்சி வகையைச் சரிபார்த்தார்",
  ],
};

// 시드 기반 의사난수 (서버/클라이언트 렌더링 결과를 동일하게 맞추기 위함)
function mulberry32(seed: number) {
  return function () {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// 갑오일주 / 갑자일주는 고정 노출, 나머지는 60일주 × 성씨 × 행동의 무작위 조합 약 200개
type ActivityEntry = { stemIdx: number; branchIdx: number; surname: string; actionIdx: number };
const ACTIVITY_ENTRIES: ActivityEntry[] = (() => {
  const fixed: ActivityEntry[] = [
    { stemIdx: 0, branchIdx: 6, surname: "김", actionIdx: 1 },
    { stemIdx: 0, branchIdx: 0, surname: "정", actionIdx: 2 },
  ];
  const rand = mulberry32(20260613);
  const generated: ActivityEntry[] = [];
  const seen = new Set<string>();
  while (generated.length < 200) {
    const iljuIdx = Math.floor(rand() * ILJU_60.length);
    const stemIdx = iljuIdx % 10;
    const branchIdx = iljuIdx % 12;
    const surname = SURNAMES[Math.floor(rand() * SURNAMES.length)];
    const actionIdx = Math.floor(rand() * ACTIONS.length);
    const key = `${iljuIdx}-${surname}-${actionIdx}`;
    if (seen.has(key)) continue;
    seen.add(key);
    generated.push({ stemIdx, branchIdx, surname, actionIdx });
  }
  return [...fixed, ...generated];
})();

function renderActivity(entry: ActivityEntry, lang: Lang): string {
  const action = ACTIONS_TR[lang][entry.actionIdx];
  if (lang === "ko") {
    const ilju = `${STEMS_KO[entry.stemIdx]}${BRANCHES_KO[entry.branchIdx]}일주`;
    return `${ilju} ${entry.surname}○○님이 ${action}`;
  }
  const romanIlju = `${STEM_ROMAN[entry.stemIdx].toLowerCase()}${BRANCH_ROMAN[entry.branchIdx].toLowerCase()}-ilju`;
  const surname = SURNAME_ROMAN[entry.surname] || entry.surname;
  if (lang === "id") return `${romanIlju} ${surname} baru saja ${action}`;
  if (lang === "ta") return `${romanIlju} ${surname} ${action}`;
  return `${romanIlju} ${surname} just ${action}`;
}


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
                  카카오 채널로 빠르게 문의 (전화·이메일보다 빨라요)
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
const PREMIUM_COLOR = "#fbbf24";
const PREMIUM_BADGE_BG = "linear-gradient(135deg, rgba(180,83,9,0.97) 0%, rgba(161,98,7,0.97) 100%)";
const PREMIUM_BORDER = "rgba(202,138,4,0.5)";
const PREMIUM_GLOW = "rgba(202,138,4,0.2)";

const SERVICES: {
  id: string; emoji: string; title: string; viral: string; desc: string;
  tags: string[]; href: string; badge: string; color: string; badgeBg: string;
  border: string; glow: string; categories: Category[]; premium?: boolean;
}[] = [
  {
    id: "chat", emoji: "🔮", title: "월령도사 — 사주 AI 채팅",
    viral: "당신 사주에 숨겨진 진실, 아직도 모르세요?",
    desc: "연애·재물·대운·궁합·직업·전생까지. 사주로 볼 수 있는 건 전부 답합니다. 질문 1회 = 100원 (별조각 1개)",
    tags: ["AI 역술", "전체 상담", "무제한 질문"], href: "/service/chat", badge: "AI",
    color: "#c4b5fd", badgeBg: "rgba(124,58,237,0.95)", border: "rgba(139,92,246,0.6)", glow: "rgba(124,58,237,0.3)",
    categories: ["전체", "운명·대운", "라이프", "연애·궁합", "매력", "금전·투자"],
  },
  {
    id: "saju", emoji: "🔮",
    title: "사주 오행 배경화면",
    viral: "지금 배경화면이 에너지를 갉아먹고 있을 수 있습니다",
    desc: "내 사주에 부족한 오행을 채워주는 AI 맞춤 배경화면. 목·화·토·금·수 중 내가 보완해야 할 기운을 찾아드립니다.",
    tags: ["AI 생성", "오행 보정", "모바일·PC"],
    href: "/service/saju", badge: "",
    color: "#9ca3af", badgeBg: "rgba(107,114,128,0.85)",
    border: "rgba(156,163,175,0.3)", glow: "rgba(156,163,175,0.12)",
    categories: ["전체", "라이프"],
  },
  {
    id: "gunghap", emoji: "💑",
    title: "사주 궁합 분석",
    viral: "지금 만나는 사람, 내 에너지를 갉아먹는 사주일 수 있어요",
    desc: "원진살·귀문관살·합충 관계로 보는 깊은 궁합. 바람기 DNA부터 이별 위험도까지 전부 분석합니다.",
    tags: ["원진살", "합충", "바람기 분석"],
    href: "/service/gunghap", badge: "",
    color: "#f472b6", badgeBg: "rgba(219,39,119,0.85)",
    border: "rgba(244,114,182,0.3)", glow: "rgba(244,114,182,0.12)",
    categories: ["전체", "무료", "연애·궁합"],
  },
  {
    id: "crush", emoji: "💘",
    title: "짝사랑 사주 분석",
    viral: "이 사람, 내가 꼬실 수 있는 사주인지 확인해보세요",
    desc: "짝사랑하는 상대의 이상형·심리 패턴·공략 포인트를 사주로 완전 분석. 얼마나 진지한 사람인지, 어떻게 다가가야 심장이 흔들리는지 알려드립니다.",
    tags: ["이상형 분석", "공략법", "심리 분석"],
    href: "/service/crush", badge: "",
    color: "#f472b6", badgeBg: "rgba(219,39,119,0.85)",
    border: "rgba(244,114,182,0.3)", glow: "rgba(244,114,182,0.12)",
    categories: ["전체", "무료", "연애·궁합"],
  },
  {
    id: "reunion", emoji: "🔥",
    title: "재회운 분석",
    viral: "지금 그 사람, 다른 누군가와 함께하고 있을지도 모릅니다",
    desc: "헤어진 그 사람과 다시 이어질 수 있는지, 지금이 재회의 시기인지 사주로 완전 분석합니다. 망설이는 동안 기회의 문이 닫힙니다.",
    tags: ["재회 가능성", "경도 보정", "대운 분석"],
    href: "/service/reunion", badge: "👑 프리미엄",
    color: PREMIUM_COLOR, badgeBg: PREMIUM_BADGE_BG,
    border: PREMIUM_BORDER, glow: PREMIUM_GLOW,
    categories: ["전체", "연애·궁합", "Special"], premium: true,
  },
  {
    id: "spy", emoji: "🕵️",
    title: "애인 사주 염탐하기",
    viral: "당신의 편은 들지 않습니다. 오직 사실만 말합니다.",
    desc: "바람기·도화살·불륜 가능성까지. 매운맛 분석입니다. 애인의 생년월일만 입력하세요.",
    tags: ["바람기", "도화살", "이성 관계"],
    href: "/service/spy", badge: "",
    color: "#f472b6", badgeBg: "rgba(219,39,119,0.85)",
    border: "rgba(244,114,182,0.3)", glow: "rgba(244,114,182,0.12)",
    categories: ["전체", "무료", "연애·궁합"],
  },
  {
    id: "ideal-type", emoji: "💘",
    title: "그 사람의 진짜 이상형은?",
    viral: "내가 의식적으로 말하는 타입 말고, 사주에 새겨진 진짜 끌림",
    desc: "왜 항상 비슷한 사람만 만나는지, 내가 진짜 끌리는 사람의 유형과 피해야 할 상대를 사주로 완전 분석합니다.",
    tags: ["이상형", "끌림", "연애 패턴"],
    href: "/service/ideal-type", badge: "",
    color: "#f472b6", badgeBg: "rgba(219,39,119,0.85)",
    border: "rgba(244,114,182,0.3)", glow: "rgba(244,114,182,0.12)",
    categories: ["전체", "무료", "연애·궁합"],
  },
  {
    id: "wealth", emoji: "💰",
    title: "내 사주에 재물운이 있을까?",
    viral: "\"무재성\", \"재물복 없다\"는 말 들어본 사람 필수 확인",
    desc: "내 사주에 재성이 있는지, 돈이 새는 구조는 아닌지, 재물운을 높이는 구체적인 방법까지 완전 공개합니다.",
    tags: ["재물운", "무재성", "재테크"],
    href: "/service/wealth", badge: "",
    color: "#fbbf24", badgeBg: "rgba(217,119,6,0.85)",
    border: "rgba(251,191,36,0.3)", glow: "rgba(251,191,36,0.12)",
    categories: ["전체", "무료", "금전·투자"],
  },
  {
    id: "child", emoji: "👶",
    title: "내가 아이를 낳는다면?",
    viral: "낳고 후회하지 않을지, 배우자와 자녀 중 뭐가 더 중요할지",
    desc: "자녀와의 인연, 아이가 나에게 주는 의미, 배우자와 자녀 사이의 무게중심까지 사주로 미리 확인합니다.",
    tags: ["자녀운", "육아", "인생 우선순위"],
    href: "/service/child", badge: "",
    color: "#9ca3af", badgeBg: "rgba(107,114,128,0.85)",
    border: "rgba(156,163,175,0.3)", glow: "rgba(156,163,175,0.12)",
    categories: ["전체", "무료", "라이프", "연애·궁합"],
  },
  {
    id: "solo", emoji: "🛋️",
    title: "비혼으로 잘 사는 사주",
    viral: "결혼이 무조건 답일까? 비혼이 더 잘 맞는 사람 따로 있음",
    desc: "결혼 적합도 vs 비혼 적합도 비교부터, 배우자에게 기 빨리는 구조인지, 비혼일 때 신경 써야 할 부분과 추천 도전까지.",
    tags: ["비혼", "결혼운", "인생설계"],
    href: "/service/solo", badge: "",
    color: "#9ca3af", badgeBg: "rgba(107,114,128,0.85)",
    border: "rgba(156,163,175,0.3)", glow: "rgba(156,163,175,0.12)",
    categories: ["전체", "무료", "라이프", "연애·궁합"],
  },
  {
    id: "today", emoji: "🗓️",
    title: "오늘의 운세",
    viral: "내 사주 원국 + 대운·세운 + 오늘 일운까지, 모든 합충을 한 장으로",
    desc: "원국·대운·세운·오늘 일진을 하나의 명식표로 펼쳐 합·충·형·파·해를 분석하고, 총운·재물·애정·건강·공부운까지 상세하게.",
    tags: ["오늘의운세", "일운", "합충분석"],
    href: "/service/today", badge: "",
    color: "#9ca3af", badgeBg: "rgba(107,114,128,0.85)",
    border: "rgba(156,163,175,0.3)", glow: "rgba(156,163,175,0.12)",
    categories: ["전체", "무료", "라이프"],
  },
  {
    id: "luck", emoji: "🍀",
    title: "오늘의 행운",
    viral: "절기가 바뀌면, 좋은 기운을 부르는 방법도 바뀝니다",
    desc: "24절기 개운법·액막이법에 내 용신 기운을 더해 매일 다른 행운의 색·행동·매력 팁을 알려주고, 오늘의 메모와 행운 점수를 기록합니다.",
    tags: ["24절기", "개운법", "일일기록"],
    href: "/service/luck", badge: "",
    color: "#86efac", badgeBg: "rgba(22,163,74,0.85)",
    border: "rgba(134,239,172,0.3)", glow: "rgba(74,222,128,0.15)",
    categories: ["전체", "무료", "라이프"],
  },
  {
    id: "career", emoji: "🧭",
    title: "내 사주에 맞는 진짜 적성은?",
    viral: "남들 따라 고른 전공, 남들 다 가는 직장 — 사주는 처음부터 알고 있었다",
    desc: "사주 구조와 핵심 기운으로 보는 나에게 맞는 분야, 강점과 함정까지 한 번에 진단합니다.",
    tags: ["적성", "진로", "핵심기운"],
    href: "/service/career", badge: "",
    color: "#fbbf24", badgeBg: "rgba(217,119,6,0.85)",
    border: "rgba(251,191,36,0.3)", glow: "rgba(251,191,36,0.12)",
    categories: ["전체", "무료", "금전·투자"],
  },
  {
    id: "sidejob", emoji: "💼",
    title: "나도 투잡 가능한 사주일까?",
    viral: "누구는 부업으로 월급보다 더 벌고, 누구는 본업도 흔들린다",
    desc: "식상의 힘으로 보는 투잡 가능성, 욕심내면 위험한 구조, 나에게 맞는 부업 유형까지.",
    tags: ["투잡", "부업", "식상"],
    href: "/service/sidejob", badge: "",
    color: "#9ca3af", badgeBg: "rgba(107,114,128,0.85)",
    border: "rgba(156,163,175,0.3)", glow: "rgba(156,163,175,0.12)",
    categories: ["전체", "무료", "금전·투자", "라이프"],
  },
  {
    id: "nomad", emoji: "🌴",
    title: "나는 조직형? 사업가·노마드형?",
    viral: "같은 월급도 누군가는 답답하고, 누군가는 그 안정이 편안하다",
    desc: "사업가형·디지털노마드형·투자가형·안정추구형 중 내 사주에 가장 맞는 일하는 방식과 그 안에서 흔히 무너지는 함정까지.",
    tags: ["사업", "투자", "디지털노마드"],
    href: "/service/nomad", badge: "",
    color: "#fbbf24", badgeBg: "rgba(217,119,6,0.85)",
    border: "rgba(251,191,36,0.3)", glow: "rgba(251,191,36,0.12)",
    categories: ["전체", "무료", "금전·투자"],
  },
  {
    id: "zimidousu", emoji: "🔮",
    title: "자미두수: 나의 명궁(命宮)과 대표 주성은?",
    viral: "사주가 오행을 본다면, 자미두수는 별의 자리로 캐릭터를 본다",
    desc: "음력 생월·생시로 명궁을 산출하고, 14주성 중 나를 대표하는 별의 성격·진로·연애 스타일을 확인하세요.",
    tags: ["자미두수", "명궁", "주성"],
    href: "/service/zimidousu", badge: "",
    color: "#9ca3af", badgeBg: "rgba(107,114,128,0.85)",
    border: "rgba(156,163,175,0.3)", glow: "rgba(156,163,175,0.12)",
    categories: ["전체", "무료", "라이프"],
  },
  {
    id: "newyear", emoji: "🐎",
    title: "2026·2027 신년운세",
    viral: "병오년·정미년, 내 사주와 부딪히는 진짜 흐름은?",
    desc: "일간·일지·사주 핵심 기운 기준으로 다가올 두 해의 합·충·생·극을 분석해, 순풍인지 역풍인지 알려드립니다.",
    tags: ["신년운세", "병오년", "정미년"],
    href: "/service/newyear", badge: "",
    color: "#9ca3af", badgeBg: "rgba(107,114,128,0.85)",
    border: "rgba(156,163,175,0.3)", glow: "rgba(156,163,175,0.12)",
    categories: ["전체", "무료", "라이프"],
  },
  {
    id: "eros", emoji: "🌹",
    title: "나의 성적 매력은?",
    viral: "홍염살·목욕·도화살. 타고난 이성 매력의 진짜 본질",
    desc: "외모·음기·은근한 매력·꼬시는 팁까지. 사주로 보는 나의 성적 매력 완전 분석.",
    tags: ["홍염살", "도화살", "이성 매력"],
    href: "/service/eros", badge: "",
    color: "#f87171", badgeBg: "rgba(220,38,38,0.85)",
    border: "rgba(239,68,68,0.3)", glow: "rgba(239,68,68,0.12)",
    categories: ["전체", "무료", "연애·궁합", "매력"],
  },
  {
    id: "dohwasal", emoji: "🌸",
    title: "내 도화살은 어떤 도화살일까?",
    viral: "나체도화·곤랑도화·녹방도화... 내 매력의 '종류'와 부작용",
    desc: "7가지 도화살 유형 중 나에게 해당하는 것은? 주변의 질투·부러움부터 놓치면 안 되는 타이밍, 조심해야 할 위험 신호까지.",
    tags: ["도화살", "나체도화", "홍염살"],
    href: "/service/dohwasal", badge: "",
    color: "#f87171", badgeBg: "rgba(220,38,38,0.85)",
    border: "rgba(239,68,68,0.3)", glow: "rgba(239,68,68,0.12)",
    categories: ["전체", "무료", "연애·궁합", "매력"],
  },
  {
    id: "hotcompat", emoji: "🔥",
    title: "사주 속궁합",
    viral: "인해합목·정임합·자오충. 성적 케미의 진짜 순위",
    desc: "두 사람의 성적 케미를 사주로 분석합니다. 지지 육합부터 자오충까지 완전 공개.",
    tags: ["육합", "정임합", "자오충"],
    href: "/service/hotcompat", badge: "👑 프리미엄",
    color: PREMIUM_COLOR, badgeBg: PREMIUM_BADGE_BG,
    border: PREMIUM_BORDER, glow: PREMIUM_GLOW,
    categories: ["전체", "연애·궁합", "매력", "Special"], premium: true,
  },
  {
    id: "charm", emoji: "✨",
    title: "사주 매력 분석",
    viral: "본인만 모르는 숨겨진 이성 매력이 있습니다",
    desc: "도화살·홍염살·12운성으로 보는 이성 매력. 나도 몰랐던 타고난 매력 포인트를 완전히 공개합니다.",
    tags: ["도화살", "홍염살", "이성운"],
    href: "/service/charm", badge: "👑 프리미엄",
    color: PREMIUM_COLOR, badgeBg: PREMIUM_BADGE_BG,
    border: PREMIUM_BORDER, glow: PREMIUM_GLOW,
    categories: ["전체", "매력", "Special"], premium: true,
  },
  {
    id: "mbti", emoji: "🧬",
    title: "사주 × MBTI 조합",
    viral: "MBTI만으로는 절반밖에 모릅니다",
    desc: "사주 오행 + MBTI 16유형의 시너지 분석. 타고난 나를 두 가지 렌즈로 완전 해석하고 최적 직업을 제안합니다.",
    tags: ["MBTI", "성격 분석", "직업 추천"],
    href: "/service/mbti", badge: "",
    color: "#9ca3af", badgeBg: "rgba(107,114,128,0.85)",
    border: "rgba(156,163,175,0.3)", glow: "rgba(156,163,175,0.12)",
    categories: ["전체", "무료", "라이프"],
  },
  {
    id: "firstimpression", emoji: "✨",
    title: "사주로 보는 나의 첫인상",
    viral: "맞춤 인상 개선법까지 알려드립니다",
    desc: "월간(月干) 중심으로 연·월·일·시 천간을 종합해, 남들에게 비치는 첫인상과 오해받기 쉬운 부분, 맞춤 개선법까지 알려드립니다.",
    tags: ["월간", "첫인상", "인상 개선법"],
    href: "/service/firstimpression", badge: "",
    color: "#fbbf24", badgeBg: "rgba(217,119,6,0.85)",
    border: "rgba(251,191,36,0.3)", glow: "rgba(251,191,36,0.12)",
    categories: ["전체", "무료", "라이프"],
  },
  {
    id: "stock", emoji: "📈",
    title: "사주로 보는 주식 스타일",
    viral: "말아먹는 사주가 따로 있습니다. 지금 확인하세요",
    desc: "오행·12운성으로 보는 투자 DNA. ETF·개별주·코인·레버리지 중 내 사주에 맞는 투자 방식을 찾아드립니다.",
    tags: ["주식", "코인", "ETF·레버리지"],
    href: "/service/stock", badge: "",
    color: "#fbbf24", badgeBg: "rgba(217,119,6,0.85)",
    border: "rgba(251,191,36,0.3)", glow: "rgba(251,191,36,0.12)",
    categories: ["전체", "무료", "금전·투자"],
  },
  {
    id: "daewoon", emoji: "⏳",
    title: "대운·세운 80년 분석",
    viral: "내 인생이 몇 살에 터지는지 사주가 직접 알려줍니다",
    desc: "10년 단위 대운 8개, 세운 14년 흐름, 교운기 리스크까지. 당신의 인생 타임라인을 완전히 해석합니다.",
    tags: ["대운", "세운", "교운기 전략"],
    href: "/service/daewoon", badge: "👑 프리미엄",
    color: PREMIUM_COLOR, badgeBg: PREMIUM_BADGE_BG,
    border: PREMIUM_BORDER, glow: PREMIUM_GLOW,
    categories: ["전체", "운명·대운", "Special"], premium: true,
  },
  {
    id: "place", emoji: "🌍",
    title: "내 사주에 맞는 도시·나라",
    viral: "지금 사는 곳이 내 기운과 안 맞을 수 있습니다",
    desc: "내 사주 오행 방위로 찾는 최적의 거주지. 해외 이민·유학·출장에 유리한 나라를 오행 분석으로 추천합니다.",
    tags: ["거주지", "해외 추천", "사주 방위"],
    href: "/service/place", badge: "👑 프리미엄",
    color: PREMIUM_COLOR, badgeBg: PREMIUM_BADGE_BG,
    border: PREMIUM_BORDER, glow: PREMIUM_GLOW,
    categories: ["전체", "운명·대운", "라이프", "Special"], premium: true,
  },
  {
    id: "overcome", emoji: "⚡",
    title: "쓰레기 사주 극복법",
    viral: "역마살·귀문관살도 방향 맞으면 최강 무기입니다",
    desc: "내 신살과 오행 불균형을 제대로 알고 극복하는 완벽 가이드. 나쁜 사주도 방향 틀면 달라집니다.",
    tags: ["신살 극복", "오행 보완", "개운법"],
    href: "/service/overcome", badge: "👑 프리미엄",
    color: PREMIUM_COLOR, badgeBg: PREMIUM_BADGE_BG,
    border: PREMIUM_BORDER, glow: PREMIUM_GLOW,
    categories: ["전체", "운명·대운", "Special"], premium: true,
  },
  {
    id: "calendar", emoji: "📅",
    title: "길일·흉일 확인",
    viral: "결정의 날짜를 고르면 결과가 달라집니다",
    desc: "이사·결혼·시험·개업·계약·수술·여행·투자·연애·임신 — 내 사주와 맞는 최적의 날짜를 찾아드립니다.",
    tags: ["길일·흉일", "날짜 선택", "이사·결혼·시험"],
    href: "/service/calendar", badge: "",
    color: "#9ca3af", badgeBg: "rgba(107,114,128,0.85)",
    border: "rgba(156,163,175,0.3)", glow: "rgba(156,163,175,0.12)",
    categories: ["전체", "무료", "운명·대운", "라이프"],
  },
  {
    id: "taste", emoji: "🎬",
    title: "사주로 보는 취향 분석",
    viral: "내가 왜 그 영화에 울었는지 사주로 설명됩니다",
    desc: "오행별 영화·책·음악·여행 취향 완전 분석. 지금까지 좋아했던 것들이 사주로 다 설명됩니다.",
    tags: ["영화", "책", "여행 스타일"],
    href: "/service/taste", badge: "",
    color: "#9ca3af", badgeBg: "rgba(107,114,128,0.85)",
    border: "rgba(156,163,175,0.3)", glow: "rgba(156,163,175,0.12)",
    categories: ["전체", "무료", "라이프"],
  },
  {
    id: "exam", emoji: "📚",
    title: "시험운·합격운과 나만의 공부법",
    viral: "남들 공부법 따라 하면 안 되는 이유가 사주에 있습니다",
    desc: "오행 집중력 유형·공부 골든타임·합격 전략·학습 길신까지. 내 기운에 맞는 공부법을 찾으면 결과가 달라집니다.",
    tags: ["시험운", "합격운", "공부법"],
    href: "/service/exam", badge: "",
    color: "#a78bfa", badgeBg: "rgba(124,58,237,0.85)",
    border: "rgba(167,139,250,0.3)", glow: "rgba(167,139,250,0.12)",
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
    <div ref={ref} className="relative h-full">

      <div
        onClick={() => router.push(svc.href)}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className="kitsch-card cursor-pointer rounded-2xl flex flex-col h-full"
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? "translateY(0)" : "translateY(28px)",
          transition: `opacity 0.6s ease ${index * 55}ms, transform 0.6s cubic-bezier(0.22,1,0.36,1) ${index * 55}ms`,
          background: svc.id === "chat"
            ? hovered
              ? "linear-gradient(145deg, #1c0545 0%, #0f0228 50%, #1a0a3d 100%)"
              : "linear-gradient(145deg, rgba(109,40,217,0.28) 0%, rgba(6,4,20,0.97) 55%, rgba(91,33,182,0.18) 100%)"
            : svc.premium
              ? hovered
                ? "linear-gradient(145deg, #1a1100 0%, #0f0a00 50%, #1a1200 100%)"
                : "linear-gradient(145deg, rgba(161,98,7,0.18) 0%, rgba(6,4,0,0.97) 55%, rgba(120,70,0,0.12) 100%)"
            : hovered
              ? `linear-gradient(135deg, rgba(15,5,35,0.97) 0%, rgba(20,8,50,0.97) 100%)`
              : "rgba(11,4,28,0.85)",
          border: svc.id === "chat"
            ? `1px solid ${hovered ? "rgba(196,181,253,0.7)" : "rgba(139,92,246,0.5)"}`
            : svc.premium
              ? `1px solid ${hovered ? "rgba(251,191,36,0.7)" : "rgba(202,138,4,0.4)"}`
            : `1px solid ${hovered ? svc.color : "rgba(255,255,255,0.08)"}`,
          boxShadow: svc.id === "chat"
            ? hovered
              ? `0 0 0 1px rgba(139,92,246,0.4), 0 16px 56px rgba(124,58,237,0.4), inset 0 1px 0 rgba(196,181,253,0.1)`
              : `0 0 24px rgba(124,58,237,0.2), inset 0 1px 0 rgba(196,181,253,0.06)`
            : svc.premium
              ? hovered
                ? `0 0 0 1px rgba(202,138,4,0.4), 0 16px 56px rgba(161,98,7,0.35), inset 0 1px 0 rgba(251,191,36,0.08)`
                : `0 0 20px rgba(161,98,7,0.18), inset 0 1px 0 rgba(251,191,36,0.05)`
            : hovered
              ? `0 0 0 1px ${svc.border}, 0 12px 48px ${svc.glow}, inset 0 1px 0 rgba(255,255,255,0.06)`
              : "inset 0 1px 0 rgba(255,255,255,0.03)",
        }}
      >
        {/* 월령도사 오라 오버레이 */}
        {svc.id === "chat" && (
          <div className="absolute inset-0 rounded-2xl pointer-events-none overflow-hidden" aria-hidden>
            <div style={{
              position: "absolute", top: "-30%", right: "-10%", width: "55%", height: "130%",
              background: "radial-gradient(ellipse, rgba(124,58,237,0.18) 0%, transparent 70%)",
              transition: "opacity 0.4s", opacity: hovered ? 1 : 0.6,
            }} />
            <div style={{
              position: "absolute", bottom: "-20%", left: "5%", width: "40%", height: "80%",
              background: "radial-gradient(ellipse, rgba(99,102,241,0.14) 0%, transparent 70%)",
              transition: "opacity 0.4s", opacity: hovered ? 1 : 0.5,
            }} />
          </div>
        )}

        {/* 프리미엄 골드 오라 오버레이 */}
        {svc.premium && (
          <div className="absolute inset-0 rounded-2xl pointer-events-none overflow-hidden" aria-hidden>
            <div style={{
              position: "absolute", top: "-30%", right: "-10%", width: "55%", height: "130%",
              background: "radial-gradient(ellipse, rgba(202,138,4,0.16) 0%, transparent 70%)",
              transition: "opacity 0.4s", opacity: hovered ? 1 : 0.5,
            }} />
            <div style={{
              position: "absolute", bottom: "-20%", left: "5%", width: "40%", height: "80%",
              background: "radial-gradient(ellipse, rgba(161,98,7,0.12) 0%, transparent 70%)",
              transition: "opacity 0.4s", opacity: hovered ? 1 : 0.4,
            }} />
          </div>
        )}

        {/* 왼쪽 컬러 스트라이프 */}
        <div className="flex flex-1">
          <div className="w-1 rounded-l-2xl shrink-0" style={{ background: `linear-gradient(180deg, ${svc.color}, transparent)`, opacity: hovered ? 1 : 0.4, transition: "opacity 0.3s" }} />

          <div className="flex-1 p-5 flex flex-col gap-3.5">
            {/* 헤더 */}
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-3">
                <div className="text-2xl w-11 h-11 flex items-center justify-center rounded-xl shrink-0"
                  style={{
                    background: `linear-gradient(135deg, ${svc.glow.replace('0.12','0.25').replace('0.15','0.3')}, rgba(255,255,255,0.03))`,
                    border: `1px solid ${svc.border}`,
                    boxShadow: hovered ? `0 0 16px ${svc.glow}` : "none",
                    transition: "box-shadow 0.3s",
                  }}>
                  {svc.emoji}
                </div>
                <div>
                  <h3 className="text-[15px] font-black text-white leading-tight">{svc.title}</h3>
                  {svc.badge && (
                    <span className="inline-block mt-0.5 text-[10px] font-black px-2 py-0.5 rounded-full text-white"
                      style={{ background: svc.badgeBg }}>
                      {svc.badge}
                    </span>
                  )}
                </div>
              </div>
              <span className="text-sm font-black shrink-0 transition-transform duration-200"
                style={{ color: svc.color, transform: hovered ? "translateX(4px)" : "translateX(0)" }}>→</span>
            </div>

            {/* 바이럴 카피 */}
            <p className="text-[13px] font-bold leading-snug" style={{ color: svc.color }}>
              &ldquo;{svc.viral}&rdquo;
            </p>

            {/* 설명 */}
            <p className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.55)" }}>
              {svc.desc}
            </p>

            {/* 태그 */}
            <div className="flex flex-wrap gap-1.5">
              {svc.tags.map(tag => (
                <span key={tag} className="text-[10px] px-2.5 py-1 rounded-full font-medium"
                  style={{
                    background: `${svc.glow.replace('0.12','0.12').replace('0.15','0.12')}`,
                    color: svc.color,
                    border: `1px solid ${svc.border}`,
                  }}>
                  {tag}
                </span>
              ))}
            </div>
          </div>
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
  const [activityIndex, setActivityIndex] = useState(0);
  const [activityVisible, setActivityVisible] = useState(true);
  const [noticeIndex, setNoticeIndex] = useState(0);
  const [noticeVisible, setNoticeVisible] = useState(true);
  const [activeCategory, setActiveCategory] = useState<Category>("전체");
  // 언어
  const [lang, setLang] = useState<Lang>("ko");
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const langMenuRef = useRef<HTMLDivElement>(null);

  // 별조각 잔액
  const [blueberries, setBlueberries] = useState(0);

  const t = UI[lang];

  useEffect(() => {
    const savedLang = localStorage.getItem("sp_lang") as Lang | null;
    if (savedLang && savedLang in LANGS) setLang(savedLang);
    const hasUser = document.cookie.split(";").some(c => c.trim().startsWith("sp_user="));
    if (hasUser) {
      let bb = parseInt(localStorage.getItem("sp_blueberries") ?? "", 10);
      if (isNaN(bb)) {
        bb = 864000;
        localStorage.setItem("sp_blueberries", String(bb));
      }
      setBlueberries(bb);
    } else {
      setBlueberries(0);
    }
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
    const interval = setInterval(() => {
      setActivityVisible(false);
      setTimeout(() => {
        setActivityIndex(i => (i + 1) % ACTIVITY_ENTRIES.length);
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
    <main className="min-h-screen text-white" style={{ background: "#020c1b", overflowX: "clip" }}>

      {/* ── 배경 글로우 ── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {/* 핑크 좌상단 */}
        <div className="absolute top-[-15%] left-[-5%] w-[700px] h-[700px] rounded-full blur-[200px]"
          style={{ background: "rgba(59,130,246,0.15)" }} />
        {/* 퍼플 중앙 */}
        <div className="absolute top-[30%] right-[-10%] w-[600px] h-[600px] rounded-full blur-[220px]"
          style={{ background: "rgba(30,64,175,0.12)" }} />
        {/* 골드 하단 */}
        <div className="absolute bottom-[-10%] left-[20%] w-[700px] h-[700px] rounded-full blur-[200px]"
          style={{ background: "rgba(6,182,212,0.08)" }} />
        {/* 사이언 우하단 */}
        <div className="absolute bottom-[10%] right-[5%] w-[400px] h-[400px] rounded-full blur-[160px]"
          style={{ background: "rgba(245,197,24,0.05)" }} />
        {/* 미세 그리드 패턴 */}
        <div className="absolute inset-0 opacity-[0.025]"
          style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)", backgroundSize: "80px 80px" }} />
      </div>

      {/* ── 모바일 상단 헤더 ── */}
      <header className="sm:hidden sticky top-0 z-50 border-b backdrop-blur-xl flex items-center justify-between px-4 h-12"
        style={{ background: "rgba(7,0,26,0.92)", borderColor: "rgba(59,130,246,0.15)" }}>
        <button onClick={() => router.push("/")} className="flex items-center gap-2">
          <span className="text-base" style={{ color: "#3b82f6" }}>☯</span>
          <span className="font-black text-sm text-white">Summer Palace</span>
        </button>
        <button onClick={() => setShowMobileMenu(v => !v)}
          className="flex flex-col gap-[5px] p-2 rounded-lg"
          style={{ color: "rgba(255,255,255,0.6)" }}>
          <span className="block w-5 h-[2px] rounded-full bg-current" />
          <span className="block w-5 h-[2px] rounded-full bg-current" />
          <span className="block w-5 h-[2px] rounded-full bg-current" />
        </button>
        {showMobileMenu && (
          <div className="absolute top-12 left-0 right-0 z-50 border-b"
            style={{ background: "rgba(7,0,26,0.98)", borderColor: "rgba(59,130,246,0.15)" }}
            onClick={() => setShowMobileMenu(false)}>
            {[
              { label: t.mobileMenu[0], onClick: () => router.push("/") },
              { label: t.mobileMenu[1], onClick: () => { router.push("/"); setTimeout(() => document.getElementById("services-section")?.scrollIntoView({ behavior: "smooth" }), 100); } },
              { label: t.mobileMenu[2], onClick: () => router.push("/service/manseryeok") },
              { label: t.mobileMenu[3], onClick: () => router.push("/chat") },
              { label: t.mobileMenu[4], onClick: () => router.push("/service/today") },
              { label: t.mobileMenu[5], onClick: () => document.getElementById("iljin-section")?.scrollIntoView({ behavior: "smooth" }) },
              { label: t.mobileMenu[6], onClick: () => document.getElementById("guide-section")?.scrollIntoView({ behavior: "smooth" }) },
              { label: t.mobileMenu[7], onClick: () => router.push("/mypage") },
            ].map(item => (
              <button key={item.label} onClick={item.onClick}
                className="w-full text-left px-5 py-3.5 text-sm font-semibold border-b transition-colors hover:bg-white/5"
                style={{ color: "rgba(255,255,255,0.75)", borderColor: "rgba(255,255,255,0.05)" }}>
                {item.label}
              </button>
            ))}
            <div className="px-5 py-3">
              <KakaoLoginButton redirectTo="/" />
            </div>
          </div>
        )}
      </header>

      {/* ── 상단 네비게이션 (모바일 숨김) ── */}
      <nav className="hidden sm:block sticky top-0 z-50 border-b backdrop-blur-xl"
        style={{ background: "rgba(7,0,26,0.88)", borderColor: "rgba(59,130,246,0.15)" }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <button onClick={() => router.push("/")} className="flex items-center gap-2.5">
            <span className="text-xl star-1" style={{ color: "#3b82f6" }}>☯</span>
            <span className="font-black text-base tracking-tight text-white">Summer Palace</span>
            <span className="hidden sm:block text-[10px] px-2 py-0.5 rounded-full font-black"
              style={{ background: "rgba(59,130,246,0.15)", color: "#3b82f6", border: "1px solid rgba(59,130,246,0.25)" }}>
              {t.navBadge}
            </span>
          </button>

          {/* 상단 네비 링크 */}
          <div className="hidden sm:flex items-center gap-1">
            {[
              { label: t.nav[0], onClick: () => document.getElementById("services-section")?.scrollIntoView({ behavior: "smooth" }) },
              { label: t.nav[1], onClick: () => document.getElementById("guide-section")?.scrollIntoView({ behavior: "smooth" }) },
              { label: t.nav[2], onClick: () => document.getElementById("iljin-section")?.scrollIntoView({ behavior: "smooth" }) },
              { label: t.nav[3], onClick: () => document.getElementById("iljin-section")?.scrollIntoView({ behavior: "smooth" }) },
            ].map(item => (
              <button key={item.label} onClick={item.onClick}
                className="px-3 py-1.5 rounded-full text-sm font-semibold transition-all hover:text-white"
                style={{ color: "rgba(255,255,255,0.5)" }}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            {/* 보관함 — PC only */}
            <button
              onClick={() => router.push("/mypage")}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all hover:scale-105"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)" }}
            >
              <span>📂</span>
              <span>{t.mypage}</span>
            </button>
            {/* 별조각 잔액/충전 — PC only */}
            <button
              onClick={() => router.push("/charge")}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all hover:scale-105"
              style={{
                background: blueberries > 0 ? "rgba(139,92,246,0.18)" : "rgba(255,255,255,0.04)",
                border: blueberries > 0 ? "1px solid rgba(139,92,246,0.4)" : "1px solid rgba(255,255,255,0.1)",
                color: blueberries > 0 ? "#c4b5fd" : "rgba(255,255,255,0.45)",
              }}
            >
              <span>✦</span>
              <span>{blueberries > 0 ? blueberries.toLocaleString() : t.charging}</span>
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

            <div className="hidden sm:block">
              <KakaoLoginButton redirectTo="/" />
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 pb-20" style={{ overflow: "visible" }}>

        {/* ── 히어로 섹션 ── */}
        <section className="py-16 sm:py-24 text-center relative" style={{ overflow: "visible" }}>
          {/* 마스코트 */}
          <div className="absolute pointer-events-none select-none sm:hidden"
            style={{ right: -10, top: -10, width: 110, padding: 8, overflow: "visible" }}>
            <Image src="/mascot.png" alt="사주 마스코트" width={110} height={165} priority
              style={{ width: "100%", height: "auto", display: "block", filter: "drop-shadow(0 8px 32px rgba(147,51,234,0.4))" }} />
          </div>
          <div className="absolute pointer-events-none select-none hidden sm:block"
            style={{ right: -20, bottom: -20, width: 260, padding: 24, overflow: "visible" }}>
            <Image src="/mascot.png" alt="사주 마스코트" width={260} height={390} priority
              style={{ width: "100%", height: "auto", display: "block", filter: "drop-shadow(0 8px 32px rgba(147,51,234,0.4))" }} />
          </div>

          {/* 플로팅 장식 별 */}
          <span className="absolute top-8 left-[8%] text-2xl star-1 pointer-events-none select-none" style={{ color: "#ec4899" }}>✦</span>
          <span className="absolute top-20 right-[10%] text-lg star-2 pointer-events-none select-none" style={{ color: "#a78bfa" }}>✦</span>
          <span className="absolute bottom-24 left-[15%] text-base star-3 pointer-events-none select-none" style={{ color: "#f472b6" }}>◆</span>
          <span className="absolute bottom-16 right-[12%] text-xl star-4 pointer-events-none select-none" style={{ color: "#818cf8" }}>✦</span>

          {/* 스파클 아이콘 */}
          <div className="flex justify-center mb-5">
            <div className="relative">
              <span className="text-4xl" style={{ filter: "drop-shadow(0 0 20px rgba(236,72,153,0.5))" }}>✦</span>
              <span className="text-2xl absolute -top-2 -right-4" style={{ filter: "drop-shadow(0 0 12px rgba(167,139,250,0.6))" }}>✦</span>
            </div>
          </div>

          {/* 실시간 카운터 */}
          <div className="flex justify-center mb-8">
            <div className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-bold"
              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.7)" }}>
              <span className="w-2 h-2 rounded-full animate-pulse shrink-0" style={{ background: "#4ade80", boxShadow: "0 0 6px #4ade80" }} />
              <span style={{ opacity: activityVisible ? 1 : 0, transition: "opacity 0.4s ease" }}>
                {renderActivity(ACTIVITY_ENTRIES[activityIndex], lang)}
              </span>
            </div>
          </div>

          {/* 메인 헤드라인 */}
          <div className="mb-3 max-w-md mx-auto px-2">
            <h1 className="text-4xl sm:text-5xl font-black leading-tight mb-4 text-white" style={{ letterSpacing: "-0.02em" }}>
              {t.h1[0]}<br />
              <span style={{ color: "#f472b6" }}>{t.h1[1]}</span><br />
              {t.h1[2]}
            </h1>
          </div>


          {/* 신뢰 메시지 */}
          <div className="max-w-sm sm:max-w-xl mx-auto px-4 mb-6">
            <div className="rounded-2xl px-5 py-5 sm:px-7 sm:py-6"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <p className="text-sm sm:text-base font-bold mb-4 text-center sm:text-left" style={{ color: "rgba(255,255,255,0.92)" }}>
                {t.trustHeadline}
              </p>
              <ul className="space-y-2.5">
                {t.trustBullets.map((bullet, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-[13px] sm:text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.65)" }}>
                    <span className="shrink-0" style={{ color: "rgba(255,255,255,0.3)" }}>·</span>
                    <span dangerouslySetInnerHTML={{ __html: bullet }} />
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* CTA 버튼 — 전체 너비 핑크-퍼플 */}
          <div className="max-w-sm mx-auto px-4 mb-4">
            <button
              onClick={() => router.push("/service/manseryeok")}
              className="cta-btn w-full font-black text-lg py-5 rounded-2xl transition-all duration-200 hover:scale-[1.03] active:scale-[0.97]"
              style={{
                background: "linear-gradient(135deg, #db2777, #9333ea)",
                color: "#fff",
                boxShadow: "0 0 40px rgba(219,39,119,0.35), 0 0 80px rgba(147,51,234,0.2)",
              }}
            >
              {t.heroCta}
            </button>
          </div>

          {/* 별점 + 누적 */}
          <div className="flex items-center justify-center gap-4 flex-wrap mt-4">
            <div className="inline-flex items-center gap-2 text-xs px-4 py-2 rounded-full"
              style={{ background: "rgba(245,197,24,0.08)", border: "1px solid rgba(245,197,24,0.18)", color: "rgba(255,255,255,0.55)" }}>
              <span style={{ color: "#f5c518" }}>★★★★★</span>
              <span className="font-bold" style={{ color: "#f5c518" }}>4.7</span>
              <span>{t.ratingLabel}</span>
            </div>
            <div className="inline-flex items-center gap-2 text-xs px-4 py-2 rounded-full"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.45)" }}>
              <span>{t.counterLabel.split('{n}')[0]}<strong style={{ color: "rgba(255,255,255,0.8)" }}>{counter.toLocaleString()}</strong>{t.counterLabel.split('{n}')[1]}</span>
            </div>
          </div>

        </section>

        {/* ── 공지사항 (1줄 롤링) ── */}
        <section className="mb-10">
          <div
            className="flex items-center gap-3 px-4 py-3 rounded-2xl cursor-pointer transition-all hover:scale-[1.01]"
            style={{ background: "rgba(59,130,246,0.05)", border: "1px solid rgba(59,130,246,0.15)" }}
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

        {/* ── 광고 배너 ── */}
        <div className="mb-6">
          <AdBanner />
        </div>

        {/* ── 면책 공지 ── */}
        <p className="text-center mb-6" style={{ color: "rgba(255,255,255,0.18)", fontSize: 10 }}>
          {t.disclaimerShort}
        </p>

        {/* ── 서비스 섹션 ── */}
        <section id="services-section" className="mb-16" style={{ scrollMarginTop: "72px" }}>
          <div className="flex items-end justify-between mb-6">
            <div>
              <p className="text-xs font-black mb-1.5 tracking-widest uppercase shimmer-text">✦ AI SERVICES</p>
              <h2 className="text-2xl sm:text-3xl font-black text-white">{t.servicesHeading}</h2>
            </div>
            <span className="text-xs px-3 py-1 rounded-full font-bold"
              style={{ background: "rgba(59,130,246,0.08)", border: "1px solid rgba(59,130,246,0.2)", color: "#3b82f6" }}>
              {SERVICES.filter(s => s.categories.includes(activeCategory)).length}{t.servicesCountUnit}
            </span>
          </div>

          {/* ── 카테고리 필터 탭 ── */}
          {(() => {
            const CAT_COLORS: Record<string, { bg: string; border: string; text: string; glow: string }> = {
              "전체":    { bg: "rgba(255,255,255,0.08)", border: "rgba(255,255,255,0.2)",  text: "#ffffff",  glow: "rgba(255,255,255,0.1)" },
              "무료":    { bg: "rgba(16,185,129,0.18)",  border: "rgba(16,185,129,0.4)",   text: "#6ee7b7",  glow: "rgba(16,185,129,0.2)" },
              "연애·궁합":{ bg: "rgba(59,130,246,0.15)", border: "rgba(59,130,246,0.4)",   text: "#3b82f6",  glow: "rgba(59,130,246,0.2)" },
              "금전·투자":{ bg: "rgba(16,185,129,0.15)", border: "rgba(16,185,129,0.35)",  text: "#34d399",  glow: "rgba(16,185,129,0.15)" },
              "운명·대운":{ bg: "rgba(245,197,24,0.12)", border: "rgba(245,197,24,0.35)",  text: "#f5c518",  glow: "rgba(245,197,24,0.15)" },
              "라이프":  { bg: "rgba(139,92,246,0.15)",  border: "rgba(139,92,246,0.4)",   text: "#a78bfa",  glow: "rgba(139,92,246,0.2)" },
              "Special": { bg: "rgba(245,197,24,0.15)",  border: "rgba(245,197,24,0.45)",  text: "#fbbf24",  glow: "rgba(245,197,24,0.2)" },
              "매력":    { bg: "rgba(244,114,182,0.15)", border: "rgba(244,114,182,0.4)",  text: "#f472b6",  glow: "rgba(244,114,182,0.2)" },
            };
            return (
              <div className="relative mb-6">
                <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                  {CATEGORIES.map(({ key, icon }) => {
                    const isActive = activeCategory === key;
                    const c = CAT_COLORS[key] || CAT_COLORS["전체"];
                    const count = key === "전체" ? SERVICES.length : SERVICES.filter(s => s.categories.includes(key)).length;
                    return (
                      <button
                        key={key}
                        onClick={() => setActiveCategory(key)}
                        className="shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black transition-all duration-200 whitespace-nowrap"
                        style={{
                          background: isActive ? c.bg : "rgba(255,255,255,0.03)",
                          border: isActive ? `1.5px solid ${c.border}` : "1px solid rgba(255,255,255,0.07)",
                          color: isActive ? c.text : "rgba(255,255,255,0.38)",
                          boxShadow: isActive ? `0 0 16px ${c.glow}` : "none",
                          transform: isActive ? "scale(1.05)" : "scale(1)",
                        }}
                      >
                        <span>{icon}</span>
                        <span>{t.catLabel[key]}</span>
                        {isActive && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full font-black"
                            style={{ background: "rgba(255,255,255,0.15)" }}>
                            {count}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
                <div className="absolute right-0 top-0 bottom-1 w-10 pointer-events-none"
                  style={{ background: "linear-gradient(to right, transparent, #020c1b)" }} />
              </div>
            );
          })()}

          {/* 데스크탑: 2컬럼, 모바일: 1컬럼 — 카드 overflow 허용으로 스티커 노출 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 overflow-visible items-stretch">
            {SERVICES
              .filter(s => s.categories.includes(activeCategory))
              .map((svc, i) => (
                <div key={svc.id}>
                  <ServiceCard svc={svc} index={i} startLabel={t.start} />
                </div>
              ))}
          </div>

          {SERVICES.filter(s => s.categories.includes(activeCategory)).length === 0 && (
            <div className="text-center py-16 text-gray-600 text-sm">
              {t.emptyServices}
            </div>
          )}
        </section>

        {/* ── 정보성 가이드 배너 ── */}
        <section id="guide-section" className="mb-10" style={{ scrollMarginTop: "72px" }}>
          <div className="rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center gap-4"
            style={{
              background: "linear-gradient(135deg, rgba(201,168,76,0.16) 0%, rgba(201,168,76,0.05) 100%)",
              border: "1px solid rgba(201,168,76,0.45)",
              boxShadow: "0 0 24px rgba(201,168,76,0.15)",
            }}>
            <div className="flex items-center gap-6 flex-1 min-w-0">
              <div className="shrink-0">
                <Image src="/mascot-guide.png" alt="사주 마스코트" width={68} height={79}
                  className="drop-shadow-[0_4px_16px_rgba(0,0,0,0.4)]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-black mb-1 uppercase tracking-widest" style={{ color: "#e0c168" }}>{t.guideChip}</p>
                <p className="text-base font-black text-white mb-1">{t.guideTitle}</p>
                <p className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.65)" }}>
                  {t.guideDesc}
                </p>
              </div>
            </div>
            <button
              onClick={() => router.push("/guide")}
              className="shrink-0 text-sm font-black px-5 py-2.5 rounded-xl transition-all"
              style={{ background: "#c9a84c", color: "#1a1305", border: "1px solid #c9a84c" }}
            >
              {t.guideBtn}
            </button>
          </div>
        </section>

        {/* ── 바이럴 띠 배너 ── */}
        <section className="mb-16 -mx-4 sm:-mx-6">
          <div className="relative py-12 sm:py-16 px-6 sm:px-12 text-center overflow-hidden"
            style={{
              background: "linear-gradient(135deg, rgba(59,130,246,0.15) 0%, rgba(7,0,26,0.95) 45%, rgba(30,64,175,0.12) 100%)",
              borderTop: "1px solid rgba(59,130,246,0.2)",
              borderBottom: "1px solid rgba(139,92,246,0.2)",
            }}>
            {/* 배경 큰 기호 */}
            <div className="absolute inset-0 flex items-center justify-center select-none pointer-events-none"
              style={{ fontSize: 280, opacity: 0.018, fontWeight: 900, color: "#3b82f6" }}>命</div>
            {/* 장식 별 */}
            <span className="absolute top-6 left-[10%] text-2xl star-1" style={{ color: "#3b82f6", opacity: 0.6 }}>✦</span>
            <span className="absolute bottom-6 right-[8%] text-xl star-3" style={{ color: "#f5c518", opacity: 0.6 }}>★</span>

            <p className="text-xs font-black mb-4 tracking-widest uppercase" style={{ color: "rgba(59,130,246,0.7)" }}>✦ Before & After ✦</p>
            <h3 className="text-lg sm:text-3xl font-black text-white mb-5 leading-snug">
              &ldquo;{t.bannerMain}<span style={{ color: "#3b82f6", textShadow: "0 0 30px rgba(59,130,246,0.4)" }}>{t.bannerHighlight}&rdquo;</span>
            </h3>
            <p className="text-sm sm:text-base max-w-md mx-auto leading-relaxed" style={{ color: "rgba(255,255,255,0.55)" }}>
              {t.bannerSub1}<br />
              {t.bannerSub2}
            </p>
          </div>
        </section>

        {/* ── 후기 게시판 ── */}
        <section className="mb-16">
          <div className="flex items-end justify-between mb-6">
            <div>
              <p className="text-xs font-black mb-1.5 tracking-widest uppercase shimmer-text">✦ REVIEWS</p>
              <h2 className="text-2xl sm:text-3xl font-black text-white">{t.reviewsHeading}</h2>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full"
              style={{ background: "rgba(245,197,24,0.08)", border: "1px solid rgba(245,197,24,0.2)" }}>
              <span style={{ color: "#f5c518" }}>★★★★★</span>
              <span className="text-xs font-black" style={{ color: "#f5c518" }}>4.7</span>
            </div>
          </div>

          {/* 무한 가로 스크롤 필름 */}
          <div className="overflow-hidden -mx-4 sm:-mx-6">
            <div
              className="review-ticker flex gap-3 py-2 px-4 sm:px-6"
              style={{ animation: "reviewTicker 490s linear infinite", width: "max-content" }}
            >
              {[...REVIEWS, ...REVIEWS].map((r, i) => (
                <div key={i} className="w-72 shrink-0 rounded-2xl p-5 flex flex-col gap-3"
                  style={{
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderTop: "2px solid rgba(59,130,246,0.3)",
                  }}>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-black text-white">{r.name}</p>
                      <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>{r.region} · {r.age}</p>
                    </div>
                    <span className="text-[10px] px-2 py-1 rounded-full shrink-0 font-bold"
                      style={{ background: "rgba(59,130,246,0.1)", color: "#3b82f6", border: "1px solid rgba(59,130,246,0.2)" }}>
                      {r.service}
                    </span>
                  </div>
                  <div className="flex gap-0.5">
                    {Array.from({ length: r.stars }).map((_, j) => (
                      <span key={j} style={{ color: "#f5c518" }}>★</span>
                    ))}
                  </div>
                  <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.7)" }}>
                    &ldquo;{r.text}&rdquo;
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>


      </div>

      {/* ── 일진달력 + 문의하기 (PC 나란히 / 모바일 세로) ── */}
      <section id="iljin-section" className="border-t" style={{ borderColor: "rgba(59,130,246,0.1)", scrollMarginTop: "72px" }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="rounded-2xl p-6" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <IljinCalendar />
          </div>
          <div className="rounded-2xl p-6" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)" }}>
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
            <button onClick={() => router.push("/privacy")} className="hover:text-amber-400/70 transition-colors" style={{ color: "rgba(255,255,255,0.35)" }}>개인정보처리방침</button>
            <span style={{ color: "rgba(255,255,255,0.15)" }}>|</span>
            <button onClick={() => router.push("/refund")} className="hover:text-amber-400/70 transition-colors">환불규정</button>
            <span style={{ color: "rgba(255,255,255,0.15)" }}>|</span>
            <a href="http://pf.kakao.com/_cuksX" target="_blank" rel="noopener noreferrer" className="hover:text-yellow-400/70 transition-colors">고객센터(카카오 채널)</a>
          </div>

          <div className="text-center space-y-1.5 mb-4" style={{ color: "rgba(255,255,255,0.22)", fontSize: 11 }}>
            <p>상호: 여름궁전(Summer Palace) · 대표: 정다정 · 이메일: smple@outlook.kr</p>
            <p>통신판매업 신고번호: 제2026-경남거제-0229호 · 사업자등록번호: 707-28-01614 · 유선번호: 0502-6682-6628</p>
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

      {/* ── 모바일 카카오 로그인 고정 플로팅 (하단 nav 위) ── */}
      <div className="fixed bottom-[4.5rem] left-0 right-0 z-40 sm:hidden px-4 pb-2">
        <KakaoLoginButton redirectTo="/" floating />
      </div>

      {/* ── 네이버 첫 로그인 프로필 저장 모달 ── */}
      <NaverFirstLoginModal />

      {/* ── 모바일 하단 네비게이션 ── */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 sm:hidden border-t"
        style={{ background: "rgba(7,0,26,0.97)", borderColor: "rgba(59,130,246,0.15)", backdropFilter: "blur(20px)" }}>
        <div className="flex items-stretch h-[4.5rem]">
          {[
            { icon: "🏠", label: t.mobileNav[0], href: "/" },
            { icon: "✨", label: t.mobileNav[1], href: "/#services-section" },
            { icon: "📦", label: t.mobileNav[2], href: "/mypage" },
            { icon: "💬", label: t.mobileNav[3], href: "http://pf.kakao.com/_cuksX", external: true },
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
