package com.tinyarcade.service.session;

import com.tinyarcade.dao.session.SessionStatsDao.Stats;
import java.math.BigDecimal;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/**
 * 이상값 판정 (01_core_logic_ranking A3). 판정만 하고 DB는 건드리지 않는다.
 *
 * [참고] Z-score
 *   z = (내 값 - 평균) / 표준편차
 *   "내 값이 평균에서 표준편차 몇 개만큼 떨어져 있나"
 *   예) 평균 500점, 표준편차 50점일 때 800점 → z = (800-500)/50 = 6 → 아주 드문 값
 * - R-MAX: 크리에이터가 선언한 최고 점수(max_score)보다 크면 의심. 표본과 상관없이 항상 검사
 * - R-ZS: 점수 z ≥ +3 (비정상적으로 높음)
 * - R-ZT: 플레이 시간 z ≤ -3 (비정상적으로 짧음. 긴 시간은 의심하지 않음)
 * - 기준 기록이 30개 미만이거나 표준편차가 0·계산 불가면 그 Z 검사만 건너뛴다(통계가 믿을 만하지 않으므로)
 * 의심은 거부가 아니다. 결과는 "PENDING(검증 중)" 표시에만 쓰고 기록은 그대로 남는다(메인 §5).
 *
 * isSuspicious는 같은 입력이면 항상 같은 답을 내는 순수 함수다(01 G2 "Z-score 계산은 순수 함수로 분리").
 * DB·시간 같은 바깥 상태를 읽지 않아서 숫자만 넣어 쉽게 테스트할 수 있다.
 */
@Component
public class AnomalyDetector {

    private final double zThreshold;
    private final long minSample;

    public AnomalyDetector(@Value("${ranking.anomaly.z-threshold}") double zThreshold,
                           @Value("${ranking.anomaly.min-sample}") long minSample) {
        this.zThreshold = zThreshold;
        this.minSample = minSample;
    }

    /**
     * @param score       제출 점수
     * @param playSeconds 플레이 시간(초) = 제출 시각 - 시작 시각
     * @param maxScore    선언된 최고 점수 (없으면 null → R-MAX 생략)
     * @param baseline    기준 분포 통계
     * @return true면 PENDING(검증 대기)
     */
    public boolean isSuspicious(BigDecimal score, double playSeconds, BigDecimal maxScore, Stats baseline) {
        // R-MAX: 선언된 상한 초과 (같은 점수는 의심하지 않음, 01 A3 "만점이라는 사실만으로 PENDING 아님")
        if (maxScore != null && score.compareTo(maxScore) > 0) {
            return true;
        }
        // 표본이 적으면 Z 검사 전체 생략
        if (baseline.count() < minSample) {
            return false;
        }
        Double zScore = z(score.doubleValue(), baseline.meanScore(), baseline.sdScore());
        Double zTime = z(playSeconds, baseline.meanSeconds(), baseline.sdSeconds());
        boolean highScore = zScore != null && zScore >= zThreshold;      // R-ZS
        boolean shortTime = zTime != null && zTime <= -zThreshold;       // R-ZT
        return highScore || shortTime;
    }

    /** 평균·표준편차를 계산할 수 없거나 표준편차가 0이면 null (그 검사 생략) */
    private Double z(double value, Double mean, Double sd) {
        if (mean == null || sd == null || sd == 0.0) {
            return null;
        }
        return (value - mean) / sd;
    }
}
