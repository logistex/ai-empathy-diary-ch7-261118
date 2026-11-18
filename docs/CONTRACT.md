<!-- 2026-11-18 11:22 KST -->
# AI 공감 다이어리 공통 약속(CONTRACT)

- 목적: 2단계에서 backend-developer, ai-integration-specialist, frontend-developer가 서로의 폴더를 건드리지 않고 동시에 일함
- 근거: `docs/PRD.md`(2026-11-18 승인), `docs/PLAN.md` 4.1절(1단계: 뼈대), 4.2절(2단계)
- 이 문서를 바꾸려면 바꾸는 쪽이 이유와 영향받는 담당자를 이 문서 8장(변경 기록)에 적음
- 타입의 원본은 `lib/types/entry.ts`임. 이 문서와 다르면 이 문서가 맞고, 타입 파일을 고침

## 1. 폴더별 담당

| 담당 | 폴더와 파일 | 비고 |
|---|---|---|
| backend-developer | `app/api/`, `lib/db/`, `lib/auth/`, `lib/types/`, `db/`, `auth.ts`, `proxy.ts`(만들 경우) | 인증, 데이터베이스, 마이그레이션, API |
| ai-integration-specialist | `lib/ai/` | OpenRouter 호출, 프롬프트, 위기 표현 목록 |
| frontend-developer | `app/`(단 `app/api/` 제외), `components/`, `public/` | 화면과 컴포넌트 |

- 2단계에서는 각자 자기 폴더만 고침. 다른 폴더의 변경이 필요하면 이 문서에 요청을 적고 담당자가 고침
- 공통 파일(`package.json`, `.env.example`, `docs/`)은 새 의존성이나 변수가 필요할 때만 최소한으로 고치고 보고에 밝힘
- 비밀 값은 서버에서만 읽음. `DATABASE_URL`과 `OPENROUTER_API_KEY`는 화면 쪽 코드에서 읽지 않음. 일기 내용을 로그에 남기지 않음

## 2. API

- 모든 API는 JSON이며 `Content-Type: application/json`임
- 모든 API는 서버에서 세션의 사용자 ID(`getUserId()`, `lib/auth/get-user-id.ts`)로만 일기를 거름. 요청에 사용자 ID를 담지 않으며, 담겨 와도 무시함
- 로그인하지 않았으면 모든 API가 401을 돌려줌

### 2.1 공통 형식

일기 1건(`Entry`):

```json
{
  "id": "6f1c3a52-0c1e-4b0e-9d52-3f6f6a1d2c11",
  "content": "오늘은 발표가 잘 끝나서 마음이 가벼웠다.",
  "emotion": "기쁨",
  "empathyMessage": "발표를 잘 마치셨군요. 그동안 준비한 시간이 보람으로 돌아온 것 같아요. 오늘은 충분히 뿌듯해하셔도 좋아요.",
  "isCrisis": false,
  "modelUsed": "nvidia/nemotron-3-ultra-550b-a55b:free",
  "analysisStatus": "completed",
  "createdAt": "2026-11-18T02:30:00.000Z"
}
```

- `emotion`, `empathyMessage`, `modelUsed`는 `analysisStatus`가 `"pending"`이면 `null`임
- `analysisStatus`: `"completed"`(분석 완료) 또는 `"pending"`(분석 대기. 두 모델이 모두 실패함. PRD 10.2절 안 A)
- `isCrisis`: 위기 표현 목록과 모델 판정 중 하나라도 위기이면 `true`. `pending`이어도 목록에서 검출되면 `true`
- `createdAt`: 서버가 기록한 UTC 시각(ISO 8601). 화면에서 한국 시각으로 바꿔 보여 줌
- 열 이름은 데이터베이스에서는 snake_case(`empathy_message`), API에서는 camelCase(`empathyMessage`)임. 변환은 backend-developer가 함

오류 응답(모든 오류 공통):

```json
{ "error": { "code": "invalid_content", "message": "일기는 1자 이상 500자 이하로 써 주세요." } }
```

- `message`는 사용자에게 그대로 보여 줘도 되는 한국어 문장임. 내부 정보(스택, SQL, 비밀 값)를 담지 않음
- `code`: `invalid_content`, `unauthorized`, `not_found`, `internal_error`

### 2.2 일기 저장: `POST /api/entries`

