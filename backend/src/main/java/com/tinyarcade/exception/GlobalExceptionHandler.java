package com.tinyarcade.exception;

import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

/**
 * 컨트롤러에서 발생한 오류를 공통 오류 형식 {code, message}로 바꾼다.
 *
 * [참고]
 * - @RestControllerAdvice: 모든 컨트롤러에 공통으로 적용되는 "오류 처리 담당".
 *   컨트롤러마다 try-catch를 쓰지 않아도 여기서 한 번에 처리된다.
 * - @ExceptionHandler(X.class): X 종류의 예외가 나면 이 메서드가 응답을 만든다.
 *   더 구체적인 예외 처리기가 먼저 선택되고, 맞는 것이 없으면 맨 아래 Exception 처리기로 간다.
 * - ResponseEntity: 응답 본문 + HTTP 상태 코드를 함께 정해서 돌려줄 때 쓴다.
 * (401·403은 필터 단계에서 결정되므로 여기가 아니라 config/security/JsonErrorWriter가 처리한다)
 */
@Slf4j  // Lombok: log 변수를 자동으로 만들어 준다 → log.error(...)
@RestControllerAdvice
public class GlobalExceptionHandler {

    /** 우리가 직접 던진 오류 (예: EMAIL_DUPLICATE) */
    @ExceptionHandler(BusinessException.class)
    public ResponseEntity<ErrorResponse> handleBusiness(BusinessException e) {
        ErrorCode code = e.getErrorCode();
        return ResponseEntity.status(code.getStatus()).body(ErrorResponse.of(code, e.getMessage()));
    }

    /** @Valid 검사 실패 (예: 비밀번호 7자): 첫 번째 필드 오류 메시지를 보여 준다 */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidation(MethodArgumentNotValidException e) {
        String message = e.getBindingResult().getFieldErrors().stream()
                .findFirst()
                .map(err -> err.getDefaultMessage())   // DTO의 @Size(message = "...")에 적은 문장
                .orElse(ErrorCode.VALIDATION_ERROR.getMessage());
        return ResponseEntity.badRequest().body(ErrorResponse.of(ErrorCode.VALIDATION_ERROR, message));
    }

    /** 요청 본문이 JSON 형식이 아닐 때 (예: '{bad') */
    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ErrorResponse> handleNotReadable(HttpMessageNotReadableException e) {
        return ResponseEntity.badRequest().body(ErrorResponse.of(ErrorCode.VALIDATION_ERROR));
    }

    /**
     * 주소의 값 형식이 틀림 (예: /api/apps/abc 처럼 숫자 자리에 글자) → 400.
     * [11번 배포 테스트에서 발견] 이 처리가 없으면 아래 "그 밖의 오류"로 가서 500(서버 오류)이 났다.
     */
    @ExceptionHandler(org.springframework.web.method.annotation.MethodArgumentTypeMismatchException.class)
    public ResponseEntity<ErrorResponse> handleTypeMismatch(Exception e) {
        return ResponseEntity.badRequest().body(ErrorResponse.of(ErrorCode.VALIDATION_ERROR));
    }

    /** 그 밖의 모든 오류 */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleUnexpected(Exception e) {
        // 스프링이 상태 코드를 이미 정해 둔 오류(없는 주소 404, 잘못된 메서드 405 등)는 그 상태대로 응답한다.
        // (instanceof 패턴: "e가 ErrorResponse 종류라면 springError라는 이름으로 바로 쓰겠다")
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
        // 진짜 예상 못 한 오류: 서버 로그에 자세히 남기고, 사용자에게는 내부 정보를 숨긴다
        log.error("처리하지 못한 오류", e);
        return ResponseEntity.internalServerError().body(ErrorResponse.of(ErrorCode.INTERNAL_ERROR));
    }
}
