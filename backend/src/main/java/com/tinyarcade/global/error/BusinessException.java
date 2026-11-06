package com.tinyarcade.global.error;

import lombok.Getter;

/** 공통 오류 형식으로 응답할 예외. throw new BusinessException(ErrorCode.XXX) */
@Getter
public class BusinessException extends RuntimeException {

    private final ErrorCode errorCode;

    public BusinessException(ErrorCode errorCode) {
        super(errorCode.getMessage());
        this.errorCode = errorCode;
    }

    public BusinessException(ErrorCode errorCode, String message) {
        super(message);
        this.errorCode = errorCode;
    }
}
