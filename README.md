# 마음 일기(AI 공감 다이어리)

오늘 있었던 일을 한 줄로 쓰면, AI가 감정을 읽고 공감과 위로의 말을 건네는 일기장임.

- 배포 주소: https://ai-empathy-diary-ch7-261118.vercel.app
- 수업: 바이브 코딩 7장(클로드 코드 AI 에이전트로 개발팀 구성하기) 실습용 앱

## 1. 사용자 설명

### 1.1 할 수 있는 것

- 구글 계정으로 로그인함. 내 일기는 나만 봄
- 오늘 하루를 한 줄(500자 이내)로 씀
- 저장하면 AI가 오늘의 감정(기쁨, 설렘, 평온, 슬픔, 불안, 분노, 외로움, 피로 가운데 하나)과 짧은 공감 메시지를 보여 줌. 최대 30초쯤 걸림
- 「지난 기록」에서 최근 30개의 일기와 감정, 공감 메시지를 다시 봄

### 1.2 이럴 때는

- 「지금은 공감 메시지를 만들지 못했어요」가 보이면, AI가 잠시 응답하지 못한 것임. 일기는 저장되어 있으니 「다시 분석」을 누름
- 「로그인이 풀렸어요」가 보이면 로그아웃했다가 다시 로그인함

### 1.3 힘든 마음이 느껴질 때

- 일기에 힘든 마음이 담겨 있으면, 공감 메시지와 함께 상담할 수 있는 곳을 안내함
  - 자살예방상담전화 109: 24시간
  - 청소년상담 1388: 365일 24시간 무료, 9~24세 청소년과 부모, 보호자
- AI가 응답하지 못한 일기에도 같은 연락처를 부드러운 문구로 함께 보여 줌
- 이 앱은 진단이나 치료를 하지 않으며, 전문 상담을 대신하지 않음. 위급하면 119나 112에 바로 연락함

## 2. 개발자 설명

### 2.1 구성

| 부분 | 쓰는 것 |
|---|---|
| 화면과 서버 | Next.js 16(App Router), React 19, Tailwind CSS 4 |
| 로그인 | Auth.js(next-auth 5 beta), 구글 로그인, JWT 세션 |
| 데이터베이스 | Supabase Postgres의 `dr_diary.dr_entries` 표(`postgres` 라이브러리) |
| AI | OpenRouter 무료 모델 2개(첫 모델 실패 시 둘째 모델) |
| 배포 | Vercel(깃허브 main에 올리면 자동 배포) |

### 2.2 폴더

| 폴더 | 내용 |
|---|---|
| `app/`, `components/` | 화면. 위기 안내 문구와 연락처는 `components/crisis-contacts.ts` 한 곳에 있음 |
| `app/api/entries/` | 일기 저장, 조회, 다시 분석 API |
| `lib/ai/` | AI 호출(`analyzeEntry`), 프롬프트, 위기 표현 목록 |
| `lib/db/`, `lib/auth/`, `lib/types/` | 데이터 접근, 로그인한 사용자 ID, 공유 타입 |
| `db/migrations/` | `dr_diary` 스키마를 만드는 SQL과 되돌리는 SQL |
| `tests/` | 데이터 접근 시험, 위기 표현 목록 시험 |
| `docs/` | 계획서(PLAN), 요구 사항(PRD), 에이전트 간 약속(CONTRACT), QA 보고(`qa/`) |
| `.claude/agents/` | 개발에 쓴 에이전트 5개(product-manager, backend-developer, frontend-developer, ai-integration-specialist, qa-engineer) |

### 2.3 처음 실행하기

1. `npm install`을 실행함
2. `.env.example`을 보고 `.env`를 만들어 변수 5개의 값을 넣음: `DATABASE_URL`(Supabase Transaction pooler 주소), `OPENROUTER_API_KEY`, `AUTH_SECRET`, `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`. `.env`는 깃에 올리지 않음
3. 구글 클라우드의 OAuth 클라이언트(웹 애플리케이션)에 원본 `http://localhost:3000`과 리디렉션 URI `http://localhost:3000/api/auth/callback/google`을 등록함
4. 데이터베이스에 `db/migrations/001_dr_diary.sql`을 한 번 실행함(예: `psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f db/migrations/001_dr_diary.sql`). 다른 스키마는 건드리지 않음
5. `npm run dev`로 띄우고 http://localhost:3000 을 엶

### 2.4 명령

| 명령 | 하는 일 |
|---|---|
| `npm run dev` | 개발 서버(3000번 포트) |
| `npm test` | 시험(데이터 접근 시험은 실제 데이터베이스에 접속하고 롤백함) |
| `npx eslint .`, `npx tsc --noEmit` | 린트, 타입 검사 |
| `npm run build` | 배포용 빌드. 개발 서버를 끈 뒤 돌림 |

### 2.5 배포

- Vercel에서 이 깃허브 저장소를 가져오고, 환경 변수 5개를 넣음(`.env.example`의 이름만. 쓰지 않는 변수는 빼고, 비밀 값은 「Secret」 종류로 저장함)
- 구글 OAuth 클라이언트에 배포 주소의 원본과 리디렉션 URI(`https://배포 주소/api/auth/callback/google`)를 더함
- 확인: 배포 주소의 첫 화면 200, `/api/auth/providers` 200, 로그인하지 않은 `/api/entries` 401

### 2.6 주의할 점

- 개발 규칙은 `CLAUDE.md`에 있음. 특히 데이터베이스는 `dr_diary` 스키마만 쓰고, 사용자 ID는 구글 계정 ID를 쓰며, 위기 표현 목록은 좁히지 않음
- 무료 모델은 시간 초과나 형식 오류를 자주 냄. 그때 일기는 「분석 대기」로 저장되고 「다시 분석」으로 회복함
- 알려진 남은 문제는 `docs/PLAN.md` 8장과 `docs/qa/recheck3.md`에 있음(예: 위기 표현의 흔한 변형 일부를 목록이 놓침, 일상 문장에 위기 안내가 붙는 오탐)
