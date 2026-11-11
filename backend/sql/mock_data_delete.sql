-- =====================================================================
-- 목 데이터 지우기 (03_17 RANK-F14). mock_data_insert.sql로 넣은 것을 모두 지운다.
--
-- [참고] 지우는 순서
-- 1) 목 앱 삭제 → 그 앱의 제출 기록·추천·썸네일은 DB 규칙(ON DELETE CASCADE)으로 함께 지워진다.
-- 2) 목 유저 삭제 → 목 유저는 목 앱에서만 플레이·추천했으므로 1)에서 남은 것이 없다.
--
-- [참고] 지워지지 않는 것
-- - 이미 만들어진 1등 기록(first_place_records)은 그대로 둔다. 목 앱은 1등 기록이 없고(01 C3),
--   실제 앱 기록의 mock_included = true(그때 목 앱도 비교했다는 표시)는 당시 값을 보존하는 것이 규칙이다(01 E).
-- - 목데이터 토글(system_settings)도 그대로다. 필요하면 관리자 화면에서 끈다.
--
-- [참고] 쓰는 방법: mock_data_insert.sql과 같다 (psql -f 또는 DB 도구 / Neon SQL Editor)
-- =====================================================================

begin;

delete from apps where is_mock = true;
delete from users where is_mock = true;

commit;

-- 확인용: 모두 0이어야 한다
-- select (select count(*) from users where is_mock) as mock_users,
--        (select count(*) from apps where is_mock) as mock_apps;
