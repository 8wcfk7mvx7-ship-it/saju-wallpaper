// ── 훈녀생정 데이터베이스 ─────────────────────────────────────────────────────
// "훈녀생정"은 2000년대 중반, 아직 초·중딩이었던 90년대생들이 싸이월드·블로그·
// 미즈넷 같은 곳에 올리고 퍼 나르던 "훈훈한 여자 생활정보"의 줄임말이다.
// 화장품 살 돈은 없어도 밀가루·꿀·계란은 집에 있었던 그 시절, 얼짱은 못 돼도
// "훈녀"는 될 수 있다는 믿음으로 만들어졌던 손편지 같은 정보들을 복원했다.
//
// ⚠️ 다이어트 항목은 그 시절 유행했던 방식을 그대로 재현한 "추억 콘텐츠"입니다.
// 현재 기준으로는 영양 불균형·요요 위험이 있으니 실제로 따라 할 땐 균형 잡힌
// 식사를 기본으로 하고, 무리한 원푸드 다이어트는 피하세요.

export type HunnyeoCategoryKey =
  | "all" | "skincare" | "diet" | "hair" | "foot" | "wannso" | "miznet";

export const CATEGORIES: { key: HunnyeoCategoryKey; label: string; emoji: string; accent: string; desc: string }[] = [
  { key: "all",      label: "전체",         emoji: "🎀", accent: "#ff6fa5", desc: "훈녀생정 전체 모아보기" },
  { key: "skincare", label: "밀가루팩",      emoji: "🍎", accent: "#ff8fb3", desc: "집에 있는 재료로 만드는 미백팩" },
  { key: "diet",     label: "다이어트",      emoji: "🍉", accent: "#4fb56b", desc: "그 시절 유행했던 다이어트법" },
  { key: "hair",     label: "헤어관리",      emoji: "💇‍♀️", accent: "#a78bfa", desc: "찰랑머릿결 & 얼짱각도" },
  { key: "foot",     label: "발관리",        emoji: "🦶", accent: "#38bdf8", desc: "샌들 시즌 대비 발 각질 케어" },
  { key: "wannso",   label: "완소템",        emoji: "💗", accent: "#f472b6", desc: "그 시절 완소템 컬렉션" },
  { key: "miznet",   label: "미즈넷다이어리", emoji: "💌", accent: "#fbbf24", desc: "그 시절 인터넷 트리비아" },
];

export type TipType = "action" | "read";

export interface HunnyeoTip {
  id: string;
  category: Exclude<HunnyeoCategoryKey, "all">;
  title: string;
  author: string;
  date: string;
  views: number;
  baseStamps: number; // 초기 표시용 "완소 도장" 수 (실제 카운트 아님, 추억 연출용)
  tags: string[];
  body: string[]; // 문단별 본문 (그 시절 말투 그대로)
  caution?: string; // 현재 기준 안전 안내 (필요한 항목만)
  points: number; // 체크 완료 시 얻는 훈녀력 포인트
  type: TipType; // action = 직접 해보는 팁, read = 읽고 아는 트리비아
}

