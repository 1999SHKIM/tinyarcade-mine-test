package com.tinyarcade.service.ranking;

import com.tinyarcade.dto.ranking.CloseResult;
import com.tinyarcade.entity.ranking.FirstPlaceRecord;
import com.tinyarcade.repository.ranking.FirstPlaceRecordRepository;
import com.tinyarcade.service.leaderboard.WeekRange;
import java.util.concurrent.TimeUnit;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * 주간 자동 마감 (01_core_logic_ranking C1·C2, 03_17 결정 ③).
 *
 * [참고] 두 가지 시점에 같은 일을 한다
 * - 월요일 00:00 KST: 방금 끝난 지난주를 마감한다(원래 계획한 시각).
 * - 서버가 켜지고 1분 뒤 + 그 뒤 1시간마다: 지난주가 아직 마감 안 됐으면 마감한다(밀린 마감 확인).
 *
 * [참고] 왜 "밀린 마감 확인"이 필요한가 (결정 ③ 이유)
 * - Render 무료 서버는 15분 동안 요청이 없으면 잠든다. 잠든 동안에는 예약 작업도 돌지 않는다.
 * - 월요일 0시는 방문자가 거의 없는 시간이라, 그 시각 마감이 통째로 빠질 수 있다.
 * - 그래서 서버가 다시 깨어나면(누군가 접속하면) 1분 안에, 그리고 켜져 있는 동안 1시간마다 확인한다.
 *   외부 서비스(깨우기용 cron 등)를 따로 쓰지 않아도 된다.
 * - 감수: 잠든 동안은 마감이 늦어진다. 그동안 주간 랭킹은 그 전 주차가 보인다(01 C1 "직전 주차 표시"와 같은 모습).
 *
 * [참고] 여러 번 실행돼도 안전한 이유
 * - "지난주 기록이 하나도 없을 때만" 마감한다. 이미 마감된 주차는 관리자 재마감 전에는 다시 계산하지 않는다(01 "고정").
 * - 월요일 0시 마감과 밀린 마감 확인이 동시에 돌아도, closeWeek 안의 advisory lock 때문에 한 줄로 처리된다.
 *   두 번째 실행은 첫 번째가 저장한 기록을 지우고 같은 값으로 다시 저장하므로 결과가 같다.
 * - 그 주에 플레이가 하나도 없으면 기록이 계속 없어서 1시간마다 다시 확인하지만, 계산할 것이 없어 금방 끝난다.
 *
 * [참고] 왜 예외를 잡아서 로그만 남기나
 * - 예약 작업에서 난 예외는 화면으로 갈 곳이 없다. 잡지 않으면 로그에 긴 오류만 남는다.
 * - 잡아서 "어느 주차가 왜 실패했는지" 한 줄로 남기고, 다음 확인(1시간 뒤) 때 다시 시도한다.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class CloseScheduler {

    private final WeeklyCloseService weeklyCloseService;
    private final FirstPlaceRecordRepository firstPlaceRecordRepository;

    /**
     * 월요일 00:00 KST. 시각은 application.yml의 ranking.close.cron에서 읽는다(01 G1).
     * cron 6칸 = 초 분 시 일 월 요일 → "0 0 0 * * MON" = "0초 0분 0시, 매일·매월 중 월요일(MON)".
     * zone을 적지 않으면 서버 시계(Render는 UTC) 기준이 되어 한국 시간 월요일 오전 9시에 돈다.
     */
    @Scheduled(cron = "${ranking.close.cron}", zone = "Asia/Seoul")
    public void closeOnMonday() {
        closeIfMissing(WeekRange.current().previous().key());
    }

    /**
     * 밀린 마감 확인: 서버가 켜지고 1분 뒤 처음, 그 뒤로는 앞 실행이 끝나고 ranking.close.catch-up-minutes(60)분마다.
     * fixedDelay: "끝난 뒤 60분 쉬고 다시" (실행이 길어져도 겹치지 않음)
     * initialDelay 1분: 서버가 다 켜지기 전(DB 연결 준비 중)에 돌지 않도록 조금 기다린다.
     */
    @Scheduled(fixedDelayString = "${ranking.close.catch-up-minutes}", initialDelay = 1, timeUnit = TimeUnit.MINUTES)
    public void catchUp() {
        closeIfMissing(WeekRange.current().previous().key());
    }

    /**
     * 그 주차 기록이 하나도 없으면 마감한다. 실패하면 로그만 남긴다.
     * 주차를 받는 모양으로 둔 이유: 테스트에서 "지금"과 상관없이 정한 주차로 확인할 수 있게(같은 패키지에서만 호출).
     */
    void closeIfMissing(String weekKey) {
        if (firstPlaceRecordRepository.existsByPeriodTypeAndPeriodKey(FirstPlaceRecord.PERIOD_WEEK, weekKey)) {
            return;   // 이미 마감됨
        }
        try {
            CloseResult result = weeklyCloseService.closeWeek(weekKey);
            log.info("[주간 마감] {} 완료: 비교 앱 {}개, 1등 기록 {}건",
                    weekKey, result.getAppCount(), result.getRecords().size());
        } catch (Exception e) {
            log.error("[주간 마감] {} 실패, 다음 확인 때 다시 시도: {}", weekKey, e.getMessage(), e);
        }
    }
}
