// 2026-11-18 11:55 KST
// 위기 표현 목록 검사(PRD 4.5절 첫째 겹). 모델 호출과 무관하게 동작함.
// 놓치는 쪽이 더 위험하므로, 헷갈리면 위기로 판정함(오탐은 상담 연락처를 한 번 더 보이는 비용뿐임).
// 공백과 문장부호를 지운 뒤 비교하므로 패턴에는 공백을 쓰지 않음.

const CRISIS_PATTERNS: readonly string[] = [
  "죽고싶",
  "죽어버리고",
  "죽어버릴",
  "죽을래",
  "죽을까",
  "죽는게낫",
  "죽는편이낫",
  "자살",
  "자해",
  "극단적선택",
  "극단적인선택",
  "목숨을끊",
  "목숨을버",
  "스스로목숨",
  "삶을끝",
  "인생을끝",
  "생을끝",
  "생을마감",
  "삶을마감",
  "세상을떠나",
  "살기싫",
  "살고싶지않",
  "살아갈이유가없",
  "사라지고싶",
  "사라져버리고싶",
  "없어지고싶",
  "없어졌으면좋겠",
  "태어나지말",
  "손목을긋",
  "손목을그",
  "몸에상처를",
  "뛰어내리",
  "목을매",
  "목매달",
  "약을다먹",
  "수면제를다",
  "번개탄",
];

function normalize(text: string): string {
  return text.normalize("NFC").replace(/[\s\p{P}\p{S}]+/gu, "");
}

export function matchesCrisisList(content: string): boolean {
  const flat = normalize(content);
  return CRISIS_PATTERNS.some((p) => flat.includes(p));
}
