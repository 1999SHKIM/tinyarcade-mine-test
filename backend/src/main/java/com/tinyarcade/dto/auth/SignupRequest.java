package com.tinyarcade.dto.auth;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * POST /api/auth/signup 요청 본문 (03_10_tinyarcade_auth §3 입력값 규칙).
 *
 * <h3>공부 포인트: DTO와 검사 어노테이션</h3>
 * DTO(Data Transfer Object)는 "주고받는 데이터 모양"만 담은 객체다. 엔티티(User)를 요청에 바로 쓰지 않는 이유:
 * 사용자가 role="ADMIN" 같은 칸을 몰래 보내도 받을 칸 자체가 없으므로 무시된다.
 * <ul>
 *   <li>@NotBlank: null·빈 문자열·공백만 있는 값 거부</li>
 *   <li>@Email: 이메일 형식 검사 / @Size: 글자 수 검사</li>
 *   <li>message: 실패했을 때 화면에 보여 줄 문장 (GlobalExceptionHandler가 꺼내 씀)</li>
 * </ul>
 */
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

        /** 만 14세 이상 확인. true가 아니면 AGE_NOT_CONFIRMED (Boolean이라 값이 안 오면 null) */
        Boolean ageConfirmed
) {
    /**
     * 검사 전에 앞뒤 공백을 제거한다 (§3 입력값 규칙).
     * record의 "간결한 생성자(compact constructor)": 객체가 만들어질 때 값을 다듬을 수 있다.
     * @Valid 검사는 객체가 다 만들어진 뒤에 실행되므로, 여기서 공백을 지우면 " kim@a.com "도 통과한다.
     * (구현 중 실제로 발견한 버그를 이 방법으로 고쳤다: 공백 제거보다 형식 검사가 먼저 돌아 거부되던 문제)
     */
    public SignupRequest {
        email = email == null ? null : email.trim();
        nickname = nickname == null ? null : nickname.trim();
    }
}
