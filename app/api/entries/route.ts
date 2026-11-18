// 2026-11-18 11:55 KST
import { getUserId } from "@/lib/auth/get-user-id";
import { sql } from "@/lib/db/client";
import { insertEntry, listEntries } from "@/lib/db/entries";
import { normalizeContent } from "@/lib/types/content";
import { analyze } from "./analyze";
import { errorResponse, internalError } from "./http";

export async function POST(request: Request) {
  const userId = await getUserId();
  if (!userId) return errorResponse("unauthorized");

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse("invalid_content");
  }
  const raw =
    typeof body === "object" && body !== null
      ? (body as { content?: unknown }).content
      : undefined;
  const content = normalizeContent(raw);
  if (content === null) return errorResponse("invalid_content");

  try {
    const analysis = await analyze(content);
    const entry = await insertEntry(sql, userId, content, analysis);
    return Response.json({ entry }, { status: 201 });
  } catch (err) {
    return internalError("일기 저장", err);
  }
}

export async function GET() {
  const userId = await getUserId();
  if (!userId) return errorResponse("unauthorized");

  try {
    const entries = await listEntries(sql, userId);
    return Response.json({ entries });
  } catch (err) {
    return internalError("일기 조회", err);
  }
}
