package com.tinyarcade.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;

/**
 * 공통 오류 코드 목록 (03_10_tinyarcade_auth §3). <b>새 기능의 오류 코드는 아래에 추가만 한다.</b>
 *
 * <h3>공부 포인트: enum</h3>
 * enum은 "정해진 값 몇 개 중 하나"를 나타내는 타입이다. 각 값(VALIDATION_ERROR 등)이
 * HTTP 상태와 기본 메시지를 함께 들고 있어서, 오류를 던질 때 {@code ErrorCode.EMAIL_DUPLICATE} 하나만 쓰면 된다.
 * 프론트는 응답의 code 문자열(예: "EMAIL_DUPLICATE")로 상황을 구분하고, message는 화면에 그대로 보여 준다.
 * <p>
 * {@code @Getter}(Lombok): getStatus(), getMessage()를 자동으로 만들어 준다.
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
    // 이메일이 없든 비밀번호가 틀리든 같은 메시지 → 어느 쪽이 틀렸는지 알려 주지 않는다 (AUTH-N05)
    INVALID_CREDENTIALS(HttpStatus.UNAUTHORIZED, "이메일 또는 비밀번호가 올바르지 않습니다."),
    USER_NOT_ACTIVE(HttpStatus.FORBIDDEN, "이용이 정지되었거나 탈퇴한 계정입니다."),

    // 앱 등록·배포 (11)
    INVALID_REPO_URL(HttpStatus.BAD_REQUEST, "GitHub 레포 주소 형식이 아닙니다. 예: https://github.com/아이디/레포이름"),
    REPO_NOT_FOUND(HttpStatus.BAD_REQUEST, "레포를 찾을 수 없습니다. 공개(Public) 레포인지 확인해 주세요."),
    ENTRY_NOT_FOUND(HttpStatus.BAD_REQUEST, "레포에서 진입 HTML 파일을 찾을 수 없습니다. 경로를 확인해 주세요."),
    GITHUB_UNAVAILABLE(HttpStatus.SERVICE_UNAVAILABLE, "GitHub에 연결할 수 없습니다. 잠시 후 다시 시도해 주세요."),
    APP_NOT_FOUND(HttpStatus.NOT_FOUND, "앱을 찾을 수 없습니다.");

    private final HttpStatus status;  // 401, 409 같은 HTTP 상태
    private final String message;     // 화면에 보여 줄 기본 문장

    ErrorCode(HttpStatus status, String message) {
        this.status = status;
        this.message = message;
    }
}
