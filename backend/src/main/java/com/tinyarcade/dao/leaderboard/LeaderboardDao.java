package com.tinyarcade.dao.leaderboard;

import com.tinyarcade.entity.session.VerifyStatus;
import com.tinyarcade.entity.user.UserStatus;
import com.tinyarcade.service.leaderboard.WeekRange;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.Collection;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Repository;

/**
 * 앱 리더보드 조회 SQL (01_core_logic_ranking Part B, 03_15 §2 조회 조건).
 *
 * [참고] 공통 조건 (리더보드·내 기록·앱 카드 모두 같음)
 * - 같은 앱, 앱의 현재 시즌, 제출(SUBMITTED) 기록만
 * - 목 유저 기록은 뺀다 (01 B3 "목 유저 기록은 리더보드에서 숨김")
 * - 검증 상태(NORMAL·PENDING·APPROVED)는 거르지 않는다 → PENDING도 "검증 중..."으로 보인다
 * - 주간이면 제출 시각이 이번 주 범위 안 (월요일 00:00 KST 이상, 다음 월요일 00:00 KST 미만)
 * - 정렬: 점수 높은 순 → 먼저 제출한 순 → 세션 번호 순 (01 B2). 세 번째 기준 덕분에 같은 자리가 생기지 않는다
 *
 * [참고] row_number() over (order by ...)
 * - "정렬한 순서대로 1, 2, 3… 번호를 붙여라"라는 SQL 함수(윈도 함수)다. 이 번호가 곧 순위다(결정 ③).
 * - 내 순위도 같은 번호를 쓴다. 전체에 번호를 붙인 뒤 "그중 내 기록의 가장 작은 번호"를 고르면
 *   100위 밖이어도 정확한 순위가 나온다.
 * - 순서 비교를 전부 DB가 하므로 세션 번호(UUID) 정렬도 DB 기준 하나로 맞는다(03_15 §4-1).
 *
 * [참고] NamedParameterJdbcTemplate
 * - JdbcTemplate과 같지만 ? 대신 :appId처럼 이름 붙은 자리를 쓴다. 값이 많을 때 순서를 헷갈리지 않는다.
 * - 목록(앱 번호 여러 개)을 넘기면 IN (:appIds)를 IN (1, 2, 3)처럼 알아서 펼쳐 준다.
 * - 값은 SQL에 직접 이어 붙이지 않고 따로 넘긴다(바인딩) → SQL 인젝션 방지(메인 §10).
 *
 * [참고] SQL 안의 %s
 * - 주간·누적은 "이번 주 조건이 있느냐 없느냐"만 다르다. 그래서 SQL 전체를 그대로 적고,
 *   주간 조건이 들어갈 자리만 %s로 비워 둔 뒤 .formatted(...)로 채운다(누적이면 빈 글자).
 * - %s에 들어가는 것은 이 파일에 적힌 정해진 글자(WEEK_CONDITION)뿐이고, 사용자 입력은 들어가지 않는다.
 */
@Repository
@RequiredArgsConstructor
public class LeaderboardDao {

    private final NamedParameterJdbcTemplate jdbc;

    /** 리더보드 한 줄 (DB에서 읽은 그대로. 탈퇴 닉네임 바꾸기 등은 서비스가 한다) */
    public record Row(String sessionId, long rank, Long userId, String nickname, UserStatus userStatus,
                      BigDecimal score, OffsetDateTime submittedAt, VerifyStatus verifyStatus) {
    }

    /** 내 최고 기록 = 내 기록 중 가장 위 줄의 점수와 순위 */
    public record MyBest(BigDecimal score, long rank) {
    }

    /** 앱 카드용 이번 주 값 */
    public record WeeklyStats(BigDecimal topScore, int participants) {
    }

    /** 주간일 때만 SQL의 %s 자리에 들어가는 조건 (누적이면 빈 글자) */
    private static final String WEEK_CONDITION = "and ps.submitted_at >= :weekStart and ps.submitted_at < :weekEnd";

