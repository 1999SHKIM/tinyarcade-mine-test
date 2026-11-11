package com.tinyarcade.service.ranking;

import static org.junit.jupiter.api.Assertions.assertEquals;

import java.math.BigDecimal;
import java.util.List;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/**
 * 계수 공식 테스트 (01 D2 계산 예시, F1-13, F1-14, 03_17 시나리오 7·8·21).
 *
 * [참고] 순수 함수 테스트
 * - 스프링을 켜지 않고 new로 직접 만들어 숫자를 넣고 결과를 비교한다(DB·서버 필요 없음, 1초 안에 끝남).
 * - 기본 설정값: 기본 포인트 100, 가중치 0.5 / 0.5 (application.yml과 같음).
 * - assertEquals(기대값, 실제값): 둘이 다르면 테스트가 실패하고 어떤 값이 나왔는지 알려 준다.
 *
 * [참고] `@DisplayName`
 * - 메서드 이름은 영어로 "테스트할메서드_상황_기대결과" 모양으로 짓는다(이름만 봐도 무엇이 깨졌는지 보이게).
 * - 결과 화면(IntelliJ 테스트 창, 테스트 보고서)에 보일 자세한 설명은 `@DisplayName`에 따로 적는다.
 * - 메서드 이름과 달리 띄어쓰기·기호(=, ., 괄호)를 자유롭게 쓸 수 있어서 문서 번호(F1-13 등)까지 넣었다.
 */
@DisplayName("계수 공식 (01 D2)")
class CoefficientCalculatorTest {

    private final CoefficientCalculator calculator = new CoefficientCalculator(100, 0.5, 0.5);

    @Test
    @DisplayName("모집단 앱이 1개면 p = 0.5, 계수 1.8321 (F1-13)")
    void coefficient_singleApp_returns1_8321() {
        double p = calculator.percentile(10, List.of(10));
        assertEquals(0.5, p, 1e-9);
        assertEquals(new BigDecimal("1.8321"), calculator.coefficient(p, p));
    }

    @Test
    @DisplayName("모집단 앱이 2개이고 순위가 같은 방향이면 계수 1.5625 / 2.0535 (F1-14)")
    void coefficient_twoAppsSameDirection_returnsLowAndHigh() {
        List<Integer> population = List.of(3, 8);
        double low = calculator.percentile(3, population);
        double high = calculator.percentile(8, population);
        assertEquals(0.25, low, 1e-9);
        assertEquals(0.75, high, 1e-9);
        assertEquals(new BigDecimal("1.5625"), calculator.coefficient(low, low));
        assertEquals(new BigDecimal("2.0535"), calculator.coefficient(high, high));
    }

    @Test
    @DisplayName("문서 계산 예시 3개 앱: 계수 2.1212 / 1.8321 / 1.4499, 포인트 212.12 / 183.21 / 144.99 (01 D2)")
    void coefficientAndPoints_documentExample_matchesDocument() {
        List<Integer> recommends = List.of(10, 2, 5);     // 앱 A, B, C 추천 수
        List<Integer> participants = List.of(50, 5, 20);  // 앱 A, B, C 참여자 수

        BigDecimal a = calculator.coefficient(calculator.percentile(10, recommends), calculator.percentile(50, participants));
        BigDecimal c = calculator.coefficient(calculator.percentile(5, recommends), calculator.percentile(20, participants));
        BigDecimal b = calculator.coefficient(calculator.percentile(2, recommends), calculator.percentile(5, participants));

        assertEquals(new BigDecimal("2.1212"), a);
        assertEquals(new BigDecimal("1.8321"), c);
        assertEquals(new BigDecimal("1.4499"), b);
        assertEquals(new BigDecimal("212.12"), calculator.points(a));
        assertEquals(new BigDecimal("183.21"), calculator.points(c));
        assertEquals(new BigDecimal("144.99"), calculator.points(b));
    }

    @Test
    @DisplayName("값이 같은 앱끼리는 같은 p를 받는다 (동점, E에 나 포함)")
    void percentile_tiedValues_returnsSameValue() {
        List<Integer> population = List.of(4, 4);
        assertEquals(0.5, calculator.percentile(4, population), 1e-9);
    }

    @Test
    @DisplayName("계수는 항상 1보다 크고 2.25보다 작다 (01 F3)")
    void coefficient_anyPercentile_staysBetween1And2_25() {
        BigDecimal smallest = calculator.coefficient(0.0001, 0.0001);
        BigDecimal largest = calculator.coefficient(0.9999, 0.9999);
        assertEquals(1, smallest.compareTo(BigDecimal.ONE));            // 1보다 큼
        assertEquals(-1, largest.compareTo(new BigDecimal("2.25")));    // 2.25보다 작음
    }

    /*
     * [참고] 아래 3개는 01 F3 "최소 통계 시뮬레이션" 점검이다 (앱 10개 규모, 목데이터와 같은 크기).
     * - F3 ④(토글은 다음 마감에만 영향)는 DB가 필요해서 WeeklyCloseServiceTest의 F1-12에서 확인한다.
     * - 결과가 기대와 달라도 공식·가중치를 자동으로 바꾸지 않는다(01 F3). 바꿀 일이 생기면 사용자와 합의한다.
     */

    @Test
    @DisplayName("F3-① 가중치가 같으면 추천만 1위인 앱과 참여자만 1위인 앱의 계수가 같다 (두 계수가 비등)")
    void coefficient_equalWeights_recommendAndParticipantsBalanced() {
        List<Integer> tenApps = List.of(1, 2, 3, 4, 5, 6, 7, 8, 9, 10);
        double top = calculator.percentile(10, tenApps);      // 0.95
        double bottom = calculator.percentile(1, tenApps);    // 0.05

        BigDecimal recommendOnly = calculator.coefficient(top, bottom);
        BigDecimal participantsOnly = calculator.coefficient(bottom, top);

        assertEquals(recommendOnly, participantsOnly);
    }

    @Test
    @DisplayName("F3-② 참여자 1명뿐인 앱끼리 동률이면 모두 p = 0.5, 계수 같음")
    void percentile_allAppsOneParticipant_sameCoefficient() {
        List<Integer> participants = List.of(1, 1, 1);
        double p = calculator.percentile(1, participants);

        assertEquals(0.5, p, 1e-9);
        assertEquals(new BigDecimal("1.8321"), calculator.coefficient(p, p));
    }

    @Test
    @DisplayName("F3-③ 앱 10개일 때 작은 앱 1등 3회가 큰 앱 1등 1회보다 포인트가 크다 (쏠림 완화)")
    void points_smallAppThreeWins_beatBigAppOneWin() {
        List<Integer> tenApps = List.of(1, 2, 3, 4, 5, 6, 7, 8, 9, 10);
        double smallest = calculator.percentile(1, tenApps);
        double biggest = calculator.percentile(10, tenApps);

        BigDecimal smallApp = calculator.points(calculator.coefficient(smallest, smallest));   // 123.61
        BigDecimal bigApp = calculator.points(calculator.coefficient(biggest, biggest));       // 221.22

        assertEquals(new BigDecimal("123.61"), smallApp);
        assertEquals(new BigDecimal("221.22"), bigApp);
        assertEquals(1, smallApp.multiply(BigDecimal.valueOf(3)).compareTo(bigApp));   // 370.83 > 221.22
    }
}
