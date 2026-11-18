// 2026-11-18 11:55 KST
// AI 모듈(lib/ai)의 analyzeEntry를 부르는 자리. 저장과 다시 분석이 모두 이 함수를 거침.
// analyzeEntry는 예외를 던지지 않고, 두 모델이 실패하면 pending 결과를 돌려줌(docs/CONTRACT.md 3장).
import { analyzeEntry } from "@/lib/ai";
import type { AnalysisResult } from "@/lib/types/entry";

export async function analyze(content: string): Promise<AnalysisResult> {
  return analyzeEntry(content);
}
