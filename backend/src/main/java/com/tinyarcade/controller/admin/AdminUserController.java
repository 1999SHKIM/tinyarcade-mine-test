package com.tinyarcade.controller.admin;

import com.tinyarcade.dto.admin.AdminUserResponse;
import com.tinyarcade.service.admin.AdminUserService;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 어드민 유저 관리 API (24번 유저 관리, 허 담당).
 */
@RestController
@RequestMapping("/api/admin/users")
@RequiredArgsConstructor
public class AdminUserController {

    private final AdminUserService adminUserService;

    /** 전체 유저 목록 조회 (최근 가입순) */
    @GetMapping
    public List<AdminUserResponse> list() {
        return adminUserService.getUsers();
    }

    /** 유저 정지 (ACTIVE -> SUSPENDED) */
    @PostMapping("/{id}/suspend")
    public AdminUserResponse suspend(@PathVariable Long id) {
        return adminUserService.suspendUser(id);
    }

    /** 유저 정지 해제 (SUSPENDED -> ACTIVE) */
    @PostMapping("/{id}/activate")
    public AdminUserResponse activate(@PathVariable Long id) {
        return adminUserService.activateUser(id);
    }
}
