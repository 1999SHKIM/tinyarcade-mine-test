package com.tinyarcade.controller.auth;

import com.tinyarcade.dto.auth.LoginRequest;
import com.tinyarcade.dto.auth.LoginResponse;
import com.tinyarcade.dto.auth.SignupRequest;
import com.tinyarcade.dto.auth.SignupResponse;
import com.tinyarcade.service.auth.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

/**
 * 가입·로그인 API (로그인 없이 호출 가능, AUTH-F08).
 *
 * [참고]
 * - @RequestBody: 요청 본문 JSON을 SignupRequest 객체로 바꿔 준다.
 * - @Valid: 바꾼 객체에 붙은 검사 규칙(@Email, @Size 등)을 실행한다.
 *   실패하면 메서드가 실행되지 않고 GlobalExceptionHandler가 400 VALIDATION_ERROR로 응답한다.
 * - @ResponseStatus(CREATED): 성공 시 200 대신 201(새로 만들어짐)로 응답한다.
 */
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    /** POST /api/auth/signup → 201 { id, email, nickname } */
    @PostMapping("/signup")
    @ResponseStatus(HttpStatus.CREATED)
    public SignupResponse signup(@Valid @RequestBody SignupRequest request) {
        return authService.signup(request);
    }

    /** POST /api/auth/login → 200 { accessToken, user } */
    @PostMapping("/login")
    public LoginResponse login(@Valid @RequestBody LoginRequest request) {
        return authService.login(request);
    }
}
