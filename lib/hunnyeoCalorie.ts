// ── 행동별 칼로리 소모표 ──────────────────────────────────────────────────
// 그 시절 잡지와 카페에 꼭 하나씩 있던 "이것만 해도 몇 칼로리!" 표.
//
// 값은 지어내지 않고 MET(대사당량)에서 계산한다.
//   소모 열량(kcal) = MET × 체중(kg) × 시간(h)
// MET 는 미국 Compendium of Physical Activities 의 값을 따랐다.
// 실제 소모량은 나이·근육량·숙련도에 따라 ±15% 정도 차이가 난다.

export interface CalorieActivity {
  name: string;
  met: number;
}

export interface CalorieGroup {
  key: string;
  label: string;
  accent: string;
  items: CalorieActivity[];
}

export const CALORIE_GROUPS: CalorieGroup[] = [
  {
    key: "rest",
    label: "가만히 있어도",
    accent: "#93c5fd",
    items: [
      { name: "자기", met: 0.95 },
      { name: "텔레비전 보기", met: 1.0 },
      { name: "껌 씹기", met: 1.2 },
      { name: "웃기", met: 1.2 },
      { name: "가만히 서 있기", met: 1.3 },
      { name: "버스·지하철 앉아서 가기", met: 1.3 },
      { name: "책 읽기", met: 1.3 },
      { name: "글쓰기", met: 1.3 },
      { name: "컴퓨터 하기", met: 1.3 },
      { name: "휴대폰 보기", met: 1.5 },
      { name: "앉아서 통화하기", met: 1.5 },
      { name: "앉아서 수다 떨기", met: 1.5 },
      { name: "밥 먹기", met: 1.5 },
      { name: "사무실에서 앉아 일하기", met: 1.5 },
      { name: "앉아서 공부하기", met: 1.8 },
    ],
  },
  {
    key: "daily",
    label: "하루를 보내며",
    accent: "#ff9a6c",
    items: [
      { name: "노래 부르기", met: 2.0 },
      { name: "서서 지하철 타고 가기", met: 2.0 },
      { name: "아이 안고 서 있기", met: 2.0 },
      { name: "장보기 (카트 밀며)", met: 2.3 },
      { name: "머리 감고 말리기", met: 2.5 },
      { name: "화장하기", met: 2.5 },
      { name: "운전하기", met: 2.5 },
      { name: "천천히 걷기 (3km/h)", met: 2.5 },
      { name: "보통 걸음 (4km/h)", met: 3.0 },
      { name: "강아지 산책", met: 3.0 },
      { name: "장바구니 들고 걷기", met: 3.5 },
      { name: "계단 내려가기", met: 3.5 },
      { name: "빠르게 걷기 (6km/h)", met: 5.0 },
      { name: "노래방에서 춤추며 노래", met: 5.0 },
      { name: "계단 오르기", met: 8.0 },
    ],
  },
  {
    key: "house",
    label: "집안일도 운동",
    accent: "#c084fc",
    items: [
      { name: "빨래 개기", met: 2.0 },
      { name: "다림질", met: 2.3 },
      { name: "상 차리고 치우기", met: 2.5 },
      { name: "요리하기", met: 2.5 },
      { name: "설거지", met: 2.5 },
      { name: "방 정리·물건 치우기", met: 3.0 },
      { name: "창문 닦기", met: 3.2 },
      { name: "청소기 돌리기", met: 3.3 },
      { name: "침구 정리하기", met: 3.3 },
      { name: "손빨래", met: 3.3 },
      { name: "걸레질·바닥 닦기", met: 3.5 },
      { name: "화장실 청소", met: 3.5 },
    ],
  },
  {
    key: "exercise",
    label: "작정하고 운동",
    accent: "#16a34a",
    items: [
      { name: "스트레칭", met: 2.3 },
      { name: "요가", met: 2.5 },
      { name: "필라테스", met: 3.0 },
      { name: "훌라후프", met: 4.0 },
      { name: "춤추기", met: 5.0 },
      { name: "등산", met: 5.3 },
      { name: "배드민턴", met: 5.5 },
      { name: "수영 (자유형)", met: 5.8 },
      { name: "에어로빅", met: 6.5 },
      { name: "자전거 타기", met: 6.8 },
      { name: "달리기 (8km/h)", met: 8.3 },
      { name: "줄넘기", met: 11.0 },
    ],
  },
];

/** MET × 체중 × 시간. 10 단위로 다듬어 표에 쓰기 좋게 만든다. */
export function burnedKcal(met: number, weightKg: number, hours: number): number {
  const raw = met * weightKg * hours;
  if (raw < 100) return Math.round(raw);
  return Math.round(raw / 5) * 5;
}

/** 그 시절 표에 흔히 붙어 있던 비교 기준 */
export const FOOD_COMPARE: { name: string; kcal: number }[] = [
  { name: "라면 한 봉지", kcal: 500 },
  { name: "떡볶이 1인분", kcal: 450 },
  { name: "공기밥 한 공기", kcal: 300 },
  { name: "초코바 하나", kcal: 230 },
  { name: "삼각김밥", kcal: 190 },
  { name: "초코파이 하나", kcal: 170 },
  { name: "우유 한 팩", kcal: 130 },
  { name: "콜라 한 캔", kcal: 100 },
  { name: "사과 한 개", kcal: 95 },
];