- 요청: `{ "content": "일기 내용" }`
- 서버는 앞뒤 공백을 지운 뒤 검사하고, 지운 값을 저장함. 길이는 유니코드 코드 포인트 수로 셈(`[...content].length`). 이모지 1개는 1자임. 데이터베이스의 `char_length`와 같은 기준임
- 처리 순서(3단계에서 통합): 검사 → AI 모듈 `analyzeEntry` 호출 → 결과와 함께 한 번에 저장 → 응답. 2단계에서는 backend-developer가 AI 모듈 대신 `pending` 결과를 돌려주는 임시 코드로 저장까지 시험함
- 성공: `201`, `{ "entry": Entry }`. 두 모델이 모두 실패해도 일기를 저장하고 `201`로 `analysisStatus: "pending"`을 돌려줌(오류가 아님)

| 상태 | code | 조건 |
|---|---|---|
| 201 | | 저장됨 |
| 400 | `invalid_content` | JSON이 아님, `content`가 문자열이 아님, 공백을 지운 뒤 0자, 500자 초과 |
| 401 | `unauthorized` | 로그인하지 않음 |
| 500 | `internal_error` | 데이터베이스 오류 등. 일기가 저장되지 않았음 |

### 2.3 지난 기록 조회: `GET /api/entries`

- 요청 본문과 쿼리 없음. 로그인한 사용자 본인의 일기 중 최근 30건을 `createdAt` 내림차순으로 돌려줌. 페이지 넘기기와 검색은 없음
- 성공: `200`, `{ "entries": Entry[] }`. 0건이면 `{ "entries": [] }`

| 상태 | code | 조건 |
|---|---|---|
| 200 | | 조회됨(0건 포함) |
| 401 | `unauthorized` | 로그인하지 않음 |
| 500 | `internal_error` | 데이터베이스 오류 |

### 2.4 다시 분석: `POST /api/entries/{id}/reanalyze`

- 요청 본문 없음. `analysisStatus`가 `"pending"`인 본인의 일기에 AI 분석을 다시 요청하고, 같은 행을 갱신함(일기 내용은 바꾸지 않음)
- 성공: `200`, `{ "entry": Entry }`. 다시 분석도 실패하면 `analysisStatus: "pending"` 그대로 `200`을 돌려줌. 이미 `"completed"`인 일기는 분석하지 않고 그대로 `200`을 돌려줌
- 다른 사용자의 일기 ID와 없는 ID는 구분하지 않고 같은 `404`를 돌려줌(남의 일기가 있는지 알려 주지 않기 위함)

| 상태 | code | 조건 |
|---|---|---|
| 200 | | 분석함 또는 이미 완료 |
| 400 | `invalid_content` | `id`가 UUID 형식이 아님 |
| 401 | `unauthorized` | 로그인하지 않음 |
| 404 | `not_found` | 없는 ID이거나 다른 사용자의 일기 |
| 500 | `internal_error` | 데이터베이스 오류 |

### 2.5 만들지 않는 API

- 일기 수정과 삭제, 단건 조회, 검색, 공유(PRD 9장). 지난 기록 화면은 `GET /api/entries`의 결과만 씀

## 3. AI 모듈(`lib/ai/`)

- 담당: ai-integration-specialist. 서버 전용이며 화면 쪽 코드에서 가져오지 않음
- 진입점은 `lib/ai/index.ts`가 내보내는 함수 1개임

```ts
import type { AnalysisResult } from "@/lib/types/entry";

export function analyzeEntry(content: string): Promise<AnalysisResult>;
```

- 입력: 검사를 마친 일기 내용(앞뒤 공백 제거, 1~500자)
- 출력: `AnalysisResult`(`lib/types/entry.ts`)
  - 성공: `{ status: "completed", emotion, empathyMessage, isCrisis, modelUsed }`
  - 두 모델 실패: `{ status: "pending", emotion: null, empathyMessage: null, isCrisis, modelUsed: null }`
- 예외를 던지지 않음. 모든 실패는 `status: "pending"`으로 돌려줌. 이유: 일기 저장이 분석 실패 때문에 막히지 않아야 함(PRD 4.5절)
- `isCrisis`는 항상 `위기 표현 목록 판정 OR 모델 판정`임. 위기 표현 목록은 모델 호출 전에 먼저 검사하고, 모델이 모두 실패해도 그 결과를 돌려줌
- 호출 순서와 시간 제한(PRD 6.1절, 10.1절 안 A)
  1. 첫 모델 `nvidia/nemotron-3-ultra-550b-a55b:free`, 시간 제한 15초
  2. 실패하면 둘째 모델 `nvidia/nemotron-3.5-super-vl:free`, 시간 제한 10초
  3. 둘 다 실패하면 `pending`
  - 모델 ID와 시간 제한은 `lib/ai/` 안의 한 곳에 상수로 둠. 키는 서버에서 `OPENROUTER_API_KEY`로만 읽음
