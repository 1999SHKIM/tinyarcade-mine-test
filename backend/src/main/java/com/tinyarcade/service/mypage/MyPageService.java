package com.tinyarcade.service.mypage;

import com.tinyarcade.dto.mypage.MyBestScoreResponse;
import com.tinyarcade.dto.mypage.PasswordChangeRequest;
import com.tinyarcade.dto.mypage.WithdrawRequest;
import com.tinyarcade.entity.user.User;
import com.tinyarcade.exception.BusinessException;
import com.tinyarcade.exception.ErrorCode;
import com.tinyarcade.repository.mypage.MyPageSessionRepository;
import com.tinyarcade.repository.mypage.MyPageUserRepository;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 마이페이지 업무 규칙 처리 (20번 마이페이지, 허 담당).
 * 비밀번호 변경, 회원 탈퇴(메인 §4), 앱별 최고 점수 조회.
 */
@Service
@RequiredArgsConstructor
public class MyPageService {

    private final MyPageUserRepository myPageUserRepository;
    private final MyPageSessionRepository myPageSessionRepository;
    private final PasswordEncoder passwordEncoder;

    /**
     * 비밀번호 변경 (현재 비밀번호 확인 후 새 비밀번호 암호화 저장).
     * 현재 비밀번호 불일치 시 401(토큰 삭제됨)이 아닌 400 VALIDATION_ERROR로 응답한다.
     */
    @Transactional
    public void changePassword(Long userId, PasswordChangeRequest request) {
        User user = myPageUserRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND));

        if (!passwordEncoder.matches(request.currentPassword(), user.getPasswordHash())) {
            throw new BusinessException(ErrorCode.VALIDATION_ERROR, "현재 비밀번호가 올바르지 않습니다.");
        }

        String encoded = passwordEncoder.encode(request.newPassword());
        myPageUserRepository.updatePassword(userId, encoded);
    }

    /**
     * 회원 탈퇴 (비밀번호 확인 후 email 마스킹, hash null, WITHDRAWN 상태 변경).
     * 비밀번호 불일치 시 400 VALIDATION_ERROR.
     */
    @Transactional
    public void withdraw(Long userId, WithdrawRequest request) {
        User user = myPageUserRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND));

        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new BusinessException(ErrorCode.VALIDATION_ERROR, "비밀번호가 올바르지 않습니다.");
        }

        String exitEmail = user.getEmail() + "#exit_" + userId;
        myPageUserRepository.withdraw(userId, exitEmail);
    }

    /**
     * 내 앱별 최고 점수 목록 조회.
     */
    @Transactional(readOnly = true)
    public List<MyBestScoreResponse> getMyBestScores(Long userId) {
        return myPageSessionRepository.findMyBestScores(userId);
    }
}
