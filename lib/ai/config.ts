// 2026-11-18 11:55 KST
// 모델 ID와 시간 제한은 이 파일 한 곳에서만 정함(docs/CONTRACT.md 3장, PRD 10.1절 안 A).
// 무료 모델(`:free`)만 씀. 유료 모델로 바꾸지 않음.

export interface ModelSpec {
  id: string;
  timeoutMs: number;
}

export const MODELS: readonly ModelSpec[] = [
  { id: "nvidia/nemotron-3-ultra-550b-a55b:free", timeoutMs: 15_000 },
  { id: "nvidia/nemotron-3.5-super-vl:free", timeoutMs: 10_000 },
];

export const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
export const MAX_OUTPUT_TOKENS = 1024;
export const MESSAGE_MAX_CHARS = 150;
