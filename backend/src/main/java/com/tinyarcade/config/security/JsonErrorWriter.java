package com.tinyarcade.config.security;

import com.tinyarcade.exception.ErrorCode;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.nio.charset.StandardCharsets;

/**
 * 보안 필터 단계에서 공통 오류 형식 JSON {code, message}을 직접 쓴다.
 *
 * <h3>공부 포인트</h3>
 * 401·403은 컨트롤러에 도착하기 "전"(필터 단계)에 결정된다. 그래서 컨트롤러 오류를 처리하는
 * GlobalExceptionHandler가 잡지 못한다. 이 클래스가 같은 모양의 JSON을 손으로 써서 형식을 맞춘다.
 * ({@code final class} + private 생성자: 객체를 만들지 않고 static 메서드만 쓰는 도우미 클래스라는 뜻)
 */
final class JsonErrorWriter {

    private JsonErrorWriter() {
    }

    static void write(HttpServletResponse response, ErrorCode code) throws IOException {
        response.setStatus(code.getStatus().value());                  // 예: 401
        response.setCharacterEncoding(StandardCharsets.UTF_8.name());  // 한글 메시지가 깨지지 않게
        response.setContentType("application/json");
        // 메시지는 ErrorCode에 고정된 문장이라 따옴표가 없으므로 문자열로 바로 만들어도 안전하다
        response.getWriter().write(
                "{\"code\":\"" + code.name() + "\",\"message\":\"" + code.getMessage() + "\"}");
    }
}
