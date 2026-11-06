package com.tinyarcade.auth.dto;

import jakarta.validation.constraints.NotBlank;

/** POST /api/auth/login 요청 */
public record LoginRequest(
        @NotBlank(message = "이메일을 입력해 주세요.")
        String email,

        @NotBlank(message = "비밀번호를 입력해 주세요.")
        String password
) {
    public LoginRequest {
        email = email == null ? null : email.trim();
    }
}
