package com.tinyarcade.service.admin;

import com.tinyarcade.dto.admin.AdminUserResponse;
import com.tinyarcade.entity.user.User;
import com.tinyarcade.entity.user.UserRole;
import com.tinyarcade.entity.user.UserStatus;
import com.tinyarcade.exception.BusinessException;
import com.tinyarcade.exception.ErrorCode;
import com.tinyarcade.repository.admin.AdminUserRepository;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 어드민 유저 관리 업무 규칙 (24번 유저 관리, 허 담당).
 */
@Service
@RequiredArgsConstructor
public class AdminUserService {

    private final AdminUserRepository adminUserRepository;

    /** 전체 유저 목록 조회 (최근 가입순) */
    @Transactional(readOnly = true)
    public List<AdminUserResponse> getUsers() {
        return adminUserRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(AdminUserResponse::from)
                .toList();
    }

    /** 유저 정지 (ACTIVE -> SUSPENDED) */
    @Transactional
    public AdminUserResponse suspendUser(Long userId) {
        User user = adminUserRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND));

        // 관리자 계정은 정지 불가 (자기 자신 포함) -> FORBIDDEN
        if (user.getRole() == UserRole.ADMIN) {
            throw new BusinessException(ErrorCode.FORBIDDEN);
        }
        // 탈퇴(WITHDRAWN) 유저 또는 이미 정지(SUSPENDED) 상태면 VALIDATION_ERROR
        if (user.getStatus() != UserStatus.ACTIVE) {
            throw new BusinessException(ErrorCode.VALIDATION_ERROR);
        }

        adminUserRepository.updateStatus(userId, UserStatus.SUSPENDED);
        User updated = adminUserRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND));
        return AdminUserResponse.from(updated);
    }

    /** 유저 정지 해제 (SUSPENDED -> ACTIVE) */
    @Transactional
    public AdminUserResponse activateUser(Long userId) {
        User user = adminUserRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND));

        // 탈퇴(WITHDRAWN) 유저 또는 이미 활성(ACTIVE) 상태면 VALIDATION_ERROR
        if (user.getStatus() != UserStatus.SUSPENDED) {
            throw new BusinessException(ErrorCode.VALIDATION_ERROR);
        }

        adminUserRepository.updateStatus(userId, UserStatus.ACTIVE);
        User updated = adminUserRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND));
        return AdminUserResponse.from(updated);
    }
}
