-- 2026-11-18 11:22 KST
-- AI 공감 다이어리: dr_diary 스키마와 dr_diary.dr_entries 표를 만듦(PRD 5.2절)
-- 모든 문장은 dr_diary. 로 시작하는 대상만 가리킴. 다른 스키마를 건드리지 않고 search_path를 바꾸지 않음
-- 스키마가 이미 있으면 실패하도록 IF NOT EXISTS를 쓰지 않음(남의 스키마를 덮지 않기 위함)

begin;

create schema dr_diary;

create table dr_diary.dr_entries (
  id               uuid        primary key default gen_random_uuid(),
  user_id          text        not null,
  content          text        not null
                     constraint dr_entries_content_length
                     check (char_length(content) between 1 and 500)
                     constraint dr_entries_content_not_blank
                     check (content ~ '[^[:space:]]'),
  emotion          text,
  empathy_message  text,
  is_crisis        boolean     not null default false,
  model_used       text,
  created_at       timestamptz not null default now(),
  analysis_status  text        not null default 'pending'
                     constraint dr_entries_analysis_status
                     check (analysis_status in ('completed', 'pending'))
);

comment on column dr_diary.dr_entries.user_id is '구글 계정 고유 ID(Auth.js 세션의 user.id, 구글 sub)';
comment on column dr_diary.dr_entries.analysis_status is 'completed: 분석 완료, pending: 분석 대기(두 모델 실패 등)';

-- 사용자별 최신순 조회용
create index dr_entries_user_created_idx
  on dr_diary.dr_entries (user_id, created_at desc);

commit;
