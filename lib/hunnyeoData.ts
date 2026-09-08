// ── 훈녀생정 데이터베이스 ─────────────────────────────────────────────────────
// "훈녀생정"은 2000년대 중반, 아직 초·중딩이었던 90년대생들이 블로그·카페에
// 올리고 퍼 나르던 "훈훈한 여자 생활정보"의 줄임말이다.
// 화장품 살 돈은 없어도 밀가루·꿀·계란은 집에 있었던 그 시절, 얼짱은 못 돼도
// "훈녀"는 될 수 있다는 믿음으로 만들어졌던 생활 팁들을 정리했다.
//
// 문체 원칙: 그 시절 인터넷 말투(후기·반말)를 걷어내고, 준비물 → 방법 → 효과
// 순서로 담백하게 정리한다. 예) "뽀얀 피부를 얻을 수 있어요."
//
// ⚠️ 다이어트 항목은 그 시절 유행했던 방식을 소개하는 추억 콘텐츠입니다.
// 현재 기준으로는 영양 불균형·요요 위험이 있으니 무리한 원푸드 다이어트는
// 피하고, 균형 잡힌 식사를 기본으로 하세요.

export type HunnyeoCategoryKey =
  | "all" | "facepack" | "diet" | "hair" | "foot" | "nail" | "item" | "words";

export const CATEGORIES: { key: HunnyeoCategoryKey; label: string; emoji: string; accent: string; desc: string }[] = [
  { key: "all",      label: "전체보기",   emoji: "🎀", accent: "#ff3d9a", desc: "훈녀생정 전체 목록" },
  { key: "facepack", label: "얼굴팩",     emoji: "🍎", accent: "#ff6fb5", desc: "밀가루·과일로 만드는 팩" },
  { key: "diet",     label: "다이어트",   emoji: "🍉", accent: "#39b96a", desc: "그 시절 유행한 다이어트" },
  { key: "hair",     label: "머릿결",     emoji: "🎀", accent: "#9b6bf5", desc: "찰랑거리는 머릿결 만들기" },
  { key: "foot",     label: "발관리",     emoji: "🩰", accent: "#2ba7e0", desc: "매끈한 발뒤꿈치 만들기" },
  { key: "nail",     label: "손톱·봉숭아", emoji: "💅", accent: "#f2622e", desc: "봉숭아물과 손톱 관리" },
  { key: "item",     label: "완소템",     emoji: "💗", accent: "#e0399b", desc: "그 시절 필수 아이템" },
  { key: "words",    label: "추억사전",   emoji: "📖", accent: "#e0a800", desc: "그 시절 말과 유행 이야기" },
];

export type TipType = "action" | "read";

export interface HunnyeoTip {
  id: string;
  category: Exclude<HunnyeoCategoryKey, "all">;
  title: string;
  materials?: string[]; // 준비물
  steps: string[]; // 하는 방법 (순서대로)
  effect: string; // 이렇게 하면 얻는 것
  caution?: string; // 현재 기준 안전 안내
  tags: string[];
  points: number; // 체크 완료 시 얻는 훈녀력 포인트
  type: TipType; // action = 직접 해보는 것, read = 읽고 아는 것
}

