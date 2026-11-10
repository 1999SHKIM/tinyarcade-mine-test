package com.tinyarcade.service.ranking;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/**
 * 유저 랭킹 계수 공식 (01_core_logic_ranking D2, 03_17 RANK-F04).
 *
 * [참고] 한 문장 요약 (01 D 한 문장 요약)
 * - 게임마다 점수 체계가 달라 점수를 직접 비교하지 않고, 각 앱의 주간 1등에게 포인트를 준다.
 *   추천과 참여자가 많은 앱일수록 더 주되, 순위로 바꾸고 제곱근을 씌워 인기 앱 1등이 모든 것을 가져가지 않게 한다.
 *
 * [참고] 계산 순서
 * 1) 순위 백분위 p = (L + 0.5 × E) / n
 *    - L: 모집단에서 값이 나보다 작은 앱 수, E: 나와 값이 같은 앱 수(나 포함), n: 모집단 앱 수
 *    - 결과는 0~1 사이. 맨 끝(0, 1)은 나오지 않는다 → 앱이 2~3개일 때 한쪽만 극단적으로 유리해지는 것을 막음
 * 2) 제곱근 보정: c = 1 + 가중치 × √p
 *    - 제곱근을 씌우면 하위권은 빨리 오르고 상위권끼리 차이는 줄어든다 → 쏠림 완화
 * 3) coefficient = c추천 × c참여 (소수 4자리 반올림해서 저장)
 * 4) 포인트 = 기본 포인트(100) × coefficient (저장하지 않고 조회할 때 계산)
 *
 * [참고] 왜 순수 함수로 따로 뺐나 (01 G2, 03_17 RANK-N04)
 * - DB나 시간을 전혀 읽지 않고 숫자만 받아 숫자를 돌려준다 → 같은 입력이면 항상 같은 결과.
 * - 그래서 서버를 켜지 않고 JUnit 테스트로 01 문서의 계산 예시와 바로 맞춰 볼 수 있다.
 */
@Component
public class CoefficientCalculator {

    private final BigDecimal basePoints;
    private final double weightRecommend;
    private final double weightParticipants;

    public CoefficientCalculator(@Value("${ranking.formula.base-points}") int basePoints,
                                 @Value("${ranking.formula.w-rec}") double weightRecommend,
                                 @Value("${ranking.formula.w-part}") double weightParticipants) {
        this.basePoints = BigDecimal.valueOf(basePoints);
        this.weightRecommend = weightRecommend;
        this.weightParticipants = weightParticipants;
    }

    /**
     * 순위 백분위 p (01 D2 1단계).
     *
     * @param value      내 값 (예: 내 앱의 추천 수)
     * @param population 모집단 모든 앱의 값 (나 포함)
     * @return 0보다 크고 1보다 작은 값
     */
    public double percentile(int value, List<Integer> population) {
        int smaller = 0;   // L: 나보다 작은 앱 수
        int equal = 0;     // E: 나와 같은 앱 수 (나 포함)
        for (int other : population) {
            if (other < value) {
                smaller++;
            } else if (other == value) {
                equal++;
            }
        }
        return (smaller + 0.5 * equal) / population.size();
    }

    /**
     * 계수 (01 D2 2·3단계). 소수 4자리로 반올림한다(컬럼 NUMERIC(10,4)).
     *
     * @param recommendPercentile    추천 수 백분위 p
     * @param participantsPercentile 참여자 수 백분위 p
     */
    public BigDecimal coefficient(double recommendPercentile, double participantsPercentile) {
        double recommendFactor = 1 + weightRecommend * Math.sqrt(recommendPercentile);
        double participantsFactor = 1 + weightParticipants * Math.sqrt(participantsPercentile);
        return BigDecimal.valueOf(recommendFactor * participantsFactor).setScale(4, RoundingMode.HALF_UP);
    }

    /** 1등 기록 1건의 포인트 = 기본 포인트 × coefficient (01 D2 4단계, 소수 2자리) */
    public BigDecimal points(BigDecimal coefficient) {
        return basePoints.multiply(coefficient).setScale(2, RoundingMode.HALF_UP);
    }
}
