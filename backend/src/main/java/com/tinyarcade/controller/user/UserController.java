package com.tinyarcade.controller.user;

import com.tinyarcade.config.security.LoginUser;
import com.tinyarcade.dto.user.MeResponse;
import com.tinyarcade.service.user.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 유저 API. /api/users/** 는 로그인이 필요하다 (SecurityConfig).
 *
 * [참고]
 * - @RestController: 메서드가 돌려준 객체를 JSON으로 바꿔 응답하는 컨트롤러.
 * - @RequiredArgsConstructor(Lombok): final 필드를 받는 생성자를 자동으로 만든다
 *   → 스프링이 그 생성자로 UserService를 넣어 준다(생성자 주입).
 * - @AuthenticationPrincipal: JwtAuthenticationFilter가 SecurityContext에 적어 둔 LoginUser를 꺼내 준다.
 *   그래서 컨트롤러는 토큰을 직접 해석하지 않는다.
 * - 컨트롤러는 service만 부른다 (repository 직접 호출 X, 03_10_backend_structure-v1.1 §1).
 */
@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    /** 내 정보 (AUTH-F03). 프론트는 새로고침 때 이 API로 로그인 상태를 복원한다 */
    @GetMapping("/me")
    public MeResponse me(@AuthenticationPrincipal LoginUser loginUser) {
        return userService.getMe(loginUser.id());
    }
}