export const TIPS: HunnyeoTip[] = [
  // ── 얼굴팩 ──────────────────────────────────────────────────────────────
  {
    id: "pack-apple",
    category: "facepack",
    title: "사과꿀 밀가루팩",
    materials: ["사과 1/4개", "꿀 1티스푼", "밀가루 2스푼"],
    steps: [
      "사과를 강판에 곱게 갈아주세요.",
      "간 사과에 꿀과 밀가루를 넣고, 흘러내리지 않을 정도로 되직하게 섞어주세요.",
      "세안 후 물기를 닦고 눈과 입 주위를 피해 얼굴에 발라주세요.",
      "20~30분 후 미지근한 물로 씻어내고, 마지막에 찬물로 한 번 더 헹궈주세요.",
    ],
    effect: "묵은 각질이 정리되어 뽀얀 피부를 얻을 수 있어요.",
    tags: ["미백", "각질정리", "일주일 2회"],
    points: 12,
    type: "action",
  },
  {
    id: "pack-orange",
    category: "facepack",
    title: "오렌지 밀가루팩",
    materials: ["오렌지 1/2개", "밀가루 2스푼", "꿀 약간"],
    steps: [
      "오렌지를 짜서 즙만 준비해주세요.",
      "오렌지즙에 밀가루와 꿀을 넣고 되직하게 섞어주세요.",
      "얼굴에 얇게 펴 바르고 20분 정도 두세요.",
      "미지근한 물로 깨끗이 씻어내세요.",
    ],
    effect: "칙칙했던 얼굴빛이 화사해져요.",
    caution: "감귤류 즙을 바른 뒤 자외선을 받으면 색소침착이 생길 수 있어요. 저녁에 하고, 다음 날은 자외선 차단제를 꼭 발라주세요.",
    tags: ["비타민C", "화사한 톤", "저녁에"],
    points: 12,
    type: "action",
  },
  {
    id: "pack-potato",
    category: "facepack",
    title: "감자팩",
    materials: ["감자 1개", "밀가루 1스푼"],
    steps: [
      "감자 껍질을 벗기고 강판에 곱게 갈아주세요.",
      "물기를 꼭 짜낸 뒤 밀가루를 섞어 되직하게 만들어주세요.",
      "얼굴과 눈 밑에 얇게 올려주세요.",
      "15분 후 미지근한 물로 씻어내세요.",
    ],
    effect: "화끈거림이 가라앉고 부기가 빠져 편안한 피부가 돼요.",
    tags: ["진정", "부기완화", "눈밑관리"],
    points: 10,
    type: "action",
  },
  {
    id: "pack-egg-white",
    category: "facepack",
    title: "계란 흰자팩",
    materials: ["계란 흰자 1개분", "밀가루 1스푼"],
    steps: [
      "계란 흰자를 거품이 살짝 날 때까지 저어주세요.",
      "밀가루를 넣어 농도를 맞춰주세요.",
      "코와 볼 위주로 얇게 발라주세요.",
      "10~15분 후 굳으면 미지근한 물로 씻어내세요.",
    ],
    effect: "피부결이 매끈해지고 모공이 조여진 느낌이 들어요.",
    tags: ["모공관리", "매끈한 피부결"],
    points: 10,
    type: "action",
  },
  {
    id: "pack-cucumber",
    category: "facepack",
    title: "오이팩",
    materials: ["오이 1/2개"],
    steps: [
      "오이를 아주 얇게 썰어주세요.",
      "세안 후 얼굴 전체에 빈틈없이 올려주세요.",
      "15분 정도 누워서 쉬어주세요.",
      "오이를 걷어내고 물로 가볍게 헹궈주세요.",
    ],
    effect: "달아오른 피부가 시원하게 진정돼요.",
    tags: ["수분", "진정", "여름추천"],
    points: 8,
    type: "action",
  },
  {
    id: "pack-type-guide",
    category: "facepack",
    title: "피부 타입별 팩 조합표",
    steps: [
      "농도는 밀가루로 맞추는 것이 기본이에요.",
      "건성 피부는 꿀 한 스푼을 넣어주세요.",
      "지성 피부는 무가당 플레인 요구르트를 넣어주세요.",
      "탄력이 고민이면 계란 노른자를 넣어주세요.",
      "민감성 피부는 다른 재료 없이 생수로만 개어주세요.",
    ],
    effect: "내 피부에 맞는 조합을 찾으면 자극 없이 관리할 수 있어요.",
    tags: ["조합표", "피부타입", "기본공식"],
    points: 10,
    type: "action",
  },

  // ── 다이어트 ────────────────────────────────────────────────────────────
  {
    id: "diet-watermelon",
    category: "diet",
    title: "수박당 다이어트",
    materials: ["수박 한 접시(약 200~300g)"],
    steps: [
      "하루 세 끼 중 한 끼만 수박으로 바꿔주세요.",
      "차게 해서 천천히 씹어 먹으면 포만감이 오래가요.",
      "나머지 끼니는 단백질과 채소를 꼭 챙겨주세요.",
    ],
    effect: "수분이 많고 열량이 낮아(100g당 약 30kcal) 부기가 가라앉는 느낌을 받을 수 있어요.",
    caution: "수박만 며칠씩 먹으면 지방이 아니라 근육과 체수분이 빠져 요요가 오기 쉬워요. 한 끼 대체 정도로만 활용하세요.",
    tags: ["여름", "한끼대체", "저열량"],
    points: 15,
    type: "action",
  },
  {
    id: "diet-denmark",
    category: "diet",
    title: "덴마크 다이어트",
    materials: ["계란", "토스트", "샐러드", "블랙커피", "자몽"],
    steps: [
      "아침은 계란과 블랙커피로 시작해요.",
      "점심은 계란과 토스트를 곁들여요.",
      "저녁은 샐러드와 담백한 단백질을 준비해요.",
      "정해진 식단표를 13~14일 동안 지키는 것이 기본 방식이에요.",
    ],
    effect: "먹는 양이 정해져 있어 단기간에 체중 변화를 확인할 수 있어요.",
    caution: "열량과 영양을 크게 제한하는 방식이라 영양 불균형과 요요가 흔했던 유행 다이어트예요. 장기간 따라 하는 것은 권하지 않아요.",
    tags: ["식단표", "2주", "그시절유행"],
    points: 15,
    type: "action",
  },
  {
    id: "diet-onefood",
    category: "diet",
    title: "원푸드 다이어트 (사과·바나나·고구마)",
    materials: ["사과 또는 바나나 또는 고구마"],
    steps: [
      "한 가지 음식을 정해주세요.",
      "정한 음식으로 하루 한두 끼를 대신해요.",
      "물을 충분히 마시고, 기운이 없으면 바로 중단해요.",
    ],
    effect: "전체 식사량이 줄어들어 체중이 가볍게 내려가요.",
    caution: "한 가지 음식만 반복하면 영양이 한쪽으로 치우쳐요. 짧게, 보조적으로만 활용하세요.",
    tags: ["사과", "바나나", "고구마"],
    points: 12,
    type: "action",
  },
  {
    id: "diet-hoop",
    category: "diet",
    title: "훌라후프 돌리기",
    materials: ["훌라후프"],
    steps: [
      "허리를 곧게 세우고 다리를 어깨너비로 벌려주세요.",
      "허리보다 골반을 앞뒤로 밀어내듯 돌려주세요.",
      "10분씩 하루 2~3번 나눠서 돌려주세요.",
    ],
    effect: "허리 주변이 따뜻해지고 꾸준히 하면 자세가 반듯해져요.",
    caution: "너무 무거운 훌라후프를 오래 돌리면 멍이 들거나 허리에 무리가 갈 수 있어요.",
    tags: ["집운동", "10분", "허리"],
    points: 10,
    type: "action",
  },
  {
    id: "diet-after-six",
    category: "diet",
    title: "저녁 6시 이후 안 먹기",
    steps: [
      "저녁 식사를 6시 전에 마쳐주세요.",
      "이후에는 물이나 따뜻한 차만 마셔주세요.",
      "출출하면 일찍 잠자리에 드는 것이 좋아요.",
    ],
    effect: "자기 전 군것질이 줄어 아침에 속이 편안해져요.",
    caution: "생활 리듬에 따라 저녁을 너무 이르게 굶으면 야식 폭식으로 이어질 수 있어요. 무리하지 마세요.",
    tags: ["생활습관", "야식금지"],
    points: 8,
    type: "action",
  },

  // ── 머릿결 ──────────────────────────────────────────────────────────────
  {
    id: "hair-egg-beer",
    category: "hair",
    title: "계란 맥주 트리트먼트",
    materials: ["계란 노른자 1개", "맥주 반 컵", "비닐캡"],
    steps: [
      "계란 노른자와 맥주를 잘 섞어주세요.",
      "샴푸 후 물기를 짠 머리카락에 골고루 발라주세요.",
      "비닐캡을 쓰고 10~15분 기다려주세요.",
      "미지근한 물로 냄새가 남지 않게 충분히 헹궈주세요.",
    ],
    effect: "머릿결이 부드러워지고 윤기가 돌아요.",
    tags: ["천연트리트먼트", "윤기", "주 1회"],
    points: 12,
    type: "action",
  },
  {
    id: "hair-vinegar-rinse",
    category: "hair",
    title: "식초 헹굼",
    materials: ["식초 1스푼", "미지근한 물 1대야"],
    steps: [
      "물 한 대야에 식초 한 스푼을 풀어주세요.",
      "샴푸를 마친 뒤 이 물로 머리를 헹궈주세요.",
      "마지막에 맑은 물로 한 번 더 헹궈주세요.",
    ],
    effect: "머리카락이 매끄러워지고 두피가 산뜻해져요.",
    tags: ["두피", "매끄러움", "저렴한관리"],
    points: 8,
    type: "action",
  },
  {
    id: "hair-brush",
    category: "hair",
    title: "자기 전 빗질하기",
    materials: ["나무 빗 또는 부드러운 빗"],
    steps: [
      "머리 끝부터 살살 빗어 엉킴을 먼저 풀어주세요.",
      "그다음 두피부터 끝까지 천천히 빗어 내려주세요.",
      "세게 잡아당기지 말고 가볍게 30번 정도만 빗어주세요.",
    ],
    effect: "두피가 시원해지고 머리카락이 차분하게 정리돼요.",
    caution: "예전에는 100번씩 빗는 것이 좋다고 알려졌지만, 지나친 빗질은 오히려 모발이 상할 수 있어요.",
    tags: ["자기전루틴", "두피자극"],
    points: 8,
    type: "action",
  },
  {
    id: "hair-side-part",
    category: "hair",
    title: "옆가르마 만들기",
    materials: ["실핀", "빗"],
    steps: [
      "얼굴이 넓어 보이는 쪽의 반대편으로 가르마를 타주세요.",
      "앞머리는 살짝 띄워 볼륨을 만들어주세요.",
      "귀 뒤쪽에서 실핀으로 고정해주세요.",
    ],
    effect: "얼굴선이 갸름해 보이고 인상이 부드러워져요.",
    tags: ["옆가르마", "얼굴선", "실핀"],
    points: 10,
    type: "action",
  },

  // ── 발관리 ──────────────────────────────────────────────────────────────
  {
    id: "foot-bakingsoda",
    category: "foot",
    title: "베이킹소다 발각질 팩",
    materials: ["베이킹소다", "따뜻한 물", "부드러운 수건"],
    steps: [
      "따뜻한 물에 베이킹소다를 풀고 발을 10분간 담가주세요.",
      "베이킹소다와 물을 1:1로 개어 뒤꿈치에 발라주세요.",
      "10분 후 수건으로 살살 문질러 씻어내세요.",
      "마무리로 보습 크림을 발라주세요.",
    ],
    effect: "묵은 각질이 정리되어 매끈한 발이 돼요.",
    caution: "매일 하면 자극이 될 수 있어요. 일주일에 한 번이면 충분해요.",
    tags: ["각질제거", "주1회", "샌들시즌"],
    points: 10,
    type: "action",
  },
  {
    id: "foot-vinegar",
    category: "foot",
    title: "식초 족욕",
    materials: ["따뜻한 물 4", "식초 1"],
    steps: [
      "따뜻한 물과 식초를 4:1로 섞어주세요.",
      "발을 10~15분간 담가주세요.",
      "물기를 닦고 보습제를 발라 마무리해주세요.",
    ],
    effect: "각질이 부드러워지고 발 냄새가 줄어들어요.",
    tags: ["족욕", "냄새케어", "각질연화"],
    points: 10,
    type: "action",
  },
  {
    id: "foot-socks",
    category: "foot",
    title: "바세린 바르고 수면양말 신기",
    materials: ["바세린", "수면양말"],
    steps: [
      "씻은 뒤 발을 깨끗이 말려주세요.",
      "뒤꿈치 위주로 바세린을 도톰하게 발라주세요.",
      "수면양말을 신고 그대로 주무세요.",
    ],
    effect: "아침에 촉촉하고 부드러운 발로 일어날 수 있어요.",
    tags: ["자기전루틴", "보습", "겨울필수"],
    points: 8,
    type: "action",
  },

  // ── 손톱·봉숭아 ─────────────────────────────────────────────────────────
  {
    id: "nail-balsam",
    category: "nail",
    title: "봉숭아물 들이기",
    materials: ["봉숭아 꽃잎과 잎", "백반 조금", "비닐 랩", "실"],
    steps: [
      "봉숭아 꽃잎과 잎에 백반을 조금 넣고 곱게 찧어주세요.",
      "손톱 위에 도톰하게 올려주세요.",
      "비닐 랩으로 감싼 뒤 실로 묶어 고정해주세요.",
      "하룻밤 두었다가 아침에 떼어내고 물로 씻어주세요.",
    ],
    effect: "손톱이 고운 주홍빛으로 물들어요. 첫눈이 올 때까지 물이 남아 있으면 첫사랑이 이루어진다는 이야기도 전해져요.",
    caution: "백반은 자극이 될 수 있으니 피부에 닿는 양을 적게 하고, 따가우면 바로 떼어내세요.",
    tags: ["여름밤", "첫사랑", "주홍빛"],
    points: 15,
    type: "action",
  },
  {
    id: "nail-care",
    category: "nail",
    title: "손톱 모양 다듬기",
    materials: ["손톱깎이", "손톱 줄", "핸드크림"],
    steps: [
      "목욕 후 손톱이 부드러워졌을 때 잘라주세요.",
      "일자로 자른 뒤 모서리만 살짝 둥글려주세요.",
      "손톱 줄을 한 방향으로만 밀어 다듬어주세요.",
      "마지막에 손톱 끝까지 핸드크림을 발라주세요.",
    ],
    effect: "손톱이 갈라지지 않고 단정한 모양을 유지할 수 있어요.",
    tags: ["기본관리", "손톱모양"],
    points: 8,
    type: "action",
  },
  {
    id: "nail-lip-balm-shine",
    category: "nail",
    title: "립밤으로 손톱 윤내기",
    materials: ["립밤 또는 바세린", "부드러운 천"],
    steps: [
      "손톱 표면에 립밤을 아주 조금 발라주세요.",
      "천으로 한 방향으로 문질러주세요.",
    ],
    effect: "매니큐어 없이도 손톱에 은은한 윤기가 생겨요.",
    tags: ["간단관리", "윤기", "노매니큐어"],
    points: 6,
    type: "action",
  },

  // ── 완소템 ──────────────────────────────────────────────────────────────
  {
    id: "item-top10",
    category: "item",
    title: "그 시절 완소템 열 가지",
    steps: [
      "목에 거는 MP3 플레이어",
      "폴더폰에 붙이던 큐빅 스티커",
      "색깔별로 모으던 삐삐머리끈",
      "캐릭터 다이어리와 스티커",
      "매직 스트레이트 파마",
      "바세린에 립스틱을 섞어 만든 립글로스",
      "레그워머와 스키니진",
      "향기 나는 지우개",
      "손거울 달린 파우치",
      "미니홈피 배경음악 고르기",
    ],
    effect: "그때 무엇을 아꼈는지 떠올리며 추억을 정리할 수 있어요.",
    tags: ["추억목록", "완소템"],
    points: 6,
    type: "read",
  },
  {
    id: "item-pencilcase",
    category: "item",
    title: "필통 속 필수 아이템",
    steps: [
      "잘 써지는 볼펜 한 자루",
      "큐빅이 박힌 샤프",
      "캐릭터 포스트잇",
      "향기 나는 지우개",
      "작은 손거울",
    ],
    effect: "필통만 열어도 기분이 좋아지던 그 시절 감성을 다시 만날 수 있어요.",
    tags: ["학용품", "필통"],
    points: 6,
    type: "read",
  },

  // ── 추억사전 ────────────────────────────────────────────────────────────
  {
    id: "words-wannso",
    category: "words",
    title: "'완소'는 무슨 뜻일까요",
    steps: [
      "완소는 '완전 소중'을 줄인 말이에요.",
      "2000년대 초반 한 프로게이머의 팬들이 쓰던 응원 문구에서 퍼졌다는 이야기가 전해져요.",
      "이후 좋아하는 사람이나 물건 앞에 붙여 '완소템', '완소 정보'처럼 쓰였어요.",
    ],
    effect: "그 시절 말의 뜻을 알고 나면 옛날 글이 훨씬 정겹게 읽혀요.",
    tags: ["완전소중", "말의유래"],
    points: 5,
    type: "read",
  },
  {
    id: "words-hunnyeo",
    category: "words",
    title: "'훈녀생정'은 무슨 뜻일까요",
    steps: [
      "훈녀생정은 '훈훈한 여자 생활정보'를 줄인 말이에요.",
      "2000년대 중반, 학생들이 블로그와 카페에 올리던 미용·생활 팁 모음을 부르던 이름이에요.",
      "화장품 대신 밀가루·꿀·계란처럼 집에 있는 재료로 하는 방법이 많았던 것이 특징이에요.",
    ],
    effect: "이 앱이 어떤 시절의 기록을 모아둔 것인지 이해할 수 있어요.",
    tags: ["용어정리", "훈훈한여자생활정보"],
    points: 5,
    type: "read",
  },
  {
    id: "words-eoljjang",
    category: "words",
    title: "'얼짱 각도'가 뭐였을까요",
    steps: [
      "디지털카메라를 얼굴보다 살짝 위로 들어 올려요.",
      "약 45도 위에서 아래를 향해 찍어요.",
      "턱을 살짝 당기고 시선만 렌즈를 봐요.",
    ],
    effect: "얼굴이 갸름해 보이는 사진을 얻을 수 있어요. 그 시절 미니홈피 대문 사진은 대부분 이 각도였어요.",
    tags: ["디카", "사진각도", "미니홈피"],
    points: 5,
    type: "read",
  },
];

