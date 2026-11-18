// 2026-11-18 11:55 KST
// 서버 전용. 화면 쪽 코드에서 가져오지 않음(docs/CONTRACT.md 3장).
// 일기 내용과 모델 응답 원문은 로그에 남기지 않음.
import { EMOTIONS, type AnalysisResult, type Emotion } from "../types/entry";
import { matchesCrisisList } from "./crisis";
import {
  MAX_OUTPUT_TOKENS,
  MESSAGE_MAX_CHARS,
  MODELS,
  OPENROUTER_URL,
  type ModelSpec,
} from "./config";
import { SYSTEM_PROMPT, buildUserPrompt } from "./prompt";

interface ModelOutput {
  emotion: Emotion;
  message: string;
  crisis: boolean;
}

export interface Attempt {
  model: string;
  ok: boolean;
  ms: number;
  reason?: string; // 실패 이유 분류만 담음(원문 없음)
}

/** 응답 글에서 JSON 객체를 꺼내 검증함. 맞지 않으면 null */
function parseModelOutput(text: string): ModelOutput | null {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start < 0 || end <= start) return null;
  let obj: unknown;
  try {
    obj = JSON.parse(text.slice(start, end + 1));
  } catch {
    return null;
  }
  if (typeof obj !== "object" || obj === null) return null;
  const { emotion, message, crisis } = obj as Record<string, unknown>;
  if (typeof emotion !== "string" || typeof message !== "string") return null;
  const emotionWord = emotion.trim();
  if (!(EMOTIONS as readonly string[]).includes(emotionWord)) return null;
  const msg = message.trim();
  if (msg.length === 0 || [...msg].length > MESSAGE_MAX_CHARS) return null;
  return { emotion: emotionWord as Emotion, message: msg, crisis: crisis === true };
}

async function callModel(
  spec: ModelSpec,
  content: string,
  apiKey: string,
): Promise<{ output: ModelOutput | null; reason?: string }> {
  const res = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: spec.id,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: buildUserPrompt(content) },
      ],
      temperature: 0.6,
      max_tokens: MAX_OUTPUT_TOKENS,
    }),
    signal: AbortSignal.timeout(spec.timeoutMs), // 본문을 읽는 동안에도 적용됨
  });
  if (!res.ok) return { output: null, reason: `http_${res.status}` };
  const data = (await res.json()) as {
    error?: unknown;
    choices?: { message?: { content?: unknown } }[];
  };
  if (data.error) return { output: null, reason: "api_error" };
  const text = data.choices?.[0]?.message?.content;
  if (typeof text !== "string" || text.trim() === "") {
    return { output: null, reason: "empty" };
  }
  const output = parseModelOutput(text);
  return output ? { output } : { output: null, reason: "bad_format" };
}

/**
 * 모델 목록을 바꿔 호출함(확인 스크립트용). 서비스 코드는 analyzeEntry를 씀.
 * 예외를 던지지 않음.
 */
export async function analyzeEntryWithModels(
  content: string,
  models: readonly ModelSpec[],
): Promise<{ result: AnalysisResult; attempts: Attempt[] }> {
  const listCrisis = matchesCrisisList(content); // 모델 호출 전에 먼저 검사함
  const attempts: Attempt[] = [];
  const apiKey = process.env.OPENROUTER_API_KEY;

  if (apiKey) {
    for (const spec of models) {
      const t0 = Date.now();
      try {
        const { output, reason } = await callModel(spec, content, apiKey);
        const ms = Date.now() - t0;
        if (output) {
          attempts.push({ model: spec.id, ok: true, ms });
          return {
            result: {
              status: "completed",
              emotion: output.emotion,
              empathyMessage: output.message,
              isCrisis: listCrisis || output.crisis,
              modelUsed: spec.id,
            },
            attempts,
          };
        }
        attempts.push({ model: spec.id, ok: false, ms, reason });
      } catch (e) {
        const timedOut = e instanceof Error && e.name === "TimeoutError";
        attempts.push({
          model: spec.id,
          ok: false,
          ms: Date.now() - t0,
          reason: timedOut ? "timeout" : "network",
        });
      }
    }
  }

  return {
    result: {
      status: "pending",
      emotion: null,
      empathyMessage: null,
      isCrisis: listCrisis,
      modelUsed: null,
    },
    attempts,
  };
}

export async function analyzeEntry(content: string): Promise<AnalysisResult> {
  const { result, attempts } = await analyzeEntryWithModels(content, MODELS);
  if (result.status === "pending") {
    // 이유 분류만 남김. 일기 내용과 응답 원문은 남기지 않음
    console.warn(
      "[ai] 두 모델 모두 실패:",
      attempts.map((a) => `${a.model}=${a.reason ?? "no_key"}`).join(", ") || "no_key",
    );
  }
  return result;
}
