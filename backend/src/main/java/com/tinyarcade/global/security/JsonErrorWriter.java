package com.tinyarcade.global.security;

import com.tinyarcade.global.error.ErrorCode;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.nio.charset.StandardCharsets;

/** 보안 필터 단계(컨트롤러 밖)에서 공통 오류 형식 JSON을 직접 쓴다. */
final class JsonErrorWriter {

    private JsonErrorWriter() {
    }

    static void write(HttpServletResponse response, ErrorCode code) throws IOException {
        response.setStatus(code.getStatus().value());
        response.setCharacterEncoding(StandardCharsets.UTF_8.name());
        response.setContentType("application/json");
        response.getWriter().write(
                "{\"code\":\"" + code.name() + "\",\"message\":\"" + code.getMessage() + "\"}");
    }
}
