"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import BackButton from "@/components/BackButton";
import { analyzeSaju, detectSamhapBanghap } from "@/lib/saju";
import { SIPSEONG_MOVIE } from "@/lib/saju2";
import BirthInputForm, { type BirthFormData, defaultBirthData } from "@/components/BirthInputForm";
import ResultFooterActions from "@/components/ResultFooterActions";

export const dynamic = "force-dynamic";

// ── 오행별 취향 DB ────────────────────────────────────────────────────────────
interface TasteItem { title: string; why: string; genre: string; }
interface ElementTaste {
  color: string;
  emoji: string;
  personality: string;
  movies: TasteItem[];
  books: TasteItem[];
  music: string[];
  travel: string[];
  hobbies: string[];
  notFor: string;
}

const ELEMENT_TASTE: Record<string, ElementTaste> = {
  목: {
    color: "#16a34a",
    emoji: "🌿",
    personality: "성장·도전·직선형",
    movies: [
      { title: "인터스텔라", why: "끝없는 탐구와 성장 본능이 공명함. 한계를 넘으려는 주인공에 깊이 감정이입.", genre: "SF·드라마" },
      { title: "킹스맨", why: "노력으로 신분을 극복하는 성장 서사. 직선적 행동력과 목표 지향성이 맞음.", genre: "액션" },
      { title: "기생충", why: "구조와 계층에 대한 날카로운 통찰. 직선적 관점으로 사회를 읽어냄.", genre: "드라마·스릴러" },
      { title: "보헤미안 랩소디", why: "자기 자신을 증명하려는 끝없는 열망. 리더십의 고독함에 공감.", genre: "전기" },
      { title: "반지의 제왕", why: "거대한 여정과 신념을 향한 직진. 목형의 개척·성장 서사와 완벽히 맞음.", genre: "판타지·모험" },
      { title: "언터처블: 1%의 우정", why: "다른 세계의 두 사람이 부딪히며 성장하는 이야기. 목형의 직선적 인간관계와 공명.", genre: "드라마" },
      { title: "베를린 천사의 시", why: "경계를 넘어서려는 존재의 갈망. 목형의 자유와 성장 본능을 자극.", genre: "드라마" },
      { title: "도그빌", why: "정의와 위선에 대한 날카로운 시선. 목형의 강한 신념·직진성과 맞음.", genre: "드라마" },
      { title: "맨 프롬 어스", why: "끝없는 지적 탐구와 존재에 대한 질문. 목형의 탐구욕을 자극.", genre: "SF·드라마" },
    ],
    books: [
      { title: "아직도 가야 할 길 (M. 스캇 펙)", why: "성장은 고통이라는 진리. 목형의 끝없는 자기계발 욕구와 정확히 맞음.", genre: "자기계발·심리" },
      { title: "미움받을 용기", why: "타인의 시선을 넘어서 자신의 길을 가라는 메시지. 목형의 독립정신과 공명.", genre: "심리·철학" },
      { title: "린 스타트업 (에릭 리스)", why: "실행하고 배우고 성장하라. 목형의 도전 본능과 완벽한 매칭.", genre: "경영·창업" },
      { title: "1984 (조지 오웰)", why: "권력과 개인의 자유에 대한 치열한 탐구. 목형의 정의감이 자극됨.", genre: "소설·고전" },
    ],
    music: ["록/인디", "얼터너티브", "힙합(파이팅 계열)", "영화 OST"],
    travel: ["트레킹·산악", "배낭여행", "신도시 탐방", "동남아 자유여행"],
    hobbies: ["등산·클라이밍", "마라톤·러닝", "스타트업/사이드 프로젝트", "어학·자기계발 스터디", "원예·식물 키우기"],
    notFor: "정적이고 반복적인 루틴 작업이나, 결과가 더디게 나오는 활동은 답답하게 느껴져 오래 지속하기 어려울 수 있어요. 성장이 눈에 보이는 피드백 구조가 없으면 금방 흥미를 잃는 경향이 있습니다.",
  },
  화: {
    color: "#dc2626",
    emoji: "🔥",
    personality: "감성·표현·열정형",
    movies: [
      { title: "라라랜드", why: "꿈과 현실 사이에서 타오르는 열정. 아름다운 감정의 롤러코스터.", genre: "뮤지컬·드라마" },
      { title: "위대한 쇼맨", why: "화려한 볼거리와 감동적인 스토리. 존재감을 드러내고 싶은 화형과 찰떡.", genre: "뮤지컬" },
      { title: "올드보이", why: "강렬한 감정과 충격적 서사. 화형의 폭발적 감수성을 자극.", genre: "스릴러" },
      { title: "비긴 어게인", why: "음악과 감성이 넘치는 힐링 무비. 화형의 예술적 감각과 공명.", genre: "음악·드라마" },
    ],
    books: [
      { title: "어린 왕자", why: "순수한 감수성으로 세상을 보는 시선. 화형의 낭만적 본성과 딱 맞음.", genre: "소설·우화" },
      { title: "노르웨이의 숲 (무라카미 하루키)", why: "감정과 기억의 결. 화형이 가장 깊이 빠져드는 분위기의 소설.", genre: "소설" },
      { title: "감정은 습관이다", why: "감정 폭발이 많은 화형을 위한 감정 관리의 지혜.", genre: "자기계발·심리" },
      { title: "지구 끝의 온실 (김초엽)", why: "감성적 세계관과 아름다운 문장. 화형의 감수성을 극대화.", genre: "SF·소설" },
    ],
    music: ["팝·발라드", "R&B", "케이팝", "재즈 팝"],
    travel: ["유럽 감성 여행", "예술도시(파리·피렌체)", "국내 소도시", "축제·공연 관광"],
    hobbies: ["악기 연주·노래", "사진·영상 촬영", "춤·퍼포먼스", "맛집 탐방·홈카페", "공연·전시 관람"],
    notFor: "혼자 조용히 분석하거나 장기간 인내해야 하는 활동은 흥미가 빨리 식어 지루하게 느껴질 수 있어요. 반응이 없거나 분위기가 가라앉는 환경에서는 에너지가 급격히 소진됩니다.",
  },
  토: {
    color: "#92400e",
    emoji: "🏔️",
    personality: "안정·포용·깊이형",
    movies: [
      { title: "어바웃 타임", why: "가족과 일상의 소중함에 대한 따뜻한 시선. 토형의 포용적 가치관과 공명.", genre: "드라마·로맨스" },
      { title: "벌새", why: "평범한 일상 속 감정의 깊이. 토형의 세심함이 공감.", genre: "성장·드라마" },
      { title: "리틀 포레스트", why: "자연과 음식, 일상의 풍요로움. 토형의 안정 추구 성향과 완벽히 맞음.", genre: "힐링·일상" },
      { title: "포레스트 검프", why: "묵묵히 자신의 길을 걷는 삶. 토형의 뚝심 있는 여정.", genre: "드라마" },
    ],
    books: [
      { title: "채식주의자 (한강)", why: "인간 내면의 깊은 심연. 토형의 묵직한 감수성을 자극.", genre: "소설" },
      { title: "아몬드 (손원평)", why: "감정을 이해하는 여정. 토형의 포용력과 인내심이 주인공에게서 보임.", genre: "소설" },
      { title: "생각에 관한 생각 (대니얼 카너먼)", why: "깊이 있는 사고방식 탐구. 토형의 신중한 사고를 자극.", genre: "심리·경제" },
      { title: "완두 (김하나)", why: "일상의 소소한 아름다움. 토형의 편안한 감성에 딱 맞음.", genre: "에세이" },
    ],
    music: ["어쿠스틱 팝", "힐링 음악", "포크", "잔잔한 OST"],
    travel: ["시골·농촌 체험", "국내 온천·힐링 숙박", "제주도", "일본 소도시"],
    hobbies: ["요리·베이킹", "텃밭·반려식물 가꾸기", "도자기·공예", "캠핑·차박", "명상·요가"],
    notFor: "급변하는 환경이나 즉흥적인 결정이 필요한 활동은 부담스럽게 느껴져 스트레스를 받을 수 있어요. 충분한 준비 없이 바로 뛰어들어야 하는 상황에서는 실력보다 긴장감이 앞서게 됩니다.",
  },
  금: {
    color: "#7c3aed",
    emoji: "⚔️",
    personality: "분석·완벽·미적형",
    movies: [
      { title: "나이브스 아웃", why: "날카로운 추리와 반전. 금형의 분석적 사고력을 자극.", genre: "추리·스릴러" },
      { title: "퍼펙트 블루", why: "정체성과 완벽에 대한 집착. 금형의 완벽주의 심리와 공명.", genre: "애니·스릴러" },
      { title: "그랜드 부다페스트 호텔", why: "완벽한 미장센과 정교한 구성미. 금형의 심미안을 만족.", genre: "코미디·드라마" },
      { title: "쇼생크 탈출", why: "체계적 계획과 인내로 이룬 자유. 금형의 의지력과 정확성.", genre: "드라마" },
    ],
    books: [
      { title: "총균쇠 (재레드 다이아몬드)", why: "방대하고 정교한 분석. 금형의 탐구욕을 충족시키는 지식의 향연.", genre: "역사·사회과학" },
      { title: "코스모스 (칼 세이건)", why: "우주의 질서와 아름다움. 금형의 체계적 사고와 미적 감각을 동시에 자극.", genre: "과학" },
      { title: "82년생 김지영", why: "날카로운 사회 분석과 구조적 문제 제기. 금형의 비판적 시각과 맞음.", genre: "소설" },
      { title: "우아하게 거절하는 법", why: "자신의 경계를 정확히 긋는 기술. 금형에게 필요한 실용 지혜.", genre: "자기계발" },
    ],
    music: ["클래식", "재즈", "인디 팝", "일렉트로닉(미니멀)"],
    travel: ["도시 호텔링", "미술관·박물관 투어", "유럽 건축 탐방", "일본 도쿄·교토"],
    hobbies: ["헬스·웨이트 트레이닝", "재테크·투자 공부", "사격·검도 등 정밀 스포츠", "미니멀 라이프·정리", "와인·위스키 테이스팅"],
    notFor: "정리되지 않고 즉흥적·산만한 환경의 활동은 거슬리고 비효율적으로 느껴져 흥미를 잃기 쉬워요. 기준 없이 진행되는 활동에서는 에너지보다 불만이 먼저 쌓이는 경향이 있습니다.",
  },
  수: {
    color: "#0369a1",
    emoji: "🌊",
    personality: "감성·직관·신비형",
    movies: [
      { title: "이터널 선샤인", why: "기억과 감정의 파장. 수형의 깊은 감성과 신비로운 내면에 공명.", genre: "로맨스·SF" },
      { title: "마녀 배달부 키키", why: "자유롭게 흘러가는 삶의 여정. 수형의 감성적 자유로움.", genre: "애니·힐링" },
      { title: "콜 미 바이 유어 네임", why: "여름과 감정의 결. 수형이 가장 깊이 느끼는 감성의 결.", genre: "드라마·로맨스" },
      { title: "밀양", why: "인간 내면의 심연과 신비. 수형의 깊은 존재론적 감성을 자극.", genre: "드라마" },
    ],
    books: [
      { title: "파친코 (이민진)", why: "시간과 기억의 흐름. 수형의 넓은 포용력으로 깊이 공감하는 서사.", genre: "소설" },
      { title: "달에게 들려주고 싶은 이야기 (베르나르 베르베르)", why: "신비롭고 상상력 넘치는 세계관. 수형의 직관과 공명.", genre: "SF·판타지" },
      { title: "죽음이란 무엇인가 (셸리 케이건)", why: "존재와 소멸에 대한 철학적 탐구. 수형의 깊은 내면과 맞음.", genre: "철학" },
      { title: "내가 죽이고 싶은 아이 (황선미)", why: "인간 심리의 깊은 곳을 건드리는 이야기. 수형의 직관적 공감 능력.", genre: "소설" },
      { title: "불안의 서 (페르난두 페소아)", why: "내면의 흐름을 끝없이 응시하는 글. 수형의 깊은 사유와 감성에 정확히 맞음.", genre: "에세이·문학" },
      { title: "구의 증명 (최진영)", why: "사랑과 존재에 대한 절절한 응시. 수형의 깊은 감정선과 공명.", genre: "소설" },
    ],
    music: ["인디 팝·로파이", "재즈 발라드", "앰비언트", "케이팝 감성 발라드"],
    travel: ["바다·해안가 여행", "온천·스파 힐링", "섬 여행(발리·하와이)", "비오는 날 여행"],
    hobbies: ["글쓰기·일기", "수영·다이빙", "독서·영화 감상", "타로·점성술 탐구", "악기 감상·플레이리스트 만들기"],
    notFor: "지나치게 경쟁적이거나 감정을 드러내야 하는 활동은 부담스럽고 소진되는 느낌이 들 수 있어요. 시끄럽고 자극이 강한 환경에 오래 있으면 내면이 흐트러지고 회복에 오랜 시간이 걸립니다.",
  },
};

