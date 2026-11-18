// 2026-11-18 11:55 KST
// dr_diary.dr_entries 데이터 접근 함수. 모든 조회와 갱신은 user_id로 거름.
// 연결(db)을 인자로 받음: 앱은 client.ts의 sql을, 시험은 롤백할 트랜잭션을 넘김.
// 이 파일은 server-only를 가져오지 않으므로 node에서 그대로 가져올 수 있음(연결은 client.ts에만 있음).
import type postgres from "postgres";
import type { AnalysisResult, Entry } from "../types/entry";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Db = postgres.Sql<any> | postgres.TransactionSql<any>;

interface EntryRow {
  id: string;
  content: string;
  emotion: string | null;
  empathy_message: string | null;
  is_crisis: boolean;
  model_used: string | null;
  analysis_status: string;
  created_at: Date;
}

function toEntry(row: EntryRow): Entry {
  return {
    id: row.id,
    content: row.content,
    emotion: row.emotion as Entry["emotion"],
    empathyMessage: row.empathy_message,
    isCrisis: row.is_crisis,
    modelUsed: row.model_used,
    analysisStatus: row.analysis_status as Entry["analysisStatus"],
    createdAt: row.created_at.toISOString(),
  };
}

export async function insertEntry(
  db: Db,
  userId: string,
  content: string,
  analysis: AnalysisResult,
): Promise<Entry> {
  const [row] = await db<EntryRow[]>`
    insert into dr_diary.dr_entries
      (user_id, content, emotion, empathy_message, is_crisis, model_used, analysis_status)
    values
      (${userId}, ${content}, ${analysis.emotion}, ${analysis.empathyMessage},
       ${analysis.isCrisis}, ${analysis.modelUsed}, ${analysis.status})
    returning id, content, emotion, empathy_message, is_crisis, model_used,
              analysis_status, created_at`;
  return toEntry(row);
}

export async function listEntries(
  db: Db,
  userId: string,
  limit = 30,
): Promise<Entry[]> {
  const rows = await db<EntryRow[]>`
    select id, content, emotion, empathy_message, is_crisis, model_used,
           analysis_status, created_at
    from dr_diary.dr_entries
    where user_id = ${userId}
    order by created_at desc, id desc
    limit ${limit}`;
  return rows.map(toEntry);
}

// 본인 일기 1건. 없는 ID와 남의 일기를 구분하지 않고 null을 돌려줌.
export async function findEntry(
  db: Db,
  userId: string,
  id: string,
): Promise<Entry | null> {
  const [row] = await db<EntryRow[]>`
    select id, content, emotion, empathy_message, is_crisis, model_used,
           analysis_status, created_at
    from dr_diary.dr_entries
    where id = ${id} and user_id = ${userId}`;
  return row ? toEntry(row) : null;
}

// 분석 결과만 갱신함(일기 내용은 바꾸지 않음). 본인 일기가 아니면 null.
export async function updateAnalysis(
  db: Db,
  userId: string,
  id: string,
  analysis: AnalysisResult,
): Promise<Entry | null> {
  const [row] = await db<EntryRow[]>`
    update dr_diary.dr_entries
    set emotion = ${analysis.emotion},
        empathy_message = ${analysis.empathyMessage},
        is_crisis = ${analysis.isCrisis},
        model_used = ${analysis.modelUsed},
        analysis_status = ${analysis.status}
    where id = ${id} and user_id = ${userId}
    returning id, content, emotion, empathy_message, is_crisis, model_used,
              analysis_status, created_at`;
  return row ? toEntry(row) : null;
}
