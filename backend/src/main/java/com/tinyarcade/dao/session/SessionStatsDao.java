package com.tinyarcade.dao.session;

import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

/**
 * 이상값 검사의 "기준 분포" 통계 (01_core_logic_ranking A3 비교 분포, 03_12 §2 "집계는 dao").
 *
 * [참고] JdbcTemplate
 * - JPA(Repository)는 "엔티티 객체"를 읽고 쓰는 데 편하다. 반면 평균·표준편차처럼
 *   여러 행을 계산해 숫자 몇 개만 받는 집계는 SQL을 그대로 쓰는 게 더 단순하다.
 * - JdbcTemplate은 SQL 문자열을 실행하고, 결과의 각 칸을 rs.getXxx(칸 이름)으로 꺼내 담는다.
 * - ?는 값이 들어갈 자리다. 값을 SQL에 직접 이어 붙이지 않고 따로 넘겨서(바인딩)
 *   SQL 인젝션을 막는다(메인 §10 "쿼리 파라미터 바인딩").
 *
 * [SQL 함수]
 * - avg(x): 평균, stddev_samp(x): 샘플 표준편차(01 A3 "샘플 표준편차"), count(*): 개수
 * - extract(epoch from (제출 - 시작)): 두 시각의 차이를 초 단위 숫자로 = 플레이 시간
 * - 기록이 1개 이하이면 stddev_samp는 NULL → 자바에서 null로 받아 "계산 불가"로 처리
 * - ::float8: 결과를 실수(double) 타입으로 바꾼다. PostgreSQL의 numeric(정밀 소수)은
 *   자바 Double로 바로 꺼낼 수 없어서다(구현 중 실제로 난 오류).
 */
@Repository
@RequiredArgsConstructor
public class SessionStatsDao {

    private final JdbcTemplate jdbcTemplate;

    /** 기준 분포 통계. 평균·표준편차는 계산할 수 없으면 null */
    public record Stats(long count, Double meanScore, Double sdScore, Double meanSeconds, Double sdSeconds) {
    }

    /**
     * 같은 앱의 정상·인정 제출 기록 통계 (01 A3).
     * 제외: 현재 제출 중인 세션, PENDING(검증 대기) 기록, 목 유저 기록.
     */
    public Stats baseline(Long appId, UUID excludeSessionId) {
        String sql = """
                select count(*)                                                        as cnt,
                       avg(ps.score)::float8                                           as mean_score,
                       stddev_samp(ps.score)::float8                                   as sd_score,
                       avg(extract(epoch from (ps.submitted_at - ps.started_at)))::float8         as mean_sec,
                       stddev_samp(extract(epoch from (ps.submitted_at - ps.started_at)))::float8 as sd_sec
                  from play_sessions ps
                  join users u on u.id = ps.user_id
                 where ps.app_id = ?
                   and ps.status = 'SUBMITTED'
                   and ps.verify_status in ('NORMAL', 'APPROVED')
                   and u.is_mock = false
                   and ps.id <> ?
                """;
        return jdbcTemplate.queryForObject(sql, (rs, rowNum) -> new Stats(
                rs.getLong("cnt"),
                rs.getObject("mean_score", Double.class),
                rs.getObject("sd_score", Double.class),
                rs.getObject("mean_sec", Double.class),
                rs.getObject("sd_sec", Double.class)), appId, excludeSessionId);
    }
}
