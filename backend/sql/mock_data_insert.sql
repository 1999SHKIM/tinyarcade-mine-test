-- =====================================================================
-- 목 데이터 넣기 (03_17 결정 ⑤, RANK-F14, 01 Part E)
--
-- [참고] 왜 목 데이터가 필요한가
-- - 유저 랭킹 계수는 "이번 주에 활동한 앱들 사이에서의 순위"로 정해진다(01 D2).
--   앱이 2~3개뿐이면 순위가 극단적으로 갈려 포인트가 크게 튄다.
-- - 비교 대상 앱을 늘려서 시연할 때 포인트가 자연스럽게 나오게 한다.
--
-- [참고] 무엇을 넣나
-- - 목 유저 50명: 이메일 mockNN@mock.tinyarcade, 닉네임 목유저NN, 비밀번호 없음 → 로그인 불가
-- - 목 앱 10개: 제목 "목 앱 NN", 승인 상태. 실행되는 게임이 없어서 일반 앱 목록에는 안 나온다(17번)
-- - 지난 4주(이번 주 제외) 제출 기록: 앱마다 주에 (4 + 앱번호 + 주번호)건 → 모두 480건
-- - 추천: 앱 NN에 추천 NN×3개, 비추천 2개 (앱마다 크기가 다르게)
-- - 목 유저는 목 앱에서만 플레이·추천한다 → 실제 앱의 숫자는 바뀌지 않는다(01 D1)
--
-- [참고] 쓰는 방법
-- - 로컬: psql -h localhost -U <유저> -d <DB이름> -f backend/sql/mock_data_insert.sql
--   (또는 IntelliJ·DBeaver 같은 DB 도구에서 이 파일 내용을 그대로 실행)
-- - 배포 DB(Neon): Neon 콘솔의 SQL Editor에 붙여 넣고 실행
-- - 넣은 뒤 관리자 화면에서 목데이터 토글을 켜고 지난주를 재마감하면, 목 앱이 비교 대상에 들어간다.
--   토글이 꺼져 있으면 목 앱은 계산에서 빠진다(넣어 두기만 하면 아무 영향 없음).
-- - 한 번만 실행한다. 두 번 실행하면 이메일 중복 오류로 전체가 취소된다(begin~commit 묶음).
-- - 지우기: mock_data_delete.sql
-- =====================================================================

begin;

-- 1) 목 유저 50명 (password_hash 없음 = 로그인할 수 없는 계정)
insert into users (email, nickname, password_hash, role, status, is_mock, created_at, updated_at)
select format('mock%s@mock.tinyarcade', lpad(n::text, 2, '0')),
       format('목유저%s', lpad(n::text, 2, '0')),
       null, 'USER', 'ACTIVE', true, now(), now()
  from generate_series(1, 50) as n;

-- 2) 목 앱 10개 (크리에이터는 목유저01~10)
insert into apps (creator_id, title, description, repo_url, commit_sha, entry_path, deploy_key,
                  status, is_official, is_mock, current_season,
                  recommend_count, not_recommend_count, play_count, approved_at, created_at, updated_at)
select u.id,
       format('목 앱 %s', lpad(n::text, 2, '0')),
       '랭킹 비교용 목 앱 (실행되는 게임 없음)',
       'https://github.com/tinyarcade/mock-app', repeat('0', 40), 'index.html', gen_random_uuid(),
       'APPROVED', false, true, 1,
       0, 0, 0, now(), now(), now()
  from generate_series(1, 10) as n
  join users u on u.email = format('mock%s@mock.tinyarcade', lpad(n::text, 2, '0'));

-- 3) 지난 4주 제출 기록
--   app_no: 앱 번호(1~10), week_no: 몇 주 전(1~4), k: 그 주의 몇 번째 기록
--   - 기록 수: 4 + app_no + week_no → 번호가 큰 앱일수록 붐빈다
--   - 플레이한 유저: 번호를 섞는 식으로 골라 앱·주마다 참여자 수가 다르게 나온다
--   - 제출 시각: 그 주 월요일 0시(KST) + 0~6일 + 0~23시간
insert into play_sessions (id, app_id, user_id, season, status, verify_status, score,
                           started_at, submitted_at, created_at)
select gen_random_uuid(), a.id, u.id, 1, 'SUBMITTED', 'NORMAL',
       ((app_no * 131 + week_no * 17 + k * 53) % 900) + 100,
       t.submitted_at - interval '2 minutes',
       t.submitted_at,
       t.submitted_at
  from generate_series(1, 10) as app_no
  join apps a on a.title = format('목 앱 %s', lpad(app_no::text, 2, '0')) and a.is_mock = true
 cross join generate_series(1, 4) as week_no
 cross join lateral generate_series(1, 4 + app_no + week_no) as k
  join users u on u.email = format('mock%s@mock.tinyarcade', lpad((((app_no * 7 + week_no * 13 + k * 3) % 50) + 1)::text, 2, '0'))
 cross join lateral (
       select (date_trunc('week', now() at time zone 'Asia/Seoul')
               - make_interval(weeks => week_no)
               + make_interval(days => (k * 5 + app_no) % 7, hours => (k * 7 + app_no) % 24)
              ) at time zone 'Asia/Seoul' as submitted_at
       ) t;

-- 4) 추천·비추천: 앱 NN에 추천 NN×3명(목유저01부터), 비추천 2명(그 다음 번호)
insert into app_votes (app_id, user_id, vote_type, created_at, updated_at)
select a.id, u.id,
       case when v <= app_no * 3 then 'RECOMMEND' else 'NOT_RECOMMEND' end,
       now(), now()
  from generate_series(1, 10) as app_no
  join apps a on a.title = format('목 앱 %s', lpad(app_no::text, 2, '0')) and a.is_mock = true
 cross join lateral generate_series(1, app_no * 3 + 2) as v
  join users u on u.email = format('mock%s@mock.tinyarcade', lpad(v::text, 2, '0'));

-- 5) 앱의 숫자 칸을 실제 기록 수에 맞춘다 (추천 수·비추천 수·플레이 수)
update apps a
   set recommend_count     = (select count(*) from app_votes v where v.app_id = a.id and v.vote_type = 'RECOMMEND'),
       not_recommend_count = (select count(*) from app_votes v where v.app_id = a.id and v.vote_type = 'NOT_RECOMMEND'),
       play_count          = (select count(*) from play_sessions s where s.app_id = a.id)
 where a.is_mock = true;

commit;

-- 확인용: 목 유저 50 / 목 앱 10 / 제출 기록 480 / 추천 165 / 비추천 20
-- select (select count(*) from users where is_mock) as mock_users,
--        (select count(*) from apps where is_mock) as mock_apps,
--        (select count(*) from play_sessions s join apps a on a.id = s.app_id where a.is_mock) as sessions,
--        (select sum(recommend_count) from apps where is_mock) as recommends,
--        (select sum(not_recommend_count) from apps where is_mock) as not_recommends;
