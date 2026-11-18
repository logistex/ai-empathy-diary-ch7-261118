// 2026-11-18 11:55 KST
import { getUserId } from "@/lib/auth/get-user-id";
import { sql } from "@/lib/db/client";
import { findEntry, updateAnalysis } from "@/lib/db/entries";
import { analyze } from "../../analyze";
import { errorResponse, internalError } from "../../http";

const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(
  _request: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const userId = await getUserId();
  if (!userId) return errorResponse("unauthorized");

  const { id } = await ctx.params;
  if (!UUID.test(id)) return errorResponse("invalid_content");

  try {
    const entry = await findEntry(sql, userId, id);
    if (!entry) return errorResponse("not_found");
    if (entry.analysisStatus === "completed") return Response.json({ entry });

    const analysis = await analyze(entry.content);
    const updated = await updateAnalysis(sql, userId, id, analysis);
    if (!updated) return errorResponse("not_found");
    return Response.json({ entry: updated });
  } catch (err) {
    return internalError("다시 분석", err);
  }
}
