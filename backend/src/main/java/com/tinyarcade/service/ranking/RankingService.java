package com.tinyarcade.service.ranking;

import com.tinyarcade.config.security.LoginUser;
import com.tinyarcade.dao.ranking.RankingDao;
import com.tinyarcade.dao.ranking.RankingDao.RecordRow;
import com.tinyarcade.dto.ranking.RankingEntryResponse;
import com.tinyarcade.dto.ranking.RankingPeriod;
import com.tinyarcade.dto.ranking.RankingResponse;
import com.tinyarcade.entity.ranking.FirstPlaceRecord;
import com.tinyarcade.entity.user.UserStatus;
import com.tinyarcade.repository.ranking.FirstPlaceRecordRepository;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 유저 랭킹 조회 (01_core_logic_ranking D3·D4, 03_17 §3-1).
 *
 * [참고] 주간과 누적의 차이 (01 D3)
 * - 주간(WEEKLY): 기록이 저장된 "가장 최근 주차" 하나만 합산한다. 진행 중인 이번 주는 마감 전이라 기록이 없다.
 * - 누적(ALL): 저장된 모든 주차를 합산한다.
 *
 * [참고] 순서 정하기 (01 D4 동점 처리)
 * - 1순위: 포인트 합 큰 순
 * - 2순위: 포인트가 같으면 참여자 수 합 큰 순 (더 붐빈 앱에서 1등 한 사람이 위)
 * - 둘 다 같으면 공동 순위. 다음 순위는 사람 수만큼 건너뛴다(1, 1, 3).
 *
 * [참고] 포인트는 저장하지 않고 여기서 계산한다
 * - DB에는 계수(coefficient)만 있다. 포인트 = 100 × 계수 합 (CoefficientCalculator.points).
 */
@Service
@RequiredArgsConstructor
public class RankingService {

    private static final String WITHDRAWN_NICKNAME = "탈퇴한 유저";
    private static final String DELETED_APP_TITLE = "삭제된 앱";

    private final RankingDao rankingDao;
    private final FirstPlaceRecordRepository firstPlaceRecordRepository;
    private final CoefficientCalculator calculator;

    /** 유저 한 명의 합계를 모으는 임시 그릇 (이 클래스 안에서만 씀) */
    private static class UserTotal {
        Long userId;
        String nickname;
        BigDecimal coefficientSum = BigDecimal.ZERO;
        int participantsSum = 0;
        List<String> apps = new ArrayList<>();
    }

    /**
     * 유저 랭킹.
     *
     * @param viewer 로그인했으면 그 유저(isMe 표시용), 아니면 null
     */
    @Transactional(readOnly = true)
    public RankingResponse getRanking(RankingPeriod period, LoginUser viewer) {
        // 1) 어느 주차를 볼지 정한다 (누적이면 null = 전체)
        String periodKey = null;
        if (period == RankingPeriod.WEEKLY) {
            periodKey = firstPlaceRecordRepository.findLatestPeriodKey(FirstPlaceRecord.PERIOD_WEEK);
            if (periodKey == null) {
                // 아직 마감된 주차가 하나도 없음 (서비스 첫 주)
                return new RankingResponse(period, null, List.of());
            }
        }

        // 2) 기록을 유저별로 합친다 (LinkedHashMap: 넣은 순서를 지키는 Map)
        Map<Long, UserTotal> totals = new LinkedHashMap<>();
        for (RecordRow row : rankingDao.findRecords(periodKey)) {
            UserTotal total = totals.get(row.getUserId());
            if (total == null) {
                total = new UserTotal();
                total.userId = row.getUserId();
                total.nickname = UserStatus.WITHDRAWN.name().equals(row.getUserStatus())
                        ? WITHDRAWN_NICKNAME : row.getNickname();
                totals.put(row.getUserId(), total);
            }
            total.coefficientSum = total.coefficientSum.add(row.getCoefficient());
            total.participantsSum += row.getParticipants();
            total.apps.add(row.getAppTitle() == null ? DELETED_APP_TITLE : row.getAppTitle());
        }

        // 3) 정렬: 포인트(= 계수 합) 큰 순 → 참여자 수 합 큰 순
        List<UserTotal> sorted = new ArrayList<>(totals.values());
        sorted.sort((a, b) -> {
            int byPoints = b.coefficientSum.compareTo(a.coefficientSum);
            if (byPoints != 0) {
                return byPoints;
            }
            return Integer.compare(b.participantsSum, a.participantsSum);
        });

        // 4) 순위 매기기: 앞사람과 포인트·참여자 수가 모두 같으면 같은 순위, 아니면 (내 자리 번호)
        List<RankingEntryResponse> entries = new ArrayList<>();
        int rank = 0;
        for (int i = 0; i < sorted.size(); i++) {
            UserTotal current = sorted.get(i);
            boolean sameAsPrevious = i > 0
                    && current.coefficientSum.compareTo(sorted.get(i - 1).coefficientSum) == 0
                    && current.participantsSum == sorted.get(i - 1).participantsSum;
            if (!sameAsPrevious) {
                rank = i + 1;   // 공동 순위 다음은 건너뜀: 1, 1, 3
            }
            boolean isMe = viewer != null && viewer.id().equals(current.userId);
            entries.add(new RankingEntryResponse(
                    rank, current.userId, current.nickname, null,
                    calculator.points(current.coefficientSum), current.apps.size(), current.apps,
                    null, isMe));
        }
        return new RankingResponse(period, periodKey, entries);
    }
}
