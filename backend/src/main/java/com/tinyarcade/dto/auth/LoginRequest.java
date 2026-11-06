package com.tinyarcade.dto.auth;

import jakarta.validation.constraints.NotBlank;

/**
 * POST /api/auth/login 요청 본문.
 * 로그인에서는 형식 검사(@Email, @Size)를 하지 않는다: 틀린 형식이어도 "이메일 또는 비밀번호가 올바르지 않습니다"
 * 한 가지로만 답해야 어떤 값이 틀렸는지 드러나지 않는다 (AUTH-N05).
 */
public record LoginRequest(
        @NotBlank(message = "이메일을 입력해 주세요.")
        String email,

        @NotBlank(message = "비밀번호를 입력해 주세요.")
        String password
) {
    /** 앞뒤 공백 제거 (SignupRequest와 같은 방식) */
    public LoginRequest {
        email = email == null ? null : email.trim();
    }
}
