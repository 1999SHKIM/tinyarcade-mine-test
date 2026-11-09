package com.tinyarcade.controller.app;

import com.tinyarcade.config.security.LoginUser;
import com.tinyarcade.dto.app.AppRegisterRequest;
import com.tinyarcade.dto.app.AppResponse;
import com.tinyarcade.service.app.AppService;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

/**
 * 앱 API (03_11_tinyarcade_app §3).
 *
 * [참고]
 * - 같은 /api/apps 아래라도 메서드마다 로그인 필요 여부가 다르다. 그 규칙은 SecurityConfig에 있다
 *   (GET 목록·상세 = 누구나, GET /me·POST = 로그인).
 * - 상세는 "누구나" 경로라서 로그인하지 않으면 @AuthenticationPrincipal이 null로 들어온다.
 *   서비스가 null이면 "비로그인"으로 판단한다.
 * - /me를 /{appId}보다 먼저 적을 필요는 없다. 스프링은 "me"처럼 글자가 정해진 경로를
 *   {변수} 경로보다 우선으로 고른다.
 */
@RestController
@RequestMapping("/api/apps")
@RequiredArgsConstructor
public class AppController {

    private final AppService appService;

    /** 앱 등록 (로그인 필요) → 201 */
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public AppResponse register(@AuthenticationPrincipal LoginUser loginUser,
                                @Valid @RequestBody AppRegisterRequest request) {
        return appService.register(loginUser, request);
    }

    /** 공개 목록: 승인된 앱 전체 (누구나) */
    @GetMapping
    public List<AppResponse> list() {
        return appService.getApprovedApps();
    }

    /** 내 앱 (로그인 필요) */
    @GetMapping("/me")
    public List<AppResponse> myApps(@AuthenticationPrincipal LoginUser loginUser) {
        return appService.getMyApps(loginUser);
    }

    /** 상세 (승인 앱은 누구나, 대기·반려는 본인·관리자) */
    @GetMapping("/{appId}")
    public AppResponse detail(@PathVariable Long appId, @AuthenticationPrincipal LoginUser loginUser) {
        return appService.getApp(appId, loginUser);
    }
}
