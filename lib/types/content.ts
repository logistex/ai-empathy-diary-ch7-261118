// 2026-11-18 11:55 KST
// 일기 내용 검사(CONTRACT.md 2.2절): 앞뒤 공백을 지운 뒤 코드 포인트 수 1~500자.
// 검사를 통과하면 지운 값을 돌려주고, 통과하지 못하면 null을 돌려줌.

export const CONTENT_MAX_LENGTH = 500;

export function normalizeContent(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  const length = [...trimmed].length;
  if (length < 1 || length > CONTENT_MAX_LENGTH) return null;
  return trimmed;
}