interface IlganTaste {
  tag: string;
  keyword: string;
  movies: string[];
  books: string[];
  travel: string[];
  music: string;
  food: string;
}

const ILGAN_TASTE: Record<string, IlganTaste> = {
  갑: {
    tag: "리더십·개척형",
    keyword: "목표를 향해 직진하고, 장애물은 돌파한다",
    movies: ["킹스맨 — 노력으로 계층을 극복하는 성장 서사", "머니볼 — 전략과 소신으로 판을 바꾸는 이야기", "인터스텔라 — 인류의 한계를 넘으려는 탐구 본능", "광해, 왕이 된 남자 — 리더의 고독과 결단"],
    books: ["리더십 파이프라인 — 조직과 성장 구조를 꿰뚫는 리더십 교과서", "원씽(게리 켈러) — 하나에 집중해 최대 성과를 내는 법", "아웃라이어(말콤 글래드웰) — 성공의 숨겨진 규칙 탐구", "넛지 — 사람을 설득하고 이끄는 구조의 힘"],
    travel: ["히말라야·백두대간 트레킹", "아이슬란드 자연 탐험", "실크로드·역사 루트 여행"],
    music: "록·얼터너티브 (강한 에너지, 메시지 있는 가사)",
    food: "강한 풍미·매운 육류 요리 선호. 에너지 보충 위주 식사",
  },
  을: {
    tag: "감성·공감형",
    keyword: "섬세한 눈으로 세상을 읽고, 관계 속에서 꽃핀다",
    movies: ["비포 선라이즈 — 감성적 대화와 감정의 결을 담은 로맨스", "브리짓 존스의 일기 — 솔직한 감정과 공감 가득한 일상", "아멜리에 — 일상 속 작은 아름다움을 포착하는 감성", "나의 아저씨 — 따뜻한 공감과 섬세한 인간관계"],
    books: ["내 감정 사용법(게리 채프먼) — 감정을 이해하고 관계를 깊게 하는 법", "완두(김하나) — 일상의 소소한 아름다움을 담은 에세이", "82년생 김지영 — 시대와 감정을 날카롭게 관통하는 소설", "오늘도 나는 나를 사랑한다 — 자기 이해와 성장을 돕는 감성 에세이"],
    travel: ["파리·피렌체 감성 여행", "교토 소도시 산책", "제주 올레길·감성 숙소"],
    music: "인디 팝·어쿠스틱 (감성적, 서정적 멜로디)",
    food: "섬세하고 정갈한 음식 선호. 카페 디저트·건강식에 관심",
  },
  병: {
    tag: "에너지·사교형",
    keyword: "강렬하게 타오르고, 사람들을 빛으로 끌어당긴다",
    movies: ["독전 — 강렬한 에너지와 속도감 넘치는 액션", "버드맨 — 존재감과 열정, 무대 위 폭발하는 자아", "위대한 쇼맨 — 화려한 볼거리와 열정적 리더십", "닥터 스트레인지 — 스펙터클하고 역동적인 세계관"],
    books: ["그릿(앤절라 더크워스) — 끈기와 열정으로 성공하는 법", "파친코(이민진) — 생명력 넘치는 방대한 서사에 몰입", "어린 왕자 — 순수한 감수성과 빛나는 본질 탐구", "1만 시간의 법칙 — 열정을 결과로 만드는 연습의 힘"],
    travel: ["뉴욕·바르셀로나 도시 에너지 탐방", "방콕·발리 역동적 여행", "축제·공연 중심 여행(코첼라·에든버러 등)"],
    music: "팝·댄스·힙합 (밝고 에너지 넘치는 비트)",
    food: "다양한 나라 음식 도전. 새로운 맛 탐험 즐김",
  },
  정: {
    tag: "섬세·예술형",
    keyword: "촛불처럼 조용히 타오르며, 주변을 따뜻하게 밝힌다",
    movies: ["님아, 그 강을 건너지 마오 — 깊은 사랑과 일상의 아름다움", "아멜리에 — 섬세한 감수성과 예술적 상상력", "리틀 포레스트 — 자연과 음식, 내면 치유의 여정", "나미야 잡화점의 기적 — 따뜻한 인연과 감동적 서사"],
    books: ["채식주의자(한강) — 인간 내면의 섬세하고 무거운 심연", "오베라는 남자(프레드릭 배크만) — 따뜻하고 유머 있는 인간 탐구", "어린 왕자 — 순수한 사랑과 존재의 의미", "지구 끝의 온실(김초엽) — 감성적 세계관과 아름다운 문장"],
    travel: ["교토·포르투갈 감성 소도시", "국내 전통 마을·한옥 숙박", "제주 올레길·힐링 카페"],
    music: "재즈·발라드·클래식 (섬세하고 감성적인 멜로디)",
    food: "정갈하고 섬세한 한식·일식 선호. 요리 과정 자체를 즐김",
  },
  무: {
    tag: "구조·역사형",
    keyword: "산처럼 묵직하게 서서, 큰 그림을 본다",
    movies: ["밀정 — 역사 속 믿음과 배신, 구조적 갈등", "덩케르크 — 거대한 역사의 흐름 속 개인과 전략", "포레스트 검프 — 묵묵히 자신의 길을 걷는 삶의 여정", "인터스텔라 — 인류와 우주, 거시적 세계관에 몰입"],
    books: ["사피엔스(유발 하라리) — 인류 역사 전체를 조망하는 구조적 사고", "총균쇠(재레드 다이아몬드) — 문명의 흥망을 결정한 요인 분석", "로마인 이야기(시오노 나나미) — 제국의 성장과 전략, 리더십", "원칙(레이 달리오) — 삶과 일에 적용하는 체계적 원칙"],
    travel: ["유럽 역사 도시(로마·아테네·이스탄불)", "실크로드·경주 역사 탐방", "안나푸르나·대자연 트레킹"],
    music: "어쿠스틱·클래식·재즈 (깊이 있고 묵직한 사운드)",
    food: "전통 음식·건강식 선호. 식사를 든든하게 챙기는 편",
  },
  기: {
    tag: "세심·일상형",
    keyword: "기름진 논밭처럼 조용히 모든 것을 품어낸다",
    movies: ["기묘한 이야기(시리즈) — 일상 속 숨겨진 신비를 포착", "벌새 — 평범한 일상 속 감정의 깊이와 디테일", "어바웃 타임 — 일상의 소중함을 일깨우는 따뜻한 드라마", "리틀 포레스트 — 자연과 음식, 안정적 일상의 회복"],
    books: ["사소한 것들의 과학 — 일상 속 작은 것들의 놀라운 원리", "완두(김하나) — 소소한 행복을 발견하는 감성 에세이", "아몬드(손원평) — 감정과 공감에 대한 조용하고 깊은 탐구", "내 삶을 바꾸는 정리의 힘 — 공간과 마음을 정돈하는 실용 지혜"],
    travel: ["제주도 힐링·감성 여행", "일본 소도시(나라·가마쿠라)", "국내 온천·리조트 휴양"],
    music: "힐링 음악·포크·어쿠스틱 (편안하고 따뜻한 사운드)",
    food: "집밥 스타일·건강식 선호. 식재료 선택에 꼼꼼한 편",
  },
  경: {
    tag: "논리·결단형",
    keyword: "도끼처럼 명확하게 판단하고, 원칙대로 밀어붙인다",
    movies: ["엑스 마키나 — 논리와 의도의 충돌, 인공지능과 인간의 대결", "다크 나이트 — 원칙과 혼돈의 대립, 강인한 의지", "쇼생크 탈출 — 치밀한 계획과 인내로 이룬 자유", "아이언맨 — 논리와 기술, 강력한 자아의 표현"],
    books: ["원칙(레이 달리오) — 체계적 원칙으로 최고를 이루는 법", "생각하는 기계(브라이언 크리스천) — 논리와 인공지능, 기술의 본질", "설득의 심리학(로버트 치알디니) — 설득과 의사결정의 구조", "총균쇠(재레드 다이아몬드) — 거시적 분석과 체계적 세계관"],
    travel: ["뉴욕·두바이 도시 투어", "도쿄 정밀한 도시 탐방", "아이슬란드 대자연 개척"],
    music: "클래식·헤비 록·재즈 (강렬하고 구조적인 음악)",
    food: "질 좋은 육류·담백한 음식 선호. 효율적 식사 추구",
  },
  신: {
    tag: "완벽·심미형",
    keyword: "다듬어진 보석처럼, 아름다움과 정밀함을 추구한다",
    movies: ["블랙 스완 — 완벽을 향한 집착과 예술가의 고통", "그랜드 부다페스트 호텔 — 완벽한 미장센과 정교한 구성미", "퍼펙트 블루 — 정체성과 완벽에 대한 심리적 탐구", "그녀(Her) — 감성과 기술, 섬세한 감정 표현"],
    books: ["코스모스(칼 세이건) — 우주의 질서와 아름다움, 정밀한 과학", "우아하게 거절하는 법 — 자신의 경계를 명확히 긋는 기술", "82년생 김지영 — 날카로운 사회 분석과 구조적 문제 제기", "위험한 비전 — 예리한 통찰과 비판적 미래 탐구"],
    travel: ["파리·교토 미적 감성 여행", "유럽 미술관·건축 투어", "일본 료칸 품격 휴양"],
    music: "클래식·인디 팝·재즈 (세련되고 정제된 사운드)",
    food: "고급 식재료·정교한 요리 선호. 맛과 플레이팅 모두 중시",
  },
  임: {
    tag: "자유·탐험형",
    keyword: "바다처럼 넓게 흐르며, 모든 경험을 흡수한다",
    movies: ["그래비티 — 우주와 생존, 자유와 고독의 경계", "세 얼간이 — 틀을 깨고 자신의 길을 찾는 유쾌한 모험", "인터스텔라 — 인류의 경계를 넘어서는 탐험 본능", "빌리 엘리어트 — 자유로운 자아 표현과 꿈의 실현"],
    books: ["아직도 가야 할 길(M. 스캇 펙) — 성장은 고통이라는 진리와 자기 탐구", "파친코(이민진) — 방대한 시간과 다양한 삶을 담은 서사", "달에게 들려주고 싶은 이야기(베르나르 베르베르) — 신비롭고 광활한 상상력", "사피엔스 — 인류 전체를 조망하는 거대하고 자유로운 탐구"],
    travel: ["동남아 배낭여행·발리", "세계 일주·장기 여행", "바다·해안 도시(리스본·하와이)"],
    music: "앰비언트·재즈·인디 (자유롭고 광활한 사운드)",
    food: "다양한 나라 음식 탐험. 여행지 현지 음식 직접 체험 즐김",
  },
  계: {
    tag: "직관·감성형",
    keyword: "고요한 호수처럼 깊고, 감정의 파장을 섬세하게 느낀다",
    movies: ["소공녀 — 자신만의 가치를 지키는 청순하고 깊은 이야기", "이터널 선샤인 — 기억과 감정의 파장, 사랑의 신비로운 결", "콜 미 바이 유어 네임 — 여름과 감정의 결, 깊은 감성적 몰입", "밀양 — 인간 내면의 심연과 신비, 존재론적 감성"],
    books: ["혼자서도 잘 자요 — 혼자인 시간을 사랑하는 법을 담은 에세이", "불안의 서(페르난두 페소아) — 내면의 흐름을 끝없이 응시하는 문학", "구의 증명(최진영) — 사랑과 존재에 대한 절절한 감성 소설", "죽음이란 무엇인가(셸리 케이건) — 존재와 소멸에 대한 철학적 탐구"],
    travel: ["바다·섬 여행(발리·오키나와)", "비오는 날 카페 투어·감성 숙소", "온천·스파 힐링 여행"],
    music: "로파이·앰비언트·인디 발라드 (조용하고 감성적인 사운드)",
    food: "섬세하고 담백한 음식 선호. 혼밥·작은 카페 분위기 즐김",
  },
};

