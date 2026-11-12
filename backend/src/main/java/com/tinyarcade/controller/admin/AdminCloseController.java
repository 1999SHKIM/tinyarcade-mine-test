package com.tinyarcade.controller.admin;

import com.tinyarcade.dto.admin.CloseWeekItem;
import com.tinyarcade.dto.admin.MockSettingRequest;
import com.tinyarcade.dto.admin.MockSettingResponse;
import com.tinyarcade.dto.ranking.CloseResult;
import com.tinyarcade.service.admin.AdminCloseService;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 어드민 수동 마감·목데이터 토글 API (27번, 허 담당).
 */
@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminCloseController {

    private final AdminCloseService adminCloseService;

    /**
     * 이번 주 마감 미리보기 (저장 안 함).
     */
    @GetMapping("/close/preview")
    public CloseResult previewCurrentWeek() {
        return adminCloseService.previewCurrentWeek();
    }

    /**
     * 끝난 주차 최근 8개와 마감 여부 목록 (최근 주차부터).
     */
    @GetMapping("/close/weeks")
    public List<CloseWeekItem> getCloseWeeks() {
        return adminCloseService.getCloseWeeks();
    }

    /**
     * 끝난 주차 재마감.
     */
    @PostMapping("/close/weeks/{periodKey}")
    public CloseResult closeWeek(@PathVariable String periodKey) {
        return adminCloseService.closeWeek(periodKey);
    }

    /**
     * 목데이터 토글 상태 조회.
     */
    @GetMapping("/settings/mock")
    public MockSettingResponse getMockSetting() {
        return adminCloseService.getMockSetting();
    }

    /**
     * 목데이터 토글 상태 변경.
     */
    @PutMapping("/settings/mock")
    public MockSettingResponse setMockSetting(@RequestBody MockSettingRequest request) {
        return adminCloseService.setMockSetting(request.enabled());
    }
}