export const TIPS: HunnyeoTip[] = [
  // ── 밀가루팩 (스킨케어) ──────────────────────────────────────────────────
  {
    id: "flour-apple",
    category: "skincare",
    title: "★필수★ 사과꿀 밀가루팩 — 뽀샤시 백옥피부 만드는 법",
    author: "완소소녀**",
    date: "2007.07.18",
    views: 18342,
    baseStamps: 512,
    tags: ["#완소", "#미백", "#강추", "#집에있는재료"],
    body: [
      "얘들아 이거 진짜 안 하면 후회한다ㅠㅠ 사과 1/4쪽 강판에 곱게 갈고 → 꿀 1티스푼 + 밀가루 2스푼 넣고 골고루 섞어줘. 농도는 안 흘러내릴 정도로만!",
      "세안하고 물기 톡톡 닦은 다음 눈이랑 입 주위 빼고 발라줘~ 그 위에 거즈 한 장 덮으면 더 촉촉해짐(꿀팁ㅋㅋ). 20~30분 있다가 미지근한 물로 씻고 마지막에 찬물로 헹구면 모공까지 조여져서 완전 뽀송뽀송.",
      "사과에 과일산 성분이 있어서 묵은 각질 정리해주고 톤도 맑아지는 느낌?! 일주일에 2번 정도만 해도 확실히 얼굴이 환해진다ㅜㅜ 완소.",
    ],
    points: 12,
    type: "action",
  },
  {
    id: "flour-orange",
    category: "skincare",
    title: "오렌지즙+밀가루팩 — 칙칙한 피부 화사하게",
    author: "핑크공쥬♡",
    date: "2006.11.02",
    views: 9871,
    baseStamps: 288,
    tags: ["#미백팩", "#비타민c", "#훈녀필수템"],
    body: [
      "오렌지 반 개 즙 짜서 밀가루랑 꿀 조금 넣고 되직하게 섞어줌. 비타민C 많아서 칙칙한 피부에 완전 짱임!",
      "근데 이거 하고 나서 바로 햇빛 보면 얼룩질 수 있다니까 저녁에 씻고 바르는 거 추천~ 20분 후에 씻어내면 얼굴이 확실히 환해진 게 느껴짐.",
    ],
    caution: "감귤류 즙을 바른 뒤 자외선에 노출되면 색소침착이 생길 수 있어요. 실제로 해본다면 반드시 밤에, 바른 부위는 다음 날까지 자외선 차단제로 가려주세요.",
    points: 12,
    type: "action",
  },
  {
    id: "flour-potato",
    category: "skincare",
    title: "감자팩 — 다크서클 & 붓기 진정 (엄마가 알려줌)",
    author: "훈녀되고파",
    date: "2008.02.29",
    views: 7213,
    baseStamps: 201,
    tags: ["#감자팩", "#진정", "#눈밑고민"],
    body: [
      "감자 껍질 벗기고 강판에 곱게 간 다음 밀가루 조금 섞어서 되직하게 만들어. 국물은 꼭 짜내고 건더기만!",
      "얼굴 전체는 물론이고 눈 밑에 얇게 올려두면 화끈거림 진정되고 붓기도 빠지는 느낌. 15분 정도만 올렸다가 미온수로 씻어내~ 시험 전날 밤샌 담날 진짜 강추.",
    ],
    points: 10,
    type: "action",
  },
  {
    id: "flour-lemon",
    category: "skincare",
    title: "레몬꿀 밀가루팩 (자극 있는 사람은 패스!)",
    author: "레몬사탕",
    date: "2007.05.09",
    views: 6520,
    baseStamps: 154,
    tags: ["#레몬팩", "#미백", "#민감성패스"],
    body: [
      "밀가루 1스푼 + 레몬즙 1스푼 + 꿀 1스푼 섞어서 얼굴에 얇게 발라주고 10분만! 레몬은 자극이 좀 있어서 오래 두면 따가울 수 있음ㅜ",
      "미백엔 진짜 좋은데 상처 있거나 피부 예민한 애들은 절대 하지 말기. 팔 안쪽에 먼저 테스트해보고 하는 거 추천!",
    ],
    caution: "레몬즙은 산성이 강해 피부 장벽을 자극할 수 있어요. 얼굴보다 손 안쪽 등 넓지 않은 부위에서 먼저 테스트하고, 트러블이 있으면 바로 씻어내세요.",
    points: 10,
    type: "action",
  },
  {
    id: "flour-yogurt",
    category: "skincare",
    title: "피부타입별 밀가루팩 조합 공식 (지성/건성/민감성)",
    author: "미즈넷살던애",
    date: "2005.09.14",
    views: 24011,
    baseStamps: 601,
    tags: ["#피부타입", "#기본팩공식", "#저장각"],
    body: [
      "기본 공식: 밀가루로 농도 맞추고 → 건성은 꿀 한 스푼, 지성은 요구르트(무가당 플레인!), 노화 고민 있으면 계란 노른자, 민감성은 그냥 생수로만 개는 게 국룰임.",
      "이거 저장해놓고 그날그날 피부 상태 봐서 조합 바꿔써~ 다들 각자 피부에 맞는 조합 찾으면 댓글로 알려줘!! 완전소중 정보다 진짜.",
    ],
    points: 10,
    type: "action",
  },

  // ── 다이어트 ────────────────────────────────────────────────────────────
  {
    id: "diet-watermelon-sugar",
    category: "diet",
    title: "여름 국룰★ 수박당 다이어트 — 물살 쫙 빼는 법",
    author: "하늘하늘želim",
    date: "2006.08.03",
    views: 33290,
    baseStamps: 940,
    tags: ["#수박다이어트", "#여름필수", "#물빠짐"],
    body: [
      "더울 땐 밥 대신 수박! 수박은 92%가 수분이라서 배는 부른데 100g에 30kcal밖에 안 함ㄷㄷ 한 끼를 시원한 수박 한 접시로 바꾸면 확실히 붓기 빠지는 느낌 남.",
      "포인트는 '수박만' 며칠씩 먹는 게 아니라 한 끼 대체용으로만 쓰는 거! 그래야 어지럽지도 않고 오래감. 수박씨 뱉으면서 친구랑 수다 떠는 게 다이어트 스트레스 푸는 법이기도 함ㅋㅋ",
    ],
    caution: "수박만 먹는 방식으로 며칠씩 이어가면 지방이 아니라 근육과 체수분이 빠지는 것이라 요요가 오기 쉬워요. 실제로는 한 끼 정도만 대체하고, 단백질·채소를 함께 챙기는 게 안전합니다.",
    points: 15,
    type: "action",
  },
  {
    id: "diet-denmark",
    category: "diet",
    title: "덴마크 다이어트 식단표 (다이어트 카페 인기글)",
    author: "다욧중독",
    date: "2005.03.21",
    views: 41022,
    baseStamps: 1203,
    tags: ["#덴마크다이어트", "#카페인기글", "#2주완성"],
    body: [
      "그 유명한 덴마크 다이어트! 아침엔 계란, 점심엔 계란+토스트, 저녁엔 샐러드+커피... 하루 계란 여러 개에 토스트 2장, 커피 2잔이 기본 틀임.",
      "2주 동안 짜여진 식단표대로만 먹는 거라 카페에 인증글 진짜 많이 올라왔었음. 근데 이거 하고 나서 다시 원래대로 먹으면 훅 찐다는 후기도 많으니까 참고!",
    ],
    caution: "덴마크 다이어트는 단백질·지방 위주로 극단적으로 열량을 제한하는 방식이라 영양 불균형과 요요가 흔했던 유행 다이어트예요. 전문가와 상담 없이 장기간 따라 하는 건 권장하지 않아요.",
    points: 15,
    type: "action",
  },
  {
    id: "diet-onefood",
    category: "diet",
    title: "원푸드 다이어트 총정리 (사과·바나나·고구마)",
    author: "말라깽이될래",
    date: "2007.01.10",
    views: 28710,
    baseStamps: 733,
    tags: ["#원푸드", "#사과다이어트", "#바나나다이어트"],
    body: [
      "그 시절 진짜 유행했던 원푸드 다이어트 삼대장 — 사과, 바나나, 고구마. 한 가지만 정해서 삼시세끼 대신 먹는 거였는데 다들 한 번쯤은 시도해봤을걸ㅋㅋ",
      "체중이 빠지는 건 사실인데, 사실 그 음식 자체의 효과라기보단 전체적으로 먹는 양이 확 줄어서 그런 거였다는 얘기가 나중에 많이 나왔음. 그래도 그때는 다들 냉장고에 바나나 한가득 쌓아뒀었지ㅠㅠ",
    ],
    caution: "한 가지 음식만 반복 섭취하는 원푸드 다이어트는 영양이 한쪽으로 치우치기 쉬워요. 짧게, 보조적으로만 활용하고 평소 식사를 아예 대체하지는 마세요.",
    points: 12,
    type: "action",
  },
  {
    id: "diet-toothpaste-trivia",
    category: "diet",
    title: "레알 실화? '다이어트 치약'까지 나왔던 시절",
    author: "정보수집가",
    date: "2008.10.02",
    views: 15044,
    baseStamps: 402,
    tags: ["#레전드", "#다이어트치약", "#그시절유행"],
    body: [
      "믿기 힘들겠지만 2000년대 후반엔 진짜로 '다이어트 치약'이라는 게 팔렸었음. 나린진이라는 성분 넣어서 양치만 해도 살 빠진다는 컨셉이었는데, 그만큼 다이어트에 진심이었던 시절이었다는 증거ㅋㅋㅋ",
      "요즘 애들한텐 레전드 소리 들을 것 같은데 그때는 마트 진열대에 당당히 있었다는 거... 추억 돋는다 진짜.",
    ],
    points: 5,
    type: "read",
  },

  // ── 헤어관리 ────────────────────────────────────────────────────────────
  {
    id: "hair-egg-beer",
    category: "hair",
    title: "계란+맥주 트리트먼트 — 미용실 안 부럽다",
    author: "찰랑머릿결",
    date: "2006.06.11",
    views: 19532,
    baseStamps: 487,
    tags: ["#천연트리트먼트", "#계란맥주", "#찰랑머리"],
    body: [
      "계란 노른자 1개 + 맥주 반 컵 섞어서 샴푸한 머리에 골고루 발라줘. 냄새는 좀 그런데 효과는 진짜임ㅋㅋ 랩이나 비닐캡 씌우고 10~15분 기다리기.",
      "미지근한 물로 완전히 헹궈내면 머릿결이 확실히 부드러워지고 윤기 남. 계란은 단백질, 맥주는 효모 성분이 모발에 좋다고 해서 그 시절 엄마들도 많이 알려주던 팁!",
    ],
    points: 12,
    type: "action",
  },
  {
    id: "hair-brush-100",
    category: "hair",
    title: "머리 100번 빗기 신화, 진짜일까?",
    author: "생머리소원",
    date: "2007.04.20",
    views: 12980,
    baseStamps: 302,
    tags: ["#도시전설", "#빗질100번", "#팩트체크"],
    body: [
      "자기 전에 머리를 100번씩 빗으면 윤기가 흐른다는 얘기, 다들 한 번쯤 들어봤지? 그때는 진짜라고 믿고 열심히 빗었었는데ㅋㅋ",
      "지금 생각해보면 너무 세게, 너무 많이 빗으면 오히려 모발 큐티클이 상할 수 있다고 하더라ㅜㅜ 빗질은 적당히, 엉킨 부분은 살살! 그래도 그 시절 감성으로 가끔 해보는 것도 낭만이지 뭐.",
    ],
    points: 8,
    type: "action",
  },
  {
    id: "hair-side-part",
    category: "hair",
    title: "얼짱각도 옆가르마 세팅법 (feat. 디카)",
    author: "각도의여왕",
    date: "2006.09.30",
    views: 26411,
    baseStamps: 655,
    tags: ["#얼짱각도", "#옆가르마", "#디카시절"],
    body: [
      "그때는 다들 디카 들고 45도 위에서 내려찍는 얼짱각도가 국룰이었지! 그 각도에 맞춰서 옆가르마도 얼굴 넓은 쪽 반대로 타야 갸름해 보인다는 게 국물팁이었음.",
      "앞머리 살짝 띄우고 실핀으로 고정한 다음 디카 렌즈 살짝 위로 들고 찍으면... 완전 훈녀 사진 완성ㅋㅋ 싸이월드 대문 사진 이걸로 다 찍었었다.",
    ],
    points: 10,
    type: "action",
  },

  // ── 발관리 ──────────────────────────────────────────────────────────────
  {
    id: "foot-bakingsoda",
    category: "foot",
    title: "베이킹소다 발각질 팩 — 샌들 신기 전 필수",
    author: "매끈발되기",
    date: "2007.06.25",
    views: 14203,
    baseStamps: 356,
    tags: ["#발각질", "#베이킹소다", "#샌들시즌"],
    body: [
      "따뜻한 물에 베이킹소다 풀어서 발 10분 정도 담가주고, 베이킹소다랑 물을 1:1로 되직하게 개서 뒤꿈치에 발라줘. 10분 있다가 부드러운 수건으로 살살 문질러 씻으면 각질이 훨씬 잘 밀림!",
      "샌들 신는 여름 되기 전에 미리미리 관리해야 훈녀 발 완성되는 거 다들 알지? 매일 하면 자극될 수 있으니까 일주일에 1번 정도만!",
    ],
    points: 10,
    type: "action",
  },
  {
    id: "foot-vinegar-soak",
    category: "foot",
    title: "식초 족욕 — 냄새 잡고 각질도 부드럽게",
    author: "발냄새탈출",
    date: "2008.07.14",
    views: 10876,
    baseStamps: 241,
    tags: ["#식초족욕", "#냄새케어", "#각질연화"],
    body: [
      "따뜻한 물이랑 식초를 4:1 비율로 섞어서 발을 10~15분 정도 담가줘. 각질이 확실히 물러지고 은근 냄새 케어에도 도움 됨.",
      "족욕 끝나고 나서 각질 밀어내고 로션이나 바세린으로 마무리하면 완벽! 발 시린 겨울보다 여름에 하기 딱 좋은 루틴.",
    ],
    points: 10,
    type: "action",
  },
  {
    id: "foot-sleep-socks",
    category: "foot",
    title: "자기 전 바세린+수면양말 — 아침엔 아기발",
    author: "뽀송발지킴이",
    date: "2006.12.05",
    views: 17652,
    baseStamps: 419,
    tags: ["#수면양말", "#바세린", "#자기전루틴"],
    body: [
      "씻고 나서 발 전체, 특히 뒤꿈치에 바세린 두툼하게 바르고 수면양말 신고 자면 다음 날 아침 발이 완전 촉촉해져 있음. 매일 밤 이것만 지켜도 겨울에 발 갈라지는 일이 확 줄어듦!",
    ],
    points: 8,
    type: "action",
  },

  // ── 완소템 ──────────────────────────────────────────────────────────────
  {
    id: "wannso-list-1",
    category: "wannso",
    title: "완소템 TOP 10 — 이거 없으면 등교 못 함",
    author: "쇼핑중독소녀",
    date: "2007.03.15",
    views: 45201,
    baseStamps: 1502,
    tags: ["#완소템", "#등교필수템", "#추억리스트"],
    body: [
      "1. MP3P 목에 걸고 다니기 2. 폴더폰 큐빅 스티커 3. 삐삐머리끈 색깔별 소장 4. 리락쿠마·마이멜로디 다이어리 5. 매직스트레이트 파마",
      "6. 페이크 속눈썹 (풀 냄새 나던 그거ㅋㅋ) 7. 틴트 대신 바세린+립스틱 섞어 만든 립글로즈 8. 스키니진 & 레그워머 조합 9. 손등에 하트 스티커 10. 미니홈피 배경음악 고르는 데 30분 쓰기",
      "이 중에 몇 개나 해당돼? 나는 10개 다 완소였음... 댓글로 너네 완소템도 알려줘!!",
    ],
    points: 6,
    type: "read",
  },
  {
    id: "wannso-list-2",
    category: "wannso",
    title: "우리반 훈녀들이 쓰던 필통 속 완소 아이템",
    author: "필통대백과",
    date: "2006.05.02",
    views: 20103,
    baseStamps: 588,
    tags: ["#필통템", "#완소", "#그시절학용품"],
    body: [
      "제트스트림 볼펜, 향기나는 지우개, 큐빅 박은 샤프, 캐릭터 포스트잇, 손거울 달린 파우치까지! 훈녀는 필통도 남달랐던 그 시절 완소템 모음.",
    ],
    points: 6,
    type: "read",
  },

  // ── 미즈넷 다이어리 (그 시절 트리비아) ──────────────────────────────────
  {
    id: "miznet-history",
    category: "miznet",
    title: "다음 미즈넷, 기억나? — 여자들의 첫 온라인 사랑방",
    author: "그시절인터넷",
    date: "2005.11.11",
    views: 30442,
    baseStamps: 812,
    tags: ["#미즈넷", "#다음카페", "#그시절인터넷"],
    body: [
      "미즈넷은 1999년 7월, 다음이 브랜드를 새로 정비하면서 함께 열었던 대표 여성 커뮤니티야. 2001년엔 '여자와닷컴'이랑 손잡고 확대 개편하면서 세대별·계층별 콘텐츠를 갖춘 곳으로 커졌음.",
      "연애·이별·고부갈등 고민을 나누던 '미즈토크', 임신·출산 정보 '미즈맘', 연애·다이어트·인테리어 정보 '미즈매거진', 전문가 상담 '닥터스'까지 — 그 시절 여자들의 온라인 사랑방이자 정보창고였지.",
      "지금 보면 투박한 UI였지만, 얼굴도 모르는 언니들끼리 밀가루팩 레시피 나누고 다이어트 응원해주던 그 커뮤니티 감성이 지금의 훈녀생정 감성의 원조 아닐까.",
    ],
    points: 5,
    type: "read",
  },
  {
    id: "miznet-wannso-origin",
    category: "miznet",
    title: "'완소'는 어디서 왔을까? — 완전소중의 비밀",
    author: "신조어연구소",
    date: "2006.02.18",
    views: 22781,
    baseStamps: 699,
    tags: ["#완소유래", "#완전소중", "#신조어역사"],
    body: [
      "완소 = '완전 소중'의 줄임말! 2000년대 초반 프로게이머 나도현 팬들이 '완전소중도현'이라는 응원 문구를 쓰면서 퍼지기 시작했다는 설이 유력해.",
      "이후 드라마 팬카페, 시청자 게시판에서 좋아하는 배우·캐릭터한테 애정을 표현할 때 쓰다가, 훈녀생정 시절엔 '완소템', '완소정보'처럼 소중한 물건이나 정보를 가리키는 말로 완전히 자리잡았지.",
    ],
    points: 5,
    type: "read",
  },
  {
    id: "miznet-hunnyeo-meaning",
    category: "miznet",
    title: "'훈녀생정'이 정확히 뭔 뜻이야?",
    author: "정의내리기",
    date: "2007.09.09",
    views: 38900,
    baseStamps: 1044,
    tags: ["#훈녀생정뜻", "#용어정리", "#그시절블로그"],
    body: [
      "훈녀생정 = '훈훈한 여자 생활정보'의 줄임말이야. 2000년대 중반, 초·중딩이던 여자애들이 블로그·카페에 올리던 미용·다이어트·연애 꿀팁 모음집을 부르던 말!",
      "'얼짱은 못 돼도 관리하면 훈녀는 될 수 있다'는 게 이 장르의 핵심 정신이었지. 그래서 화장품보다는 밀가루·꿀·계란처럼 집에 있는 재료로 하는 셀프 관리법이 유독 많았던 거고.",
      "이 앱은 바로 그 시절, 그 감성을 90년대생 어른이 된 지금 다시 꺼내보자는 마음으로 만들어졌어. 옛날 말투 그대로 살려뒀으니까 추억 돋으면서 봐줘!",
    ],
    points: 5,
    type: "read",
  },
];