function FadeIn({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  const [v, setV] = useState(false);
  useEffect(() => { const t = setTimeout(() => setV(true), delay); return () => clearTimeout(t); }, [delay]);
  return (
    <div className={className} style={{ opacity: v ? 1 : 0, transform: v ? "translateY(0)" : "translateY(18px)", transition: `opacity 0.9s ease ${delay}ms, transform 0.9s cubic-bezier(0.22,1,0.36,1) ${delay}ms` }}>
      {children}
    </div>
  );
}

export default function TastePage() {
  const router = useRouter();
  const [step, setStep] = useState<"splash" | "input" | "main">("splash");
  const [showBtn, setShowBtn] = useState(false);

  // 입력 폼 상태
  const [form, setForm] = useState<BirthFormData>(defaultBirthData("female"));

  // 결과 상태
  const [element, setElement] = useState<string>("수");
  const [ilgan, setIlgan] = useState<string>("임");
  const [name, setName] = useState("나");
  const [pillarsDetail, setPillarsDetail] = useState<any>(null);
  const [dominantSip, setDominantSip] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"movies" | "books" | "music" | "travel" | "hobbies">("movies");

  useEffect(() => {
    const t = setTimeout(() => setShowBtn(true), 2500);
    return () => clearTimeout(t);
  }, []);

  async function handleAnalyze() {
    if (!form.name.trim()) {
      alert("이름을 입력해주세요.");
      return;
    }
    if (!form.birthYear || !form.birthMonth || !form.birthDay) {
      alert("생년월일을 모두 선택해주세요.");
      return;
    }
    let y = Number(form.birthYear), m = Number(form.birthMonth), d = Number(form.birthDay);
    if (form.calendarType === "lunar") {
      try {
        // @ts-ignore
        const KLC = (await import("korean-lunar-calendar")).default;
        const cal = new KLC();
        cal.setLunarDate(y, m, d, form.isLeapMonth);
        const s = cal.getSolarCalendar();
        if (!s?.year) throw new Error();
        y = s.year; m = s.month; d = s.day;
      } catch {
        alert("음력 날짜를 양력으로 변환할 수 없습니다.");
        return;
      }
    }
    try {
      const r = analyzeSaju({
        birthYear: y, birthMonth: m, birthDay: d,
        birthHour: form.birthHour, birthMinute: form.birthMinute,
        name: form.name || "나", gender: form.gender,
        birthPlace: form.city || "서울", style: "auto", productType: "report",
        useJajasi: form.useJajasi,
      });
      setElement(r.dominant[0] || "수");
      setIlgan(r.pillarsDetail.day.cg || "임");
      // 가장 많이 등장한 십성 계산
      const sipCounts: Record<string, number> = {};
      [r.pillarsDetail.year.sipseongCg, r.pillarsDetail.year.sipseongJj,
       r.pillarsDetail.month.sipseongCg, r.pillarsDetail.month.sipseongJj,
       r.pillarsDetail.hour?.sipseongCg, r.pillarsDetail.hour?.sipseongJj]
        .filter(Boolean).forEach(s => { if (s) sipCounts[s] = (sipCounts[s] || 0) + 1; });
      const topSip = Object.entries(sipCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "";
      setDominantSip(topSip);
      setName(form.name || "나");
      setPillarsDetail(r.pillarsDetail);
      setActiveTab("movies");
      setStep("main");
    } catch {
      alert("생년월일을 다시 확인해주세요.");
    }
  }

  const taste = ELEMENT_TASTE[element] || ELEMENT_TASTE["수"];
  const ilganTaste = ILGAN_TASTE[ilgan];

  // ── 스플래시 ──────────────────────────────────────────────────────────────
  if (step === "splash") return (
    <main className="min-h-screen bg-[#06060e] text-white flex flex-col items-center justify-center px-6 relative overflow-hidden page-fade-in">
      <BackButton />
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}.pulse{animation:pulse 2s ease-in-out infinite}`}</style>
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-amber-900/15 blur-[160px]" />
        <div className="absolute bottom-[-15%] right-[-10%] w-[500px] h-[500px] rounded-full bg-orange-900/10 blur-[130px]" />
      </div>

      <div className="relative z-10 max-w-lg w-full text-center space-y-0">
        <FadeIn delay={0} className="mb-6">
          <div className="flex flex-col items-center gap-4">
            <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 rounded-full px-4 py-1.5">
              <span className="pulse w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" />
              <span className="text-xs font-bold text-amber-300 tracking-widest uppercase">Summer Palace · 취향 분석</span>
            </div>
            <div className="text-5xl drop-shadow-[0_0_40px_rgba(251,191,36,0.4)]">🎬</div>
          </div>
        </FadeIn>

        <div className="space-y-4 mb-12">
          {[
            { text: "당신이 좋아하는 영화·음악·여행.", big: false, delay: 200 },
            { text: "사주에 이미 답 있습니다.", big: true, delay: 700 },
            { text: "오행이 다르면", big: false, delay: 1200 },
            { text: "취향도 다릅니다.", big: true, delay: 1700 },
          ].map((line, i) => (
            <FadeIn key={i} delay={line.delay}>
              <p className={`leading-snug ${line.big
                ? "text-3xl font-black bg-gradient-to-r from-amber-300 via-orange-200 to-amber-300 bg-clip-text text-transparent"
                : "text-xl text-gray-400 font-medium"
              }`}>{line.text}</p>
            </FadeIn>
          ))}
        </div>

        <FadeIn delay={2100} className="mb-10">
          <div className="grid grid-cols-2 gap-2 max-w-xs mx-auto">
            {[
              { icon: "🎬", title: "영화 추천", desc: "오행별 4편 큐레이션" },
              { icon: "📚", title: "책 추천", desc: "내 일간에 맞는 책" },
              { icon: "🎵", title: "음악 장르", desc: "오행별 음악 성향" },
              { icon: "✈️", title: "여행 스타일", desc: "내 에너지와 맞는 곳" },
            ].map((f, i) => (
              <div key={i} className="rounded-xl p-3 text-left" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
                <span className="text-xl">{f.icon}</span>
                <p className="text-xs font-bold text-white mt-1">{f.title}</p>
                <p className="text-[10px] mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </FadeIn>

        <div style={{
          opacity: showBtn ? 1 : 0,
          transform: showBtn ? "translateY(0) scale(1)" : "translateY(20px) scale(0.96)",
          transition: "opacity 0.7s ease, transform 0.7s cubic-bezier(0.22,1,0.36,1)",
        }}>
          <button onClick={() => setStep("input")}
            className="w-full max-w-xs mx-auto block font-bold py-5 px-10 rounded-2xl text-lg shadow-2xl transition-all active:scale-[0.97]"
            style={{ background: "linear-gradient(135deg, #d97706 0%, #f59e0b 100%)", color: "#1a0f00", boxShadow: "0 8px 32px -4px rgba(217,119,6,0.4)" }}>
            내 취향 분석하기 →
          </button>
          <p className="text-xs text-gray-700 mt-4">무료 · 생년월일 입력 후 바로 확인</p>
        </div>
      </div>
    </main>
  );

  // ── 입력 폼 ───────────────────────────────────────────────────────────────
  if (step === "input") {
    const ready = !!form.birthYear && !!form.birthMonth && !!form.birthDay;
    return (
      <main className="min-h-screen bg-[#06060e] text-white">
        <BackButton />
        <div className="fixed inset-0 pointer-events-none">
          <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-amber-900/15 blur-[160px]" />
          <div className="absolute bottom-[-15%] right-[-10%] w-[500px] h-[500px] rounded-full bg-orange-900/10 blur-[130px]" />
        </div>
        <div className="relative z-10 max-w-lg mx-auto px-4 pt-6 pb-24">

          <div className="text-center mb-8">
            <div className="text-4xl mb-3">🎬</div>
            <h2 className="text-2xl font-black mb-2">생년월일 입력</h2>
            <p className="text-gray-500 text-sm">사주로 취향을 분석합니다</p>
          </div>

          <div className="space-y-5">
            <BirthInputForm value={form} onChange={setForm} accent="#d97706" />

            <button onClick={handleAnalyze} disabled={!ready}
              className={`w-full py-5 rounded-2xl font-black text-lg tracking-tight transition-all active:scale-[0.98] ${
                ready ? "text-[#1a0f00] shadow-lg" : "bg-white/5 border border-white/10 text-gray-600 cursor-not-allowed"
              }`}
              style={ready ? { background: "linear-gradient(135deg, #d97706 0%, #f59e0b 100%)", boxShadow: "0 8px 32px -4px rgba(217,119,6,0.4)" } : {}}>
              취향 분석하기 →
            </button>
          </div>
        </div>
      </main>
    );
  }

  // ── 결과 ─────────────────────────────────────────────────────────────────
  return (
    <main className="min-h-screen bg-[#06060e] text-white" style={{ animation: "fadeIn 0.45s ease-out" }}>
      <BackButton />
      <style>{`@keyframes fadeIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}`}</style>
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full blur-[120px]" style={{ backgroundColor: `${taste.color}30` }} />
        <div className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] rounded-full bg-violet-900/15 blur-[100px]" />
      </div>

      <div className="relative z-10 max-w-lg mx-auto px-4 pt-6 pb-16" id="taste-result">
        {/* 헤더 */}
        <div className="flex items-center gap-3 mb-6">
          <span className="text-xs text-green-400/60 bg-green-500/10 border border-green-500/15 px-2 py-1 rounded-full">무료</span>
        </div>

        {/* 타이틀 */}
        <div className="text-center mb-6">
          <div className="text-4xl mb-3">{taste.emoji}</div>
          <h1 className="text-2xl font-black mb-1 bg-gradient-to-r from-amber-300 to-orange-300 bg-clip-text text-transparent">
            {name}의 취향 분석
          </h1>
          <p className="text-gray-400 text-sm">
            {element} 오행 · {ilgan}일간 — {taste.personality}
          </p>
        </div>

        {/* 일간 맞춤 추천 */}
        {ilganTaste && (
          <div className="bg-white/[0.04] border border-white/10 rounded-2xl p-4 mb-5">
            <div className="flex items-center gap-2 mb-1">
              <p className="text-xs text-gray-500 font-semibold tracking-widest uppercase">{ilgan}일간 맞춤 취향</p>
              <span className="text-xs px-2 py-0.5 rounded-full bg-white/5 text-gray-400">#{ilganTaste.tag}</span>
            </div>
            <p className="text-xs text-gray-500 italic mb-3">"{ilganTaste.keyword}"</p>

            {/* 영화 */}
            <div className="mb-3">
              <p className="text-[11px] text-amber-400/70 font-bold mb-2">🎬 이런 영화에 끌립니다</p>
              <div className="space-y-1.5">
                {ilganTaste.movies.map((m, i) => {
                  const [title, ...rest] = m.split(" — ");
                  return (
                    <div key={i} className="flex gap-2 items-start">
                      <span className="text-[10px] text-gray-600 mt-0.5 shrink-0">{i + 1}</span>
                      <div>
                        <span className="text-xs font-bold text-white">{title}</span>
                        {rest.length > 0 && <span className="text-[10px] text-gray-500"> — {rest.join(" — ")}</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 책 */}
            <div className="mb-3">
              <p className="text-[11px] text-blue-400/70 font-bold mb-2">📚 이런 책에 빠집니다</p>
              <div className="space-y-1.5">
                {ilganTaste.books.map((b, i) => {
                  const [title, ...rest] = b.split(" — ");
                  return (
                    <div key={i} className="flex gap-2 items-start">
                      <span className="text-[10px] text-gray-600 mt-0.5 shrink-0">{i + 1}</span>
                      <div>
                        <span className="text-xs font-bold text-white">{title}</span>
                        {rest.length > 0 && <span className="text-[10px] text-gray-500"> — {rest.join(" — ")}</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 여행·음악·음식 */}
            <div className="grid grid-cols-1 gap-2">
              <div className="bg-white/[0.03] rounded-xl p-3">
                <p className="text-[11px] text-green-400/70 font-bold mb-1.5">✈️ 여행 스타일</p>
                <div className="flex flex-wrap gap-1">
                  {ilganTaste.travel.map((t, i) => (
                    <span key={i} className="text-[10px] bg-white/5 text-gray-400 px-2 py-0.5 rounded-full">{t}</span>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-white/[0.03] rounded-xl p-3">
                  <p className="text-[11px] text-purple-400/70 font-bold mb-1">🎵 음악 성향</p>
                  <p className="text-[10px] text-gray-400 leading-relaxed">{ilganTaste.music}</p>
                </div>
                <div className="bg-white/[0.03] rounded-xl p-3">
                  <p className="text-[11px] text-orange-400/70 font-bold mb-1">🍽️ 음식 취향</p>
                  <p className="text-[10px] text-gray-400 leading-relaxed">{ilganTaste.food}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 탭 */}
        <div className="flex gap-2 mb-5">
          {[
            { key: "movies" as const, label: "🎬 영화" },
            { key: "books" as const, label: "📚 책" },
            { key: "music" as const, label: "🎵 음악" },
            { key: "travel" as const, label: "✈️ 여행" },
            { key: "hobbies" as const, label: "🎯 취미" },
          ].map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold transition border ${activeTab === tab.key ? "text-white border-white/20 bg-white/10" : "text-gray-500 border-white/5 bg-white/[0.02] hover:bg-white/5"}`}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* 영화 탭 */}
        {activeTab === "movies" && (
          <div className="space-y-3">
            {taste.movies.map((m, i) => (
              <div key={i} className="bg-white/[0.04] border border-white/10 rounded-2xl p-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-black shrink-0" style={{ backgroundColor: `${taste.color}33`, color: taste.color }}>
                    {i + 1}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-bold text-white">{m.title}</p>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-white/5 text-gray-500">{m.genre}</span>
                    </div>
                    <p className="text-xs text-gray-400 leading-relaxed">{m.why}</p>
                  </div>
                </div>
              </div>
            ))}

            {/* 십성별 서사 취향 */}
            {dominantSip && SIPSEONG_MOVIE[dominantSip] && (() => {
              const md = SIPSEONG_MOVIE[dominantSip];
              return (
                <div className="bg-white/[0.04] border border-pink-500/20 rounded-2xl p-4 mt-1">
                  <p className="text-[10px] text-pink-400/70 font-bold tracking-wider mb-1">{dominantSip} 기질 — 내가 끌리는 서사</p>
                  <p className="font-bold text-pink-200 mb-1">"{md.movie}"</p>
                  <p className="text-xs text-gray-400 leading-relaxed">{md.reason}</p>
                  <p className="text-[10px] text-gray-600 mt-1">{md.vibe}</p>
                </div>
              );
            })()}
          </div>
        )}

        {/* 책 탭 */}
        {activeTab === "books" && (
          <div className="space-y-3">
            {taste.books.map((b, i) => (
              <div key={i} className="bg-white/[0.04] border border-white/10 rounded-2xl p-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-black shrink-0" style={{ backgroundColor: `${taste.color}33`, color: taste.color }}>
                    {i + 1}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-bold text-white">{b.title}</p>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-white/5 text-gray-500">{b.genre}</span>
                    </div>
                    <p className="text-xs text-gray-400 leading-relaxed">{b.why}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 음악 탭 */}
        {activeTab === "music" && (
          <div>
            <p className="text-xs text-gray-500 mb-4">{element} 오행에게 잘 맞는 음악 장르</p>
            <div className="grid grid-cols-2 gap-3">
              {taste.music.map((m, i) => (
                <div key={i} className="bg-white/[0.04] border border-white/10 rounded-xl p-4 text-center">
                  <p className="text-2xl mb-2">{["🎸","🎵","🎷","🎹"][i % 4]}</p>
                  <p className="text-sm font-bold text-white">{m}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 여행 탭 */}
        {activeTab === "travel" && (
          <div>
            <p className="text-xs text-gray-500 mb-4">{element} 오행에게 잘 맞는 여행 스타일</p>
            <div className="space-y-3">
              {taste.travel.map((t, i) => (
                <div key={i} className="flex items-center gap-3 bg-white/[0.04] border border-white/10 rounded-xl p-4">
                  <span className="text-xl">{["🏃","🗺️","✈️","🌴"][i]}</span>
                  <span className="text-sm text-gray-200">{t}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 취미 탭 */}
        {activeTab === "hobbies" && (
          <div>
            <p className="text-xs text-gray-500 mb-4">{element} 오행에게 잘 맞는 취미생활</p>
            <div className="space-y-3">
              {taste.hobbies.map((h, i) => (
                <div key={i} className="flex items-center gap-3 bg-white/[0.04] border border-white/10 rounded-xl p-4">
                  <span className="text-xl">{["🎯","🎨","🎲","🧩","🎪"][i]}</span>
                  <span className="text-sm text-gray-200">{h}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 안 맞을 수 있는 것 */}
        <div className="mt-4 bg-white/[0.04] border border-white/10 rounded-2xl p-5">
          <p className="text-xs text-gray-500 font-semibold tracking-widest uppercase mb-2">이런 건 안 맞을 수 있어요</p>
          <p className="text-sm text-gray-300 leading-relaxed">{taste.notFor}</p>
        </div>

        {/* 삼합·방합 취향 기질 */}
        {(() => {
          const samhapList = pillarsDetail ? detectSamhapBanghap(pillarsDetail) : [];
          if (!samhapList || samhapList.length === 0) return null;
          return (
            <div className="mt-4 bg-white/[0.04] border border-white/10 rounded-2xl p-5">
              <p className="text-xs text-gray-500 font-semibold tracking-widest uppercase mb-3">삼합·방합 취향 기질</p>
              <div className="space-y-3">
                {samhapList.map((s: any, i: number) => {
                  const badgeStyle =
                    s.type === "삼합" ? { bg: "bg-amber-500/20", text: "text-amber-300", border: "border-amber-500/30" } :
                    s.type === "반합" ? { bg: "bg-yellow-500/20", text: "text-yellow-300", border: "border-yellow-500/30" } :
                    { bg: "bg-green-500/20", text: "text-green-300", border: "border-green-500/30" };
                  const tasteHint =
                    s.type === "삼합" ? "웅장하고 변혁적인 스토리, 서사가 큰 작품에 끌립니다." :
                    s.type === "방합" ? "감정·관계 중심의 드라마, 섬세한 인간 이야기에 공명합니다." :
                    "반합의 에너지가 취향에 미묘한 방향성을 더합니다.";
                  return (
                    <div key={i} className="rounded-xl p-4" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-bold border ${badgeStyle.bg} ${badgeStyle.text} ${badgeStyle.border}`}>{s.type}</span>
                        <span className="text-sm font-bold text-white">{s.name}</span>
                      </div>
                      <p className="text-xs text-gray-400 leading-relaxed mb-1">{s.detail}</p>
                      <p className="text-xs text-gray-500 leading-relaxed">{tasteHint}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })()}

        {/* 매력 분석 CTA */}
        <div className="mt-8 bg-gradient-to-br from-pink-600/10 to-violet-600/10 border border-pink-500/20 rounded-2xl p-5 text-center">
          <p className="text-sm font-bold text-white mb-1">내 사주에 숨겨진 매력도 궁금하지 않으세요?</p>
          <p className="text-xs text-gray-400 mb-4">도화살 · 홍염살 · 일간 매력 · 나한테 끌리는 이성 타입 분석</p>
          <button onClick={() => router.push("/service/charm")} className="bg-gradient-to-r from-pink-600 to-violet-600 text-white font-bold px-6 py-3 rounded-xl text-sm transition hover:from-pink-500 hover:to-violet-500 active:scale-[0.97]">
            ✨ 나의 매력 분석하기 (무료)
          </button>
        </div>

        <p className="text-center text-xs text-gray-700 mt-6">본 분석은 사주 오행 이론 기반 오락용 콘텐츠입니다.</p>
        <div className="mt-4">
          <ResultFooterActions targetId="taste-result" fileName="취향" />
        </div>
      </div>
    </main>
  );
}
