package com.tinyarcade.service.ranking;

import com.tinyarcade.dao.ranking.RankingDao;
import com.tinyarcade.dao.ranking.RankingDao.AppStat;
import com.tinyarcade.dao.ranking.RankingDao.FirstPlace;
import com.tinyarcade.dto.ranking.CloseRecord;
import com.tinyarcade.dto.ranking.CloseResult;
import com.tinyarcade.entity.app.App;
import com.tinyarcade.entity.ranking.FirstPlaceRecord;
import com.tinyarcade.entity.user.User;
import com.tinyarcade.exception.BusinessException;
import com.tinyarcade.exception.ErrorCode;
import com.tinyarcade.repository.app.AppRepository;
import com.tinyarcade.repository.ranking.FirstPlaceRecordRepository;
import com.tinyarcade.repository.user.UserRepository;
import com.tinyarcade.service.leaderboard.WeekRange;
import com.tinyarcade.service.setting.SettingService;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 주간 마감·재마감·미리보기 (01_core_logic_ranking C2·C4, 03_17 §2 마감 절차).
 *
 * [참고] 이 클래스가 하는 일
 * - closeWeek(): 끝난 주차의 앱별 1등을 정해 first_place_records에 저장한다. 자동 마감(6단계 스케줄러)과
 *   관리자 재마감(허 어드민 27번)이 모두 이 메서드 하나로 들어온다.
 * - previewCurrentWeek(): 진행 중인 이번 주를 "지금 마감하면 이렇게 된다"고 계산만 해서 보여 준다(저장 안 함).
 *
 * [참고] 왜 계산(calculate)을 하나로 묶었나 (01 C4 "같은 계산 함수")
 * - 마감과 미리보기는 계산이 똑같고 "저장하느냐"만 다르다.
 * - 계산을 한 메서드로 두면 미리보기 숫자와 실제 마감 숫자가 다르게 나올 일이 없다.
 *
 * [참고] 마감 절차 (03_17 §2, 01 C2)
 * 1) 주차 키 → 범위. 아직 안 끝난 주차면 거부
 * 2) advisory lock (같은 주차 마감을 한 줄로)
 * 3) 그 주 PENDING → APPROVED
 * 4) 목데이터 토글 읽기
 * 5) 그 주 기존 기록 중 "지금 있는 앱" 것만 삭제 (재마감 대비. 삭제된 앱 기록은 보존)
 * 6~8) 계산 → 저장
 * 9) 중간에 오류가 나면 `@Transactional`이 1~8을 전부 되돌린다
 */
@Service
@RequiredArgsConstructor
public class WeeklyCloseService {

    private final RankingDao rankingDao;
    private final FirstPlaceRecordRepository firstPlaceRecordRepository;
    private final UserRepository userRepository;
    private final AppRepository appRepository;
    private final CoefficientCalculator calculator;
    private final SettingService settingService;

    /**
     * 끝난 주차 마감 (처음 마감·재마감 공통).
     *
     * @param periodKey 예: "2026-W45"
     * @throws BusinessException 형식 오류 VALIDATION_ERROR, 진행 중·미래 주차 WEEK_NOT_COMPLETED
     */
    @Transactional
    public CloseResult closeWeek(String periodKey) {
        // 1) 주차 키 → 범위
        WeekRange week = toWeek(periodKey);
        if (week.end().isAfter(OffsetDateTime.now())) {
            // 이번 주(또는 미래 주)는 아직 기록이 쌓이는 중이라 확정할 수 없다 → 미리보기를 쓰게 안내
            throw new BusinessException(ErrorCode.WEEK_NOT_COMPLETED);
        }

        // 2) 같은 주차 마감은 한 줄로 (트랜잭션이 끝나면 저절로 풀림)
        rankingDao.lockWeek(periodKey);

        // 3) 관리자가 마감 전까지 지우지 않은 "검증 중" 기록은 인정
        rankingDao.approvePending(week);

        // 4) 목데이터 토글
        boolean mockIncluded = settingService.getMockEnabled();

        // 5) 재마감이면 이전 결과를 지우고 새로 계산 (삭제된 앱의 기록은 남긴다)
        firstPlaceRecordRepository.deleteLiveRecords(FirstPlaceRecord.PERIOD_WEEK, periodKey);

        // 6~7) 계산
        CloseResult result = calculate(week, mockIncluded);

        // 8) 저장
        for (CloseRecord record : result.getRecords()) {
            // getReferenceById: DB를 바로 읽지 않고 "이 번호의 유저/앱"이라는 표시(프록시)만 만든다.
            //   저장할 때 외래 키(user_id, app_id)만 필요하므로 조회를 아낀다.
            User user = userRepository.getReferenceById(record.getUserId());
            App app = appRepository.getReferenceById(record.getAppId());
            firstPlaceRecordRepository.save(FirstPlaceRecord.weekly(
                    user, app, periodKey,
                    record.getRecommendAtClose(), record.getParticipantsAtClose(), result.getAppCount(),
                    mockIncluded, record.getCoefficient()));
        }
        return result;
    }