export const TOTAL_POSSIBLE_POINTS = TIPS.reduce((sum, t) => sum + t.points, 0);

// ── 훈녀력 레벨 시스템 ────────────────────────────────────────────────────
export interface HunnyeoLevel {
  name: string;
  emoji: string;
  min: number;
}

export const LEVELS: HunnyeoLevel[] = [
  { name: "새내기 훈녀",        emoji: "🌱", min: 0 },
  { name: "완소 훈녀",          emoji: "🎀", min: 20 },
  { name: "인싸 훈녀",          emoji: "💅", min: 50 },
  { name: "얼짱각도 마스터",     emoji: "📸", min: 90 },
  { name: "전설의 미즈넷 언니",  emoji: "👑", min: 140 },
];

export interface LevelInfo {
  index: number;
  level: HunnyeoLevel;
  next: HunnyeoLevel | null;
  progress: number; // 0~1, 다음 레벨까지 진행률 (마지막 레벨이면 1)
  pointsToNext: number; // 다음 레벨까지 남은 포인트 (마지막 레벨이면 0)
}

export function getLevelInfo(points: number): LevelInfo {
  let index = 0;
  for (let i = 0; i < LEVELS.length; i++) {
    if (points >= LEVELS[i].min) index = i;
  }
  const level = LEVELS[index];
  const next = LEVELS[index + 1] ?? null;
  if (!next) return { index, level, next: null, progress: 1, pointsToNext: 0 };
  const span = next.min - level.min;
  const progress = Math.min(1, Math.max(0, (points - level.min) / span));
  return { index, level, next, progress, pointsToNext: Math.max(0, next.min - points) };
}

