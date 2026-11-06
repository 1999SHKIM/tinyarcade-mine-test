package com.tinyarcade.exception;

import lombok.Getter;

/**
 * "규칙상 안 되는 요청"을 알리는 예외. 사용법: {@code throw new BusinessException(ErrorCode.EMAIL_DUPLICATE);}
 *
 * <h3>공부 포인트</h3>
 * 서비스 코드에서 이 예외를 던지면, 컨트롤러까지 거슬러 올라가 GlobalExceptionHandler가 잡아서
 * {@code {code, message}} JSON으로 바꿔 응답한다. 덕분에 서비스 코드는 "무슨 오류인지"만 말하면 되고
 * 응답 모양을 신경 쓰지 않아도 된다.
 * RuntimeException을 상속하므로 메서드마다 {@code throws}를 적지 않아도 된다(unchecked 예외).
 */
@Getter
public class BusinessException extends RuntimeException {

    private final ErrorCode errorCode;

    public BusinessException(ErrorCode errorCode) {
        super(errorCode.getMessage());
        this.errorCode = errorCode;
    }

    /** 기본 메시지 대신 다른 문장을 보여 주고 싶을 때 */
    public BusinessException(ErrorCode errorCode, String message) {
        super(message);
        this.errorCode = errorCode;
    }
}
