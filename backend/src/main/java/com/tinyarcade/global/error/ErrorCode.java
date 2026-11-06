package com.tinyarcade.global.error;

import lombok.Getter;
import org.springframework.http.HttpStatus;

/**
 * 공통 오류 코드 (03_10_tinyarcade_auth §3). 새 기능의 오류 코드는 아래에 추가만 한다.
 */
@Getter
public enum ErrorCode {

    // 공통
    VALIDATION_ERROR(HttpStatus.BAD_REQUEST, "입력값이 올바르지 않습니다."),
    UNAUTHORIZED(HttpStatus.UNAUTHORIZED, "로그인이 필요합니다."),
    FORBIDDEN(HttpStatus.FORBIDDEN, "권한이 없습니다."),
    NOT_FOUND(HttpStatus.NOT_FOUND, "요청한 주소를 찾을 수 없습니다."),
    METHOD_NOT_ALLOWED(HttpStatus.METHOD_NOT_ALLOWED, "허용되지 않은 요청 방식입니다."),
    INTERNAL_ERROR(HttpStatus.INTERNAL_SERVER_ERROR, "서버 오류가 발생했습니다."),

    // 인증 (10)
    AGE_NOT_CONFIRMED(HttpStatus.BAD_REQUEST, "만 14세 이상만 가입할 수 있습니다."),
    EMAIL_DUPLICATE(HttpStatus.CONFLICT, "이미 가입된 이메일입니다."),
    NICKNAME_DUPLICATE(HttpStatus.CONFLICT, "이미 사용 중인 닉네임입니다."),
    INVALID_CREDENTIALS(HttpStatus.UNAUTHORIZED, "이메일 또는 비밀번호가 올바르지 않습니다."),
    USER_NOT_ACTIVE(HttpStatus.FORBIDDEN, "이용이 정지되었거나 탈퇴한 계정입니다.");

    private final HttpStatus status;
    private final String message;

    ErrorCode(HttpStatus status, String message) {
        this.status = status;
        this.message = message;
    }
}
