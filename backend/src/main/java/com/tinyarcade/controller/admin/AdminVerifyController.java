package com.tinyarcade.controller.admin;

import com.tinyarcade.dto.admin.AdminVerificationResponse;
import com.tinyarcade.service.admin.AdminVerifyService;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

/**
 * 어드민 이상값 검증 대기 API (26번 이상값 검증 대기, 허 담당).
 */
@RestController
@RequestMapping("/api/admin/verifications")
@RequiredArgsConstructor
public class AdminVerifyController {

    private final AdminVerifyService adminVerifyService;

    /** 검증 대기 기록 목록 조회 (최근 제출순) */
    @GetMapping
    public List<AdminVerificationResponse> list() {
        return adminVerifyService.getPendingVerifications();
    }

    /** 이상값 기록 인정 (PENDING -> APPROVED) */
    @PostMapping("/{sessionId}/approve")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void approve(@PathVariable UUID sessionId) {
        adminVerifyService.approveVerification(sessionId);
    }

    /** 이상값 기록 삭제 (행 삭제 + 플레이 수 1 감소) */
    @DeleteMapping("/{sessionId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable UUID sessionId) {
        adminVerifyService.deleteVerification(sessionId);
    }
}
