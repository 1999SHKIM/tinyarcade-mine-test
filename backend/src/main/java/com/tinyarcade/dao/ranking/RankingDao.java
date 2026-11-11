package com.tinyarcade.dao.ranking;

import com.tinyarcade.service.leaderboard.WeekRange;
import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Repository;

/**
 * 주간 마감에 쓰는 SQL (01_core_logic_ranking C2·C3·D1, 03_17 §2 마감 절차).
 *
 * [참고] 이 클래스가 하는 일 (마감 순서대로)
 * - lockWeek(): 같은 주차 마감이 겹치지 않게 이름표 잠금을 건다 (마감 2단계)
 * - approvePending(): 그 주 "검증 중" 기록을 인정으로 바꾼다 (마감 3단계)
 * - population(): 비교 대상 앱들의 추천 수·참여자 수를 구한다 (마감 6단계)
 * - findFirstPlace(): 앱 하나의 주간 1등을 고른다 (마감 7단계)
 * - findRecords(): 저장된 1등 기록을 읽는다 (유저 랭킹 조회, RankingService)
 * - 기존 기록 삭제(마감 5단계)는 FirstPlaceRecordRepository.deleteLiveRecords()가 한다.
 *
 * [참고] 왜 JPA가 아니라 SQL로 쓰나
 * - "앱별로 묶어서 서로 다른 유저 수 세기", "조건 여러 개로 거른 뒤 정렬해서 1건" 같은 집계는 SQL이 가장 짧고 읽기 쉽다.
 * - 15번 LeaderboardDao와 같은 방식(NamedParameterJdbcTemplate, :이름 자리에 값 바인딩)이다.
 *   값은 SQL 글자에 이어 붙이지 않고 따로 넘기므로 SQL 인젝션이 생기지 않는다.
 *
 * [참고] 시즌 조건을 넣지 않은 이유
 * - MVP는 시즌 1개뿐이고 시즌 랭킹은 다음 버전으로 미뤘다(03_17 범위 밖). 그래서 주간 범위만 본다.
 */
@Repository
@RequiredArgsConstructor
public class RankingDao {

    private final NamedParameterJdbcTemplate jdbc;

    /*
     * [참고] 결과를 담는 작은 클래스 (AppStat, FirstPlace)
     * - SQL 결과 한 줄을 담아 서비스로 넘기는 그릇이다. 값을 담기만 하고 바꾸지 않으므로 필드를 final로 둔다.
     * - `@Getter`: getAppId() 같은 꺼내는 메서드를 만들어 준다.
     * - `@AllArgsConstructor`: 필드 전부를 받는 생성자 new AppStat(1L, "제목", ...)를 만들어 준다.
     * - static: RankingDao 객체 없이도 RankingDao.AppStat으로 바로 쓸 수 있게 한다(바깥 클래스와 독립된 그릇).
     */

    /** 비교 대상(모집단) 앱 한 개의 값 */
    @Getter
    @AllArgsConstructor
    public static class AppStat {
        private final Long appId;
        private final String title;
        private final boolean mock;
        private final int recommendCount;   // 앱의 누적 추천 수
        private final int participants;     // 그 주에 제출한 서로 다른 유저 수
    }

    /** 앱 하나의 주간 1등 */
    @Getter
    @AllArgsConstructor
    public static class FirstPlace {
        private final Long userId;
        private final String nickname;
    }

