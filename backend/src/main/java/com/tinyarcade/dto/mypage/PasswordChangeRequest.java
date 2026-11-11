package com.tinyarcade.dto.mypage;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * PATCH /api/mypage/password 요청 본문.
 * 새 비밀번호는 가입 규칙과 동일하게 8~64자.
 */
public record PasswordChangeRequest(
        @NotBlank(message = "현재 비밀번호를 입력해 주세요.")
        String currentPassword,

        @NotBlank(message = "새 비밀번호를 입력해 주세요.")
        @Size(min = 8, max = 64, message = "새 비밀번호는 8~64자여야 합니다.")
        String newPassword
) {
}
