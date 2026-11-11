package com.tinyarcade.controller.mypage;

import com.tinyarcade.config.security.LoginUser;
import com.tinyarcade.dto.mypage.MyBestScoreResponse;
import com.tinyarcade.dto.mypage.PasswordChangeRequest;
import com.tinyarcade.dto.mypage.WithdrawRequest;
import com.tinyarcade.service.mypage.MyPageService;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 마이페이지 API (20번 마이페이지, 허 담당).
 * 내 정보 조회는 기존 GET /api/users/me 를 그대로 재사용한다.
 */
@RestController
@RequestMapping("/api/mypage")
@RequiredArgsConstructor
public class MyPageController {

    private final MyPageService myPageService;

    /** PATCH /api/mypage/password : 비밀번호 변경 */
    @PatchMapping("/password")
    public ResponseEntity<Void> changePassword(
            @AuthenticationPrincipal LoginUser loginUser,
            @Valid @RequestBody PasswordChangeRequest request) {
        myPageService.changePassword(loginUser.id(), request);
        return ResponseEntity.noContent().build();
    }

    /** POST /api/mypage/withdraw : 회원 탈퇴 */
    @PostMapping("/withdraw")
    public ResponseEntity<Void> withdraw(
            @AuthenticationPrincipal LoginUser loginUser,
            @Valid @RequestBody WithdrawRequest request) {
        myPageService.withdraw(loginUser.id(), request);
        return ResponseEntity.noContent().build();
    }

    /** GET /api/mypage/best-scores : 앱별 최고 점수 목록 */
    @GetMapping("/best-scores")
    public ResponseEntity<List<MyBestScoreResponse>> getMyBestScores(
            @AuthenticationPrincipal LoginUser loginUser) {
        List<MyBestScoreResponse> responses = myPageService.getMyBestScores(loginUser.id());
        return ResponseEntity.ok(responses);
    }
}