    /**
     * 같은 주차 마감을 한 줄로 세운다 (결정 ②, 01 C2-2).
     *
     * [참고] advisory lock (이름표 잠금)
     * - 테이블의 행이 아니라 PostgreSQL에 "이름표"(숫자)를 거는 잠금이다. hashtext()로 주차 키 글자를 숫자로 바꿔 이름표로 쓴다.
     * - 같은 이름표를 다른 요청이 걸려고 하면 먼저 건 쪽이 끝날 때까지 기다린다 → 같은 주차 마감이 동시에 돌지 않는다.
     * - pg_advisory_xact_lock의 xact = 트랜잭션. 트랜잭션이 끝나면(성공·실패 모두) 저절로 풀린다 → 푸는 코드가 필요 없다.
     *   그래서 반드시 `@Transactional` 메서드 안에서 불러야 한다(트랜잭션 밖이면 SQL 한 줄 끝나자마자 풀려 버림).
     * - 이름표가 다르면 서로 기다리지 않는다(W45 마감과 W44 재마감은 동시에 가능, 일반 플레이도 영향 없음).
     * - 16번 SELECT … FOR UPDATE(행 잠금)는 잠글 행이 있어야 한다. 처음 마감하는 주차는 기록 행이 없어서 이름표 방식을 썼다.
     */
    public void lockWeek(String periodKey) {
        String sql = "select pg_advisory_xact_lock(hashtext(:key))";
        // 이 함수는 돌려주는 값이 없어서(void) 결과는 읽지 않고 실행만 한다
        jdbc.query(sql, new MapSqlParameterSource("key", periodKey), rs -> {
        });
    }

    /**
     * 그 주 "검증 중"(PENDING) 제출 기록을 "인정"(APPROVED)으로 바꾼다 (01 C2-3).
     * 관리자가 마감 전까지 삭제하지 않은 기록은 인정한다는 규칙이다.
     *
     * @return 바뀐 기록 수
     */
    public int approvePending(WeekRange week) {
        String sql = """
                update play_sessions
                   set verify_status = 'APPROVED'
                 where status = 'SUBMITTED'
                   and verify_status = 'PENDING'
                   and submitted_at >= :weekStart
                   and submitted_at < :weekEnd
                """;
        return jdbc.update(sql, weekParams(week));
    }

    /**
     * 비교 대상(모집단) 앱들과 각 앱의 추천 수·참여자 수 (01 D1 분포 모집단).
     *
     * [참고] 모집단 조건
     * - 그 주에 제출 기록이 1건 이상 있고, 지금 존재하는 승인(APPROVED) 앱. 삭제된 앱은 행이 없으니 저절로 빠진다.
     * - includeMock이 false(목데이터 토글 OFF)면 목 앱을 뺀다. true면 목 앱도 비교 대상에 넣는다.
     *
     * [참고] 두 값의 뜻
     * - 추천 수: 앱의 누적 추천 수(apps.recommend_count). 마감하는 그 순간의 값이다.
     * - 참여자 수: 그 주에 제출한 "서로 다른 유저" 수(count distinct). 한 사람이 10번 해도 1명.
     *   1등 자격과 달리 크리에이터 본인·정지·탈퇴 유저도 센다(01 D1, "그 주에 얼마나 붐볐나"를 나타내는 값).
     */
    public List<AppStat> population(WeekRange week, boolean includeMock) {
        String mockCondition = includeMock ? "" : "and a.is_mock = false";
        String sql = """
                select a.id, a.title, a.is_mock, a.recommend_count,
                       count(distinct ps.user_id) as participants
                  from apps a
                  join play_sessions ps on ps.app_id = a.id
                 where a.status = 'APPROVED'
                   %s
                   and ps.status = 'SUBMITTED'
                   and ps.submitted_at >= :weekStart
                   and ps.submitted_at < :weekEnd
                 group by a.id, a.title, a.is_mock, a.recommend_count
                 order by a.id
                """.formatted(mockCondition);
        // %s에는 위에 적힌 정해진 글자만 들어간다(사용자 입력 아님)
        return jdbc.query(sql, weekParams(week), (rs, i) -> new AppStat(
                rs.getLong("id"),
                rs.getString("title"),
                rs.getBoolean("is_mock"),
                rs.getInt("recommend_count"),
                rs.getInt("participants")));
    }