    /**
     * 상위 limit줄 (LB-F01~F06).
     * 안쪽 select: 조건에 맞는 기록 전체에 순위 번호(rn)를 붙인다 / 바깥 select: 번호 limit까지만 꺼낸다.
     *
     * @param week 주간이면 이번 주 범위, 누적이면 null
     */
    public List<Row> findTop(Long appId, int season, WeekRange week, int limit) {
        String sql = """
                select *
                  from (select ps.id, ps.user_id, u.nickname, u.status, ps.score, ps.submitted_at, ps.verify_status,
                               row_number() over (order by ps.score desc, ps.submitted_at asc, ps.id asc) as rn
                          from play_sessions ps
                          join users u on u.id = ps.user_id
                         where ps.app_id = :appId
                           and ps.season = :season
                           and ps.status = 'SUBMITTED'
                           and u.is_mock = false
                           %s
                       ) t
                 where t.rn <= :limit
                 order by t.rn
                """.formatted(weekCondition(week));
        MapSqlParameterSource params = params(appId, season, week).addValue("limit", limit);
        return jdbc.query(sql, params, (rs, i) -> new Row(
                rs.getString("id"),
                rs.getLong("rn"),
                rs.getLong("user_id"),
                rs.getString("nickname"),
                UserStatus.valueOf(rs.getString("status")),
                rs.getBigDecimal("score"),
                rs.getObject("submitted_at", OffsetDateTime.class),
                VerifyStatus.valueOf(rs.getString("verify_status"))));
    }

    /**
     * 내 최고 기록과 순위 (LB-F07). 그 기간에 내 기록이 없으면 비어 있음.
     * 안쪽 select는 findTop과 같다(전체에 순위 번호). 바깥에서 "내 기록 중 번호가 가장 작은 1줄"을 고른다
     * → 100위 밖이어도 정확한 순위가 나온다.
     */
    public Optional<MyBest> findMyBest(Long appId, int season, WeekRange week, Long userId) {
        String sql = """
                select t.score, t.rn
                  from (select ps.user_id, ps.score,
                               row_number() over (order by ps.score desc, ps.submitted_at asc, ps.id asc) as rn
                          from play_sessions ps
                          join users u on u.id = ps.user_id
                         where ps.app_id = :appId
                           and ps.season = :season
                           and ps.status = 'SUBMITTED'
                           and u.is_mock = false
                           %s
                       ) t
                 where t.user_id = :userId
                 order by t.rn
                 limit 1
                """.formatted(weekCondition(week));
        MapSqlParameterSource params = params(appId, season, week).addValue("userId", userId);
        return jdbc.query(sql, params, (rs, i) -> new MyBest(rs.getBigDecimal("score"), rs.getLong("rn")))
                .stream().findFirst();
    }

    /**
     * 앱 여러 개의 이번 주 값을 한 번에 (LB-F12, N02).
     * 최고 점수(max)와 서로 다른 유저 수(count distinct)를 앱별로 묶어서(group by) 구한다.
     * 이번 주 기록이 없는 앱은 결과에 없다 → 서비스에서 null·0으로 채운다.
     */
    public Map<Long, WeeklyStats> weeklyStats(Collection<Long> appIds, WeekRange week) {
        if (appIds.isEmpty()) {
            return Map.of();
        }
        String sql = """
                select ps.app_id, max(ps.score) as top_score, count(distinct ps.user_id) as participants
                  from play_sessions ps
                  join users u on u.id = ps.user_id
                  join apps a on a.id = ps.app_id
                 where ps.app_id in (:appIds)
                   and ps.season = a.current_season
                   and ps.status = 'SUBMITTED'
                   and u.is_mock = false
                   and ps.submitted_at >= :weekStart
                   and ps.submitted_at < :weekEnd
                 group by ps.app_id
                """;
        MapSqlParameterSource params = new MapSqlParameterSource()
                .addValue("appIds", appIds)
                .addValue("weekStart", week.start())
                .addValue("weekEnd", week.end());
        Map<Long, WeeklyStats> result = new HashMap<>();
        jdbc.query(sql, params, rs -> {
            result.put(rs.getLong("app_id"),
                    new WeeklyStats(rs.getBigDecimal("top_score"), rs.getInt("participants")));
        });
        return result;
    }

    /** 주간이면 이번 주 조건, 누적이면 빈 글자 (사용자 입력이 아니라 정해진 글자만 넣는다) */
    private String weekCondition(WeekRange week) {
        return week == null ? "" : WEEK_CONDITION;
    }

    private MapSqlParameterSource params(Long appId, int season, WeekRange week) {
        MapSqlParameterSource params = new MapSqlParameterSource()
                .addValue("appId", appId)
                .addValue("season", season);
        if (week != null) {
            params.addValue("weekStart", week.start()).addValue("weekEnd", week.end());
        }
        return params;
    }
}
