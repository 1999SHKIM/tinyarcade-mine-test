package com.tinyarcade.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** POST /api/auth/signup 요청 (03_10_tinyarcade_auth §3 입력값 규칙) */
public record SignupRequest(
        @NotBlank(message = "이메일을 입력해 주세요.")
        @Email(message = "이메일 형식이 올바르지 않습니다.")
        @Size(max = 150, message = "이메일은 150자 이하여야 합니다.")
        String email,

        @NotBlank(message = "비밀번호를 입력해 주세요.")
        @Size(min = 8, max = 64, message = "비밀번호는 8~64자여야 합니다.")
        String password,

        @NotBlank(message = "닉네임을 입력해 주세요.")
        @Size(min = 2, max = 20, message = "닉네임은 2~20자여야 합니다.")
        String nickname,

        /** 만 14세 이상 확인. true가 아니면 AGE_NOT_CONFIRMED */
        Boolean ageConfirmed
) {
    /** 검사 전에 앞뒤 공백을 제거한다 (§3 입력값 규칙) */
    public SignupRequest {
        email = email == null ? null : email.trim();
        nickname = nickname == null ? null : nickname.trim();
    }
}