    /**
     * 이번 주 미리보기 (01 C4). 잠금·PENDING 변경·저장을 하지 않는다.
     * readOnly = true: 읽기만 하는 트랜잭션이라고 알려 준다(실수로 무언가 바꾸는 것을 막고 조금 가볍다).
     */
    @Transactional(readOnly = true)
    public CloseResult previewCurrentWeek() {
        return calculate(WeekRange.current(), settingService.getMockEnabled());
    }

    /**
     * 마감·미리보기 공통 계산 (01 C2 6~8단계, D2).
     *
     * [참고] 순서
     * - 비교 대상 앱들의 추천 수·참여자 수를 모은다 → 순위 백분위의 "모집단"
     * - 목 앱이 아닌 앱마다 1등을 찾고, 1등이 있으면 계수를 계산한다
     * - 목 앱은 비교 대상(모집단)에만 들어가고 1등 기록은 만들지 않는다(01 C3 "목 앱이 아닌 앱")
     */
    private CloseResult calculate(WeekRange week, boolean mockIncluded) {
        List<AppStat> population = rankingDao.population(week, mockIncluded);

        // 모집단 값 목록 (percentile 계산에 넘길 것)
        List<Integer> recommendCounts = new ArrayList<>();
        List<Integer> participantCounts = new ArrayList<>();
        for (AppStat app : population) {
            recommendCounts.add(app.getRecommendCount());
            participantCounts.add(app.getParticipants());
        }

        List<CloseRecord> records = new ArrayList<>();
        for (AppStat app : population) {
            if (app.isMock()) {
                continue;   // 목 앱은 1등 없음
            }
            Optional<FirstPlace> firstPlace = rankingDao.findFirstPlace(app.getAppId(), week);
            if (firstPlace.isEmpty()) {
                continue;   // 자격 있는 기록이 없으면 이번 주 1등 없음 (예: 크리에이터 혼자 플레이)
            }

            double recommendPercentile = calculator.percentile(app.getRecommendCount(), recommendCounts);
            double participantsPercentile = calculator.percentile(app.getParticipants(), participantCounts);
            BigDecimal coefficient = calculator.coefficient(recommendPercentile, participantsPercentile);

            records.add(new CloseRecord(
                    app.getAppId(), app.getTitle(),
                    firstPlace.get().getUserId(), firstPlace.get().getNickname(),
                    app.getRecommendCount(), app.getParticipants(),
                    coefficient, calculator.points(coefficient)));
        }
        return new CloseResult(week.key(), mockIncluded, population.size(), records);
    }

    /** 주차 키 → 범위. 형식이 틀리면 400 VALIDATION_ERROR */
    private WeekRange toWeek(String periodKey) {
        try {
            return WeekRange.ofKey(periodKey);
        } catch (IllegalArgumentException e) {
            throw new BusinessException(ErrorCode.VALIDATION_ERROR, e.getMessage());
        }
    }
}
