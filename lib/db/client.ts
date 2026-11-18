// 2026-11-18 11:22 KST
import "server-only";
import postgres from "postgres";

// Supabase 연결 풀러(트랜잭션 모드)를 쓸 수 있으므로 준비된 문장을 끔(prepare: false).
// 서버리스에서는 인스턴스마다 연결이 늘어나므로 max: 1로 둠.
// 클라이언트는 모듈 범위에서 한 번만 만들고, 연결은 처음 쿼리할 때 맺음.
// 모든 SQL은 dr_diary. 로 시작하는 대상만 가리켜야 함(search_path를 바꾸지 않음).
const url = process.env.DATABASE_URL;
if (!url) {
  throw new Error("DATABASE_URL 환경 변수가 없음");
}

export const sql = postgres(url, {
  prepare: false,
  max: 1,
  ssl: "require",
});
