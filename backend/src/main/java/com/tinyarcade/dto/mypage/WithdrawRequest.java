package com.tinyarcade.dto.mypage;

import jakarta.validation.constraints.NotBlank;

/**
 * POST /api/mypage/withdraw 요청 본문.
 */
public record WithdrawRequest(
        @NotBlank(message = "비밀번호를 입력해 주세요.")
        String password
) {
}
