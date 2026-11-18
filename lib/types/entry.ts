// 2026-11-18 11:22 KST
// docs/CONTRACT.md 2장(API)과 3장(AI 모듈)의 타입. 바꾸려면 CONTRACT.md를 먼저 고침.
// 3개 에이전트가 함께 쓰므로 담당은 backend-developer임.

export const EMOTIONS = [
  "기쁨",
  "설렘",
  "평온",
  "슬픔",
  "불안",
  "분노",
  "외로움",
  "피로",
] as const;
export type Emotion = (typeof EMOTIONS)[number];

export type AnalysisStatus = "completed" | "pending";

/** API가 돌려주는 일기 1건 */
export interface Entry {
  id: string;
  content: string;
  emotion: Emotion | null;
  empathyMessage: string | null;
  isCrisis: boolean;
  modelUsed: string | null;
  analysisStatus: AnalysisStatus;
  createdAt: string; // ISO 8601(UTC)
}

/** analyzeEntry의 반환값. 예외를 던지지 않고 항상 이 형식으로 돌려줌 */
export type AnalysisResult =
  | {
      status: "completed";
      emotion: Emotion;
      empathyMessage: string;
      isCrisis: boolean;
      modelUsed: string;
    }
  | {
      status: "pending";
      emotion: null;
      empathyMessage: null;
      isCrisis: boolean; // 두 모델이 실패해도 위기 표현 목록의 판정은 들어 있음
      modelUsed: null;
    };

export interface ApiError {
  error: { code: ErrorCode; message: string };
}
export type ErrorCode =
  | "invalid_content"
  | "unauthorized"
  | "not_found"
  | "internal_error";
