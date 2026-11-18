// 2026-11-18 11:55 KST
// AI 결과를 끼우는 자리. 2단계에서는 AI 모듈을 부르지 않고 pending 결과를 돌려줌.
// 3단계에서 이 함수의 본문을 `return analyzeEntry(content)`(from "@/lib/ai")로 바꾸면 됨.
import type { AnalysisResult } from "@/lib/types/entry";

export async function analyze(content: string): Promise<AnalysisResult> {
  void content;
  return {
    status: "pending",
    emotion: null,
    empathyMessage: null,
    isCrisis: false,
    modelUsed: null,
  };
}
