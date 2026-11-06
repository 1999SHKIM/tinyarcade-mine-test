package com.tinyarcade.global.error;

/**
 * 공통 오류 응답 {@code { "code": "...", "message": "..." }} (AUTH-N04).
 * record라서 스프링이 필드 이름(code, message) 그대로 JSON으로 바꿔 준다.
 * 이후 모든 기능의 오류 응답이 이 모양을 따른다 → 프론트는 한 가지 방식으로만 오류를 처리하면 된다.
 */
public record ErrorResponse(String code, String message) {

    public static ErrorResponse of(ErrorCode errorCode) {
        return new ErrorResponse(errorCode.name(), errorCode.getMessage());
    }

    public static ErrorResponse of(ErrorCode errorCode, String message) {
        return new ErrorResponse(errorCode.name(), message);
    }
}
