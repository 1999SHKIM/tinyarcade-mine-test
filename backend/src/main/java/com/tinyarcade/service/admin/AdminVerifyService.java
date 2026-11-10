package com.tinyarcade.service.admin;

import com.tinyarcade.dto.admin.AdminVerificationResponse;
import com.tinyarcade.entity.session.PlaySession;
import com.tinyarcade.entity.session.SessionStatus;
import com.tinyarcade.entity.session.VerifyStatus;
import com.tinyarcade.exception.BusinessException;
import com.tinyarcade.exception.ErrorCode;
import com.tinyarcade.repository.admin.AdminAppRepository;
import com.tinyarcade.repository.admin.AdminSessionRepository;
import com.tinyarcade.repository.session.PlaySessionRepository;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 이상값 검증 대기 업무 규칙 (26번 이상값 검증 대기, 허 담당).
 */
@Service
@RequiredArgsConstructor
public class AdminVerifyService {

    private final AdminSessionRepository adminSessionRepository;
    private final PlaySessionRepository playSessionRepository;
    private final AdminAppRepository adminAppRepository;

    /** 검증 대기 목록 조회 (status = SUBMITTED, verifyStatus = PENDING, 최근 제출순) */
    @Transactional(readOnly = true)
    public List<AdminVerificationResponse> getPendingVerifications() {
        return adminSessionRepository
                .findByStatusAndVerifyStatusOrderBySubmittedAtDesc(SessionStatus.SUBMITTED, VerifyStatus.PENDING)
                .stream()
                .map(AdminVerificationResponse::from)
                .toList();
    }

    /** 기록 인정 (PENDING -> APPROVED) */
    @Transactional
    public void approveVerification(UUID sessionId) {
        PlaySession session = adminSessionRepository.findById(sessionId)
                .orElseThrow(() -> new BusinessException(ErrorCode.SESSION_NOT_FOUND));

        if (session.getStatus() != SessionStatus.SUBMITTED || session.getVerifyStatus() != VerifyStatus.PENDING) {
            throw new BusinessException(ErrorCode.SESSION_NOT_FOUND);
        }

        playSessionRepository.updateVerifyStatus(sessionId, VerifyStatus.APPROVED);
    }

    /** 기록 삭제 (기록 행 삭제 + 앱 play_count 1 감소) */
    @Transactional
    public void deleteVerification(UUID sessionId) {
        PlaySession session = adminSessionRepository.findById(sessionId)
                .orElseThrow(() -> new BusinessException(ErrorCode.SESSION_NOT_FOUND));

        if (session.getStatus() != SessionStatus.SUBMITTED || session.getVerifyStatus() != VerifyStatus.PENDING) {
            throw new BusinessException(ErrorCode.SESSION_NOT_FOUND);
        }

        Long appId = session.getApp().getId();
        adminSessionRepository.delete(session);
        adminSessionRepository.flush();
        adminAppRepository.decrementPlayCount(appId);
    }
}
