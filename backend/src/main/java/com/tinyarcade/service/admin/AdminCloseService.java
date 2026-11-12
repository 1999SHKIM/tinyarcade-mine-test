package com.tinyarcade.service.admin;

import com.tinyarcade.dto.admin.CloseWeekItem;
import com.tinyarcade.dto.admin.MockSettingResponse;
import com.tinyarcade.dto.ranking.CloseResult;
import com.tinyarcade.entity.ranking.FirstPlaceRecord;
import com.tinyarcade.repository.ranking.FirstPlaceRecordRepository;
import com.tinyarcade.service.leaderboard.WeekRange;
import com.tinyarcade.service.ranking.WeeklyCloseService;
import com.tinyarcade.service.setting.SettingService;
import java.util.ArrayList;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 어드민 수동 마감·목데이터 설정 서비스 (27번, 허 담당).
 * 마감 계산 및 설정 저장은 김의 서비스를 호출하고, 어드민용 지난 주차 목록을 제공한다.
 */
@Service
@RequiredArgsConstructor
public class AdminCloseService {

    private final WeeklyCloseService weeklyCloseService;
    private final SettingService settingService;
    private final FirstPlaceRecordRepository firstPlaceRecordRepository;

    /**
     * 이번 주 마감 미리보기 (저장 안 함).
     */
    @Transactional(readOnly = true)
    public CloseResult previewCurrentWeek() {
        return weeklyCloseService.previewCurrentWeek();
    }

    /**
     * 끝난 주차 최근 8개와 마감 여부 목록 (최근 주차부터).
     * 이번 주의 한 주 전부터 8주를 previous()로 거슬러 올라가며 만든다.
     */
    @Transactional(readOnly = true)
    public List<CloseWeekItem> getCloseWeeks() {
        List<CloseWeekItem> items = new ArrayList<>(8);
        WeekRange cur = WeekRange.current().previous();
        for (int i = 0; i < 8; i++) {
            String periodKey = cur.key();
            boolean closed = firstPlaceRecordRepository.existsByPeriodTypeAndPeriodKey(
                    FirstPlaceRecord.PERIOD_WEEK, periodKey);
            items.add(new CloseWeekItem(periodKey, closed));
            cur = cur.previous();
        }
        return items;
    }

    /**
     * 끝난 주차 재마감.
     */
    @Transactional
    public CloseResult closeWeek(String periodKey) {
        return weeklyCloseService.closeWeek(periodKey);
    }

    /**
     * 목데이터 토글 상태 조회.
     */
    @Transactional(readOnly = true)
    public MockSettingResponse getMockSetting() {
        return new MockSettingResponse(settingService.getMockEnabled());
    }

    /**
     * 목데이터 토글 상태 변경.
     */
    @Transactional
    public MockSettingResponse setMockSetting(boolean enabled) {
        settingService.setMockEnabled(enabled);
        return new MockSettingResponse(settingService.getMockEnabled());
    }
}
