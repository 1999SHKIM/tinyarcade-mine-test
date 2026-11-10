package com.tinyarcade.controller.admin;

import com.tinyarcade.dto.admin.AppRejectRequest;
import com.tinyarcade.dto.app.AppResponse;
import com.tinyarcade.entity.app.AppStatus;
import com.tinyarcade.service.admin.AdminAppService;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

/**
 * 어드민 앱 관리 API (25번 앱 관리, 허 담당).
 */
@RestController
@RequestMapping("/api/admin/apps")
@RequiredArgsConstructor
public class AdminAppController {

    private final AdminAppService adminAppService;

    /** 앱 목록 조회 (status: PENDING / APPROVED / REJECTED, 생략 시 전체. 최근 등록순) */
    @GetMapping
    public List<AppResponse> list(@RequestParam(required = false) AppStatus status) {
        return adminAppService.getApps(status);
    }

    /** 앱 승인 */
    @PostMapping("/{id}/approve")
    public AppResponse approve(@PathVariable Long id) {
        return adminAppService.approveApp(id);
    }

    /** 앱 반려 */
    @PostMapping("/{id}/reject")
    public AppResponse reject(@PathVariable Long id,
                              @Valid @RequestBody AppRejectRequest request) {
        return adminAppService.rejectApp(id, request);
    }

    /** 앱 강제 삭제 */
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        adminAppService.deleteApp(id);
    }
}