export const TOTAL_POSSIBLE_POINTS = TIPS.reduce((sum, t) => sum + t.points, 0);

// ── 책 페이지 번호 (표지 1p, 차례 2~3p 뒤부터 본문 시작) ────────────────
export const FIRST_CONTENT_PAGE = 4;

export function pageOfTip(id: string): number {
  const idx = TIPS.findIndex(t => t.id === id);
  return idx < 0 ? FIRST_CONTENT_PAGE : FIRST_CONTENT_PAGE + idx * 2;
}

export function pageOfCategory(key: HunnyeoCategoryKey): number {
  const first = TIPS.find(t => t.category === key);
  return first ? pageOfTip(first.id) : FIRST_CONTENT_PAGE;
}

export function chapterOfCategory(key: HunnyeoCategoryKey): number {
  return CATEGORIES.filter(c => c.key !== "all").findIndex(c => c.key === key) + 1;
}

// ── 훈녀력 레벨 시스템 ────────────────────────────────────────────────────
export interface HunnyeoLevel {
  name: string;
  emoji: string;
  min: number;
}

export const LEVELS: HunnyeoLevel[] = [
  { name: "새내기 훈녀",       emoji: "🌱", min: 0 },
  { name: "완소 훈녀",         emoji: "🎀", min: 30 },
  { name: "인기짱 훈녀",       emoji: "💅", min: 70 },
  { name: "얼짱각도 마스터",    emoji: "📸", min: 120 },
  { name: "전설의 왕언니",      emoji: "👑", min: 180 },
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

// ── 방명록 초기 시드 ────────────────────────────────────────────────────
export interface GuestbookEntry {
  id: string;
  name: string;
  message: string;
  date: string;
}

export const GUESTBOOK_SEED: GuestbookEntry[] = [
  { id: "gb1", name: "달빛소녀", message: "봉숭아물 들이던 여름밤이 생각나요. 첫눈까지 남았었는지는 기억이 안 나네요.", date: "2026.09.01" },
  { id: "gb2", name: "삐삐머리", message: "밀가루팩 하다가 엄마한테 혼났던 기억이 나요. 반가운 목록이에요.", date: "2026.09.02" },
  { id: "gb3", name: "옆가르마", message: "얼짱 각도 설명 보고 옛날 사진첩을 열어봤어요.", date: "2026.09.03" },
  { id: "gb4", name: "완소완소", message: "완소라는 말 진짜 오랜만에 봐요. 그때 친구들 생각이 나네요.", date: "2026.09.04" },
];

// ── 로컬 저장 키 ────────────────────────────────────────────────────────
export const CHECKED_STORAGE_KEY = "hunnyeo_checked_v2";
export const GUESTBOOK_STORAGE_KEY = "hunnyeo_guestbook_v1";
export const VISITED_STORAGE_KEY = "hunnyeo_visited_v1";
export const NICKNAME_STORAGE_KEY = "hunnyeo_nickname_v1";
