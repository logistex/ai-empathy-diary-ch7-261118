-- 2026-11-18 11:22 KST
-- 001_dr_diary.sql을 되돌림. dr_diary 안의 대상만 지움
-- CASCADE를 쓰지 않으므로 dr_diary에 다른 대상이 남아 있으면 스키마 삭제가 실패함

begin;

drop index dr_diary.dr_entries_user_created_idx;
drop table dr_diary.dr_entries;
drop schema dr_diary;

commit;
