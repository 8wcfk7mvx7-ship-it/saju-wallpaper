// lib/domainGrades.ts — "오늘의 운세" 등급 (애정운·금전운·직장운)
// 여름궁전 앱의 "오늘의 운세" 1~9등급 로직(오늘 일진이 내 일간에 어떤 십성으로 작용하는지 +
// 그 십성이 어떤 12운성 단계에 있는지)을 이 앱의 3개 도메인에 맞게 단순화해서 재사용한다.
import { getDayPillar, getSipseong, getUunseong } from "@/lib/saju";

export type Grade = "S" | "A" | "B" | "C" | "D";

export interface DomainGrade {
  grade: Grade;
  label: string; // 등급을 말로 풀어쓴 한 줄
}

export interface DailyGrades {
  love: DomainGrade;
  money: DomainGrade;
  career: DomainGrade;
  personalized: boolean; // false면 생년월일이 없어 모두에게 같은 절기 기반 값
}

type SipseongGroup = "비겁" | "식상" | "재성" | "관성" | "인성";

const SIPSEONG_TO_GROUP: Record<string, SipseongGroup> = {
  비견: "비겁", 겁재: "비겁", 식신: "식상", 상관: "식상",
  정재: "재성", 편재: "재성", 정관: "관성", 편관: "관성", 정인: "인성", 편인: "인성",
};

// 12운성 단계별 기본 점수 (1=가장 좋음 ~ 9=가장 조심)
const UUNSEONG_BASE_SCORE: Record<string, number> = {
  장생: 2, 건록: 1, 제왕: 2, 관대: 3, 양: 4, 목욕: 5, 태: 5, 쇠: 6, 병: 7, 묘: 8, 절: 8, 사: 9,
};

type DomainKey = "money" | "love" | "career";

// 오늘 일진이 어떤 십성 그룹으로 작용하느냐에 따라 도메인별로 받는 가감점.
// (십성 상생 순환 — 비겁→식상→재성→관성→인성→비겁 — 을 참고해 방향을 잡았다.)
const GROUP_DOMAIN_MOD: Record<SipseongGroup, Record<DomainKey, number>> = {
  비겁: { money: -1, love: +1, career: 0 },
  식상: { money: 0, love: +1, career: -1 },
  재성: { money: +2, love: 0, career: +1 },
  관성: { money: -1, love: -1, career: +2 },
  인성: { money: +1, love: +1, career: -1 },
};

const GRADE_LABEL: Record<Grade, string> = {
  S: "최고의 하루",
  A: "술술 풀리는 하루",
  B: "무난한 하루",
  C: "조심스러운 하루",
  D: "신중해야 하는 하루",
};

function scoreToGrade(score: number): DomainGrade {
  const s = Math.max(1, Math.min(9, score));
  const grade: Grade = s <= 1 ? "S" : s <= 3 ? "A" : s <= 5 ? "B" : s <= 7 ? "C" : "D";
  return { grade, label: GRADE_LABEL[grade] };
}

export function getDailyGrades(date: Date, ilgan?: string): DailyGrades {
  const { cg, jj } = getDayPillar(date.getFullYear(), date.getMonth() + 1, date.getDate());

  if (ilgan) {
    const sipseong = getSipseong(ilgan, cg);
    const group = SIPSEONG_TO_GROUP[sipseong];
    if (group) {
      const uunseong = getUunseong(ilgan, jj);
      const base = UUNSEONG_BASE_SCORE[uunseong] ?? 5;
      const mod = GROUP_DOMAIN_MOD[group];
      return {
        money: scoreToGrade(base + mod.money),
        love: scoreToGrade(base + mod.love),
        career: scoreToGrade(base + mod.career),
        personalized: true,
      };
    }
  }

  // 생년월일이 없으면 개인화할 수 없으므로, 오늘 일진 자체의 오행 기운만으로
  // 모두에게 동일한 대략적인 등급을 매긴다 (극단적인 S/D는 피해 B~A 중심으로).
  const seed = (cg.charCodeAt(0) * 31 + jj.charCodeAt(0)) >>> 0;
  const fallback = (offset: number): DomainGrade => scoreToGrade(3 + ((seed + offset) % 5));
  return {
    money: fallback(0),
    love: fallback(3),
    career: fallback(7),
    personalized: false,
  };
}
