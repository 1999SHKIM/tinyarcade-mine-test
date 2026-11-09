package com.tinyarcade.controller.session;

import com.tinyarcade.config.security.LoginUser;
import com.tinyarcade.dto.session.ScoreSubmitRequest;
import com.tinyarcade.dto.session.ScoreSubmitResponse;
import com.tinyarcade.dto.session.SessionStartRequest;
import com.tinyarcade.dto.session.SessionStartResponse;
import com.tinyarcade.service.session.SessionService;
import jakarta.validation.Valid;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 세션 API (03_12_tinyarcade_session §3-2). /api/sessions/** 는 로그인 필요(기본 규칙).
 *
 * [참고]
 * - 이 API는 게임이 직접 부르지 않는다. 게임은 postMessage로 "시작/점수"를 알리고,
 *   플랫폼 화면(13번 sdkBridge)이 로그인 토큰을 붙여 이 API를 부른다(메인 §5 "앱은 토큰에 접근 불가").
 * - 시작 응답 상태 코드: 새 세션을 만들면 201(Created), 미리보기 테스트 모드면 만든 게 없으니 200.
 */
@RestController
@RequestMapping("/api/sessions")
@RequiredArgsConstructor
public class SessionController {

    private final SessionService sessionService;

    /** 게임 시작 → 201 { sessionId, appId, startedAt, testMode:false } / 미리보기 200 { testMode:true } */
    @PostMapping
    public ResponseEntity<SessionStartResponse> start(@AuthenticationPrincipal LoginUser loginUser,
                                                      @Valid @RequestBody SessionStartRequest request) {
        SessionStartResponse response = sessionService.start(loginUser, request.appId());
        return ResponseEntity.status(response.testMode() ? HttpStatus.OK : HttpStatus.CREATED).body(response);
    }

    /** 점수 제출 → 200 { sessionId, appId, score, submittedAt, verifyStatus } */
    @PostMapping("/{sessionId}/submit")
    public ScoreSubmitResponse submit(@AuthenticationPrincipal LoginUser loginUser,
                                      @PathVariable UUID sessionId,
                                      @RequestBody ScoreSubmitRequest request) {
        return sessionService.submit(loginUser, sessionId, request.score());
    }
}
