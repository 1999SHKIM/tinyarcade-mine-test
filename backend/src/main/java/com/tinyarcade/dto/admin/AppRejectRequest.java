package com.tinyarcade.dto.admin;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * 어드민 앱 반려 사유 요청 DTO (25번 앱 관리, 허 담당).
 */
public record AppRejectRequest(
        @NotBlank(message = "반려 사유를 입력해 주세요.")
        @Size(min = 1, max = 300, message = "반려 사유는 1~300자로 입력해 주세요.")
        String reason
) {
}