- 실패의 정의(PRD 6.2절에서 옮김, 가정): 아래 3가지를 실패로 보고 다음 모델로 넘어감
  - 시간 제한 안에 응답이 없음
  - OpenRouter가 오류 응답을 돌려줌(호출 한도 초과 포함)
  - 응답이 비어 있거나 감정, 공감 메시지를 꺼낼 수 없는 형식임
  - 최종 확정은 2단계에서 ai-integration-specialist가 함. 확정하면 이 문서를 고치고 8장에 적음
- 일기 내용과 모델 응답 원문을 로그에 남기지 않음

### 3.1 감정 단어 목록(안)

- 상태: 안임. 2단계에서 ai-integration-specialist가 확정함
- 8개: 기쁨, 설렘, 평온, 슬픔, 불안, 분노, 외로움, 피로
- 모델이 목록 밖의 단어를 내면 실패로 보고 다음 모델로 넘어가거나, 가장 가까운 단어로 바꿈. 어느 쪽인지는 ai-integration-specialist가 정함
- 확정하면 `lib/types/entry.ts`의 `EMOTIONS`를 backend-developer가 같은 목록으로 고침

### 3.2 공감 메시지 길이(안)

- 상태: 안임. 2단계에서 ai-integration-specialist가 확정함
- 한국어 존댓말, 1~3문장, 150자 이내
- 진단, 처방, 약물 안내를 넣지 않음(PRD 4.3절)

## 4. 위기 안내와 상담 연락처

- 근거: PRD 10.3절 안 A(2026-11-18 승인)

| 이름 | 번호 | 안내 문구에 밝힐 것 |
|---|---|---|
| 자살예방상담전화 | 109 | 24시간 상담. 출처: 보건복지부 보도자료(2025-01-09) |
| 청소년상담 | 1388 | 365일 24시간 무료. 대상은 9~24세 청소년과 그 부모와 보호자 |

- 연락처는 API가 돌려주지 않음. 화면이 `isCrisis`가 `true`인 일기에 위 연락처를 함께 보여 줌(지난 기록에서 해당 기록을 다시 열 때도 보임)
- 번호와 문구는 frontend-developer가 한 곳(상수 1개)에 둠. 4단계에서 qa-engineer가 공식 자료와 대조함
- 위기 표시 때문에 일기 저장이 막히지 않음

## 5. 데이터베이스

- 스키마 `dr_diary`, 표 `dr_diary.dr_entries`. 정의는 `db/migrations/001_dr_diary.sql`
- 앱이 실행하는 모든 SQL은 `dr_diary.`로 시작하는 대상만 가리킴. 기존 `diary` 스키마와 다른 스키마를 건드리지 않음. `search_path`를 바꾸지 않음
- 연결은 `lib/db/client.ts`의 `sql`을 씀(`postgres` 라이브러리, 준비된 문장 끔, 연결 1개). 값은 태그드 템플릿으로 넣어 파라미터로 보냄(문자열 이어붙이기 금지)
- `user_id`는 구글 계정 고유 ID(구글 `sub`)이며, 세션의 `session.user.id`로 얻음
- 열(`dr_entries`): `id`(uuid), `user_id`(text), `content`(text, 1~500자 검사), `emotion`, `empathy_message`, `is_crisis`(boolean, 기본 false), `model_used`, `created_at`(timestamptz, 기본 now()), `analysis_status`(`completed` 또는 `pending`, 기본 `pending`)
- 마이그레이션은 신 교수의 승인 뒤에만 실행함. 되돌리는 SQL은 `001_dr_diary.down.sql`

## 6. 화면(frontend-developer)

- 2단계에서는 API 대신 가짜 데이터로 만들고, 가짜 데이터의 모양은 2.1절의 `Entry`와 같게 함. 3단계에서 실제 API로 바꿈
- 3개 화면: 일기 쓰기, 결과 보기, 지난 기록 보기. 로그인하지 않은 사용자에게는 구글 로그인 버튼을 보임
- 로그인과 로그아웃은 `@/auth`의 `signIn("google")`과 `signOut()`을 씀(현재 `app/page.tsx` 참고). 화면에서 세션 확인은 서버 컴포넌트의 `auth()`로 함
- 화면 쪽 코드(`"use client"`)에서 `DATABASE_URL`, `OPENROUTER_API_KEY`, `lib/db/`, `lib/ai/`를 가져오지 않음

## 7. 환경 변수

- 이름만 적음. 값은 `.env`에 있으며 열지 않음. 예시 파일은 `.env.example`
- `DATABASE_URL`, `OPENROUTER_API_KEY`, `AUTH_SECRET`, `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`

## 8. 변경 기록

- 2026-11-18: 1단계에서 backend-developer가 처음 씀