// ── 방명록 초기 시드 (그 시절 감성 댓글) ─────────────────────────────────────
export interface GuestbookEntry {
  id: string;
  name: string;
  message: string;
  date: string;
}

export const GUESTBOOK_SEED: GuestbookEntry[] = [
  { id: "gb1", name: "달빛소녀", message: "미친 완전 추억돋아서 눈물난다 진짜ㅠㅠㅠ 밀가루팩 진짜 했었는데", date: "2026.09.01" },
  { id: "gb2", name: "삐삐머리소녀", message: "수박당 다이어트 여름마다 했던 거 기억난닼ㅋㅋㅋㅋ 완소 사이트다", date: "2026.09.02" },
  { id: "gb3", name: "얼짱각도장인", message: "옆가르마 얼짱각도 짤 보고 빵터짐... 그때 디카 사진 다 찾아보고 싶다", date: "2026.09.03" },
  { id: "gb4", name: "완소완소", message: "미즈넷 얘기 나오니까 갑자기 그때 친구들 생각남 다들 잘 살고 있겠지", date: "2026.09.04" },
];

// ── 로컬 저장 키 ────────────────────────────────────────────────────────
export const CHECKED_STORAGE_KEY = "hunnyeo_checked_v2";
export const GUESTBOOK_STORAGE_KEY = "hunnyeo_guestbook_v1";
export const VISITED_STORAGE_KEY = "hunnyeo_visited_v1";
export const NICKNAME_STORAGE_KEY = "hunnyeo_nickname_v1";
