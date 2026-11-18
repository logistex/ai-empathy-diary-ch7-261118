// 2026-11-18 11:55 KST
// 세 API가 함께 쓰는 오류 응답(CONTRACT.md 2.1절). 내부 정보는 담지 않음.
import type { ErrorCode } from "@/lib/types/entry";

const ERRORS: Record<ErrorCode, { status: number; message: string }> = {
  invalid_content: {
    status: 400,
    message: "일기는 1자 이상 500자 이하로 써 주세요.",
  },
  unauthorized: { status: 401, message: "로그인이 필요합니다." },
  not_found: { status: 404, message: "일기를 찾을 수 없습니다." },
  internal_error: {
    status: 500,
    message: "일시적인 오류가 생겼습니다. 잠시 뒤에 다시 시도해 주세요.",
  },
};

export function errorResponse(code: ErrorCode): Response {
  const { status, message } = ERRORS[code];
  return Response.json({ error: { code, message } }, { status });
}

// 일기 내용과 SQL이 로그에 남지 않도록 오류 이름만 기록함
export function internalError(where: string, err: unknown): Response {
  console.error(`${where} 실패`, err instanceof Error ? err.name : "unknown");
  return errorResponse("internal_error");
}