    /**
     * 앱 하나의 주간 1등 (01 C3). 조건에 맞는 기록이 없으면 비어 있음(그 앱은 이번 주 1등 없음).
     *
     * [참고] 1등 자격 조건
     * - 그 주에 제출(SUBMITTED)한 기록. 검증 상태는 거르지 않는다(마감 때는 앞에서 PENDING이 APPROVED로 바뀌고,
     *   미리보기 때는 PENDING 그대로 포함 = "인정한 것으로 보고" 계산).
     * - 크리에이터 본인 기록은 제외 (내 게임에서 내가 1등 하는 것 방지)
     * - 지금 ACTIVE인 유저만 (정지·탈퇴 유저 제외)
     * - 목 유저 제외
     *
     * [참고] 정렬 (앱 리더보드와 같은 순서, 01 B2)
     * - 점수 높은 순 → 먼저 제출한 순 → 세션 번호 순. 세 번째 기준 덕분에 1등이 항상 한 명으로 정해진다.
     * - 리더보드 화면 결과를 재사용하지 않고 따로 조회한다. 그래서 리더보드 1위(예: 크리에이터 본인)와 주간 1등이 다를 수 있다.
     */
    public Optional<FirstPlace> findFirstPlace(Long appId, WeekRange week) {
        String sql = """
                select u.id, u.nickname
                  from play_sessions ps
                  join users u on u.id = ps.user_id
                  join apps a on a.id = ps.app_id
                 where ps.app_id = :appId
                   and ps.status = 'SUBMITTED'
                   and ps.submitted_at >= :weekStart
                   and ps.submitted_at < :weekEnd
                   and ps.user_id <> a.creator_id
                   and u.status = 'ACTIVE'
                   and u.is_mock = false
                 order by ps.score desc, ps.submitted_at asc, ps.id asc
                 limit 1
                """;
        MapSqlParameterSource params = weekParams(week).addValue("appId", appId);
        return jdbc.query(sql, params, (rs, i) -> new FirstPlace(rs.getLong("id"), rs.getString("nickname")))
                .stream().findFirst();
    }

    /** [7단계] 유저 랭킹용: 1등 기록 한 건 + 그 유저 정보 */
    @Getter
    @AllArgsConstructor
    public static class RecordRow {
        private final Long userId;
        private final String nickname;
        private final String userStatus;      // ACTIVE / SUSPENDED / WITHDRAWN
        private final String appTitle;        // 앱이 삭제됐으면 null
        private final BigDecimal coefficient;
        private final int participants;       // participants_at_close (동점 처리용)
    }

    /**
     * [7단계] 유저 랭킹에 쓸 1등 기록들 (01 D3).
     * 합산·정렬·순위는 서비스(RankingService)에서 for 문으로 한다(SQL을 짧게 두고 규칙은 자바에서 읽히게).
     *
     * [참고] left join apps
     * - 앱이 삭제된 기록은 app_id가 NULL이라 일반 join이면 빠져 버린다.
     * - left join은 "짝이 없어도 기록은 남기고 앱 칸만 NULL"로 가져온다 → 삭제된 앱 기록도 포인트에 들어간다.
     *
     * @param periodKey 주간이면 그 주차 키, 누적이면 null (모든 주차)
     */
    public List<RecordRow> findRecords(String periodKey) {
        String keyCondition = periodKey == null ? "" : "and r.period_key = :periodKey";
        String sql = """
                select r.user_id, u.nickname, u.status, a.title, r.coefficient, r.participants_at_close
                  from first_place_records r
                  join users u on u.id = r.user_id
                  left join apps a on a.id = r.app_id
                 where r.period_type = 'WEEK'
                   %s
                 order by r.period_key, r.original_app_id
                """.formatted(keyCondition);
        // %s에는 위에 적힌 정해진 글자만 들어간다(사용자 입력 아님)
        MapSqlParameterSource params = new MapSqlParameterSource("periodKey", periodKey);
        return jdbc.query(sql, params, (rs, i) -> new RecordRow(
                rs.getLong("user_id"),
                rs.getString("nickname"),
                rs.getString("status"),
                rs.getString("title"),
                rs.getBigDecimal("coefficient"),
                rs.getInt("participants_at_close")));
    }

    /** 주간 범위 값 2개 (월요일 00:00 KST 이상, 다음 월요일 00:00 KST 미만) */
    private MapSqlParameterSource weekParams(WeekRange week) {
        return new MapSqlParameterSource()
                .addValue("weekStart", week.start())
                .addValue("weekEnd", week.end());
    }
}
