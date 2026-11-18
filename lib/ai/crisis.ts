// 2026-11-18 11:55 KST
// 위기 표현 목록 검사(PRD 4.5절 첫째 겹). 모델 호출과 무관하게 동작함.
// 목록은 놓침을 줄이는 쪽을 우선함(PRD 4.5절 원칙, 2026-11-18 신 교수 결정으로 넓은 판으로 되돌림).
// 오탐은 위기 안내가 한 번 더 붙는 비용이므로 감수함.
// 일기와 패턴을 모두 한글 자모로 풀어(NFD) 비교함. 받침이 붙은 활용(뛰어내리 → 뛰어내릴)도
// 패턴의 앞부분과 맞으므로, 패턴은 받침 없는 어간까지만 쓰고 활용형을 늘리지 않음.
// 공백, 문장부호, 기호, 형식 문자(제로 폭 공백 등)를 지운 뒤 비교하므로 패턴에는 공백을 쓰지 않음.
// 영어 패턴은 소문자로 씀.

const CRISIS_PATTERNS: readonly string[] = [
  "죽고싶",
  "죽어버리고",
  "죽어버릴",
  "죽을래",
  "죽을까",
  "죽는게나",
  "죽는편이나",
  "죽었으면",
  "죽어야",
  "죽으려",
  "죽음을생각",
  "자살",
  "자해",
  "극단적선택",
  "극단적인선택",
  "목숨을끊",
  "목숨끊",
  "목숨을버",
  "스스로목숨",
  "삶을끝",
  "인생을끝",
  "생을끝",
  "생을마감",
  "삶을마감",
  "세상을떠나",
  "살기싫",
  "그만살",
  "살고싶지않",
  "살이유",
  "살아야할이유",
  "살아갈이유",
  "살아갈힘이없",
  "더이상살",
  "사라지고싶",
  "사라져버리고싶",
  "없어지고싶",
  "없어졌으면좋겠",
  "태어나지말",
  "영원히잠",
  "편하게갈",
  // "끝내고싶"만으로는 "약속을 끝내고 싶다" 같은 일상 표현이 잡히므로 앞말을 함께 요구함
  "다끝내고싶",
  "다끝내버",
  "끝내버리고싶",
  "힘들어서끝내",
  "힘들어끝내",
  "이제끝내고싶",
  "손목을긋",
  "손목을그",
  "팔을긋",
  "팔을그",
  "몸에상처를",
  "뛰어내리",
  "목을매",
  "목매",
  "목매달",
  "약을다먹",
  "약을한꺼번에",
  "약을모아",
  "약을모으",
  "수면제를다",
  "수면제를모",
  "유서",
  "번개탄",
  "iwanttodie",
  "wanttodie",
  "killmyself",
  "endmylife",
  "suicid",
];

// 위기가 아닌 고정 표현을 비교 전에 지우는 목록. 지금은 비워 둠(2026-11-18).
// 지우는 표현 안에 위기 단서가 들어 있으면 위기 문장을 가리게 되므로(docs/qa/recheck3.md),
// 놓침을 줄이는 쪽 우선 원칙(PRD 4.5절)에 따라 넣지 않음.
const NEUTRAL_PHRASES: readonly string[] = [];

function flatten(text: string): string {
  return text
    .normalize("NFD")
    .toLowerCase()
    .replace(/[\s\p{P}\p{S}\p{Cf}]+/gu, "");
}

const FLAT_PATTERNS = CRISIS_PATTERNS.map(flatten);
const FLAT_NEUTRAL = NEUTRAL_PHRASES.map(flatten);

export function matchesCrisisList(content: string): boolean {
  let flat = flatten(content);
  for (const phrase of FLAT_NEUTRAL) flat = flat.split(phrase).join("");
  return FLAT_PATTERNS.some((p) => flat.includes(p));
}
