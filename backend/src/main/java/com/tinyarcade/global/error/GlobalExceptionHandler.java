package com.tinyarcade.global.error;

import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

/** 컨트롤러에서 발생한 오류를 공통 오류 형식으로 바꾼다. */
@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(BusinessException.class)
    public ResponseEntity<ErrorResponse> handleBusiness(BusinessException e) {
        ErrorCode code = e.getErrorCode();
        return ResponseEntity.status(code.getStatus()).body(ErrorResponse.of(code, e.getMessage()));
    }

    /** @Valid 검사 실패: 첫 번째 필드 오류 메시지를 보여 준다. */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidation(MethodArgumentNotValidException e) {
        String message = e.getBindingResult().getFieldErrors().stream()
                .findFirst()
                .map(err -> err.getDefaultMessage())
                .orElse(ErrorCode.VALIDATION_ERROR.getMessage());
        return ResponseEntity.badRequest().body(ErrorResponse.of(ErrorCode.VALIDATION_ERROR, message));
    }

    /** 본문이 JSON 형식이 아닐 때 */
    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ErrorResponse> handleNotReadable(HttpMessageNotReadableException e) {
        return ResponseEntity.badRequest().body(ErrorResponse.of(ErrorCode.VALIDATION_ERROR));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleUnexpected(Exception e) {
        // Spring이 상태 코드를 정해 둔 오류 (없는 주소, 잘못된 메서드, 빠진 파라미터 등)
        if (e instanceof org.springframework.web.ErrorResponse springError) {
            int status = springError.getStatusCode().value();
            ErrorCode code = switch (status) {
                case 404 -> ErrorCode.NOT_FOUND;
                case 405 -> ErrorCode.METHOD_NOT_ALLOWED;
                default -> status < 500 ? ErrorCode.VALIDATION_ERROR : ErrorCode.INTERNAL_ERROR;
            };
            if (code != ErrorCode.INTERNAL_ERROR) {
                return ResponseEntity.status(code.getStatus()).body(ErrorResponse.of(code));
            }
        }
        log.error("처리하지 못한 오류", e);
        return ResponseEntity.internalServerError().body(ErrorResponse.of(ErrorCode.INTERNAL_ERROR));
    }
}
