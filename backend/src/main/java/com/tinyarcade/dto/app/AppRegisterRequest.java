package com.tinyarcade.dto.app;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;

/**
 * POST /api/apps 요청 본문 (03_11_tinyarcade_app §3 입력값 규칙).
 *
 * [참고] @Pattern(정규식)
 * entryPath의 정규식은 "맨 앞이 / 가 아니고, .. 이나 \ 가 없고, ? # 없이 .html로 끝나는 문자열"이라는 뜻이다.
 * (?!...)는 "앞으로 ...이 나오면 안 된다"는 조건(부정 전방탐색)이다.
 * 이렇게 막아야 /apps/{key}/../../ 같은 경로로 레포 밖을 엿보는 시도를 처음부터 거른다.
 */
public record AppRegisterRequest(
        @NotBlank(message = "제목을 입력해 주세요.")
        @Size(max = 100, message = "제목은 100자 이하여야 합니다.")
        String title,

        @NotBlank(message = "설명을 입력해 주세요.")
        @Size(max = 500, message = "설명은 500자 이하여야 합니다.")
        String description,

        @NotBlank(message = "GitHub 레포 주소를 입력해 주세요.")
        @Size(max = 300, message = "레포 주소는 300자 이하여야 합니다.")
        String repoUrl,

        @Size(max = 200, message = "진입 HTML 경로는 200자 이하여야 합니다.")
        @Pattern(regexp = "^(?!/)(?!.*\\.\\.)(?!.*\\\\)[^?#]*\\.html$",
                message = "진입 HTML 경로는 .html로 끝나야 하고 .. \\ 나 맨 앞 / 를 쓸 수 없습니다.")
        String entryPath,

        @DecimalMin(value = "0", message = "최고 점수는 0 이상이어야 합니다.")
        @Digits(integer = 12, fraction = 2, message = "최고 점수는 정수 12자리·소수 2자리까지입니다.")
        BigDecimal maxScore     // 선택 (없으면 null)
) {
    /** 검사 전에 앞뒤 공백 제거, 진입 경로가 비면 기본값 index.html */
    public AppRegisterRequest {
        title = title == null ? null : title.trim();
        description = description == null ? null : description.trim();
        repoUrl = repoUrl == null ? null : repoUrl.trim();
        entryPath = (entryPath == null || entryPath.isBlank()) ? "index.html" : entryPath.trim();
    }
}
