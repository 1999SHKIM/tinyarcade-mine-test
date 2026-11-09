package com.tinyarcade.controller.app;

import com.tinyarcade.service.app.AppService;
import java.util.Arrays;
import java.util.Locale;
import java.util.Map;
import java.util.stream.Collectors;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

/**
 * 게임 파일 전달: GET /apps/{deployKey}/{경로} (03_11_tinyarcade_app APP-F05, 배포 결정 "방법 1").
 *
 * <h3>공부 포인트</h3>
 * <ul>
 *   <li><b>왜 /api 가 아닌가</b>: 게임은 사이트(Vercel)와 <b>다른 주소(Render)</b>에서 열려야
 *       게임 코드가 사이트의 로그인 토큰을 훔칠 수 없다(메인 §10). 그래서 Vercel이 넘겨주는 /api 밖에 둔다.</li>
 *   <li><b>{*path}</b>: 주소의 나머지 전부(폴더 포함)를 한 변수로 받는다. 예: /apps/abc/js/main.js → "/js/main.js"</li>
 *   <li><b>Content-Type</b>: GitHub raw는 html도 "text/plain"으로 준다. 그대로 보내면 브라우저가 화면 대신
 *       글자로 보여 주므로, 확장자를 보고 직접 정한다.</li>
 *   <li><b>Cache-Control immutable</b>: 고정 커밋의 파일은 영원히 안 바뀐다 → 브라우저가 1년 저장해도 안전(APP-N07).</li>
 *   <li><b>frame-ancestors</b>: "이 파일을 iframe으로 띄워도 되는 사이트" 목록. 우리 사이트에서만 허용한다(APP-N03).</li>
 * </ul>
 */
@RestController
public class AppFileController {

    /** 확장자 → 파일 형식 */
    private static final Map<String, String> CONTENT_TYPES = Map.ofEntries(
            Map.entry("html", "text/html; charset=UTF-8"),
            Map.entry("htm", "text/html; charset=UTF-8"),
            Map.entry("js", "text/javascript; charset=UTF-8"),
            Map.entry("mjs", "text/javascript; charset=UTF-8"),
            Map.entry("css", "text/css; charset=UTF-8"),
            Map.entry("json", "application/json; charset=UTF-8"),
            Map.entry("txt", "text/plain; charset=UTF-8"),
            Map.entry("svg", "image/svg+xml"),
            Map.entry("png", "image/png"),
            Map.entry("jpg", "image/jpeg"),
            Map.entry("jpeg", "image/jpeg"),
            Map.entry("gif", "image/gif"),
            Map.entry("webp", "image/webp"),
            Map.entry("ico", "image/x-icon"),
            Map.entry("mp3", "audio/mpeg"),
            Map.entry("wav", "audio/wav"),
            Map.entry("ogg", "audio/ogg"),
            Map.entry("woff", "font/woff"),
            Map.entry("woff2", "font/woff2"),
            Map.entry("wasm", "application/wasm"));

    private final AppService appService;
    private final String frameAncestors;

    public AppFileController(AppService appService, @Value("${app.frontend-origins}") String frontendOrigins) {
        this.appService = appService;
        // "http://a, http://b" → "http://a http://b" (CSP는 공백으로 구분)
        this.frameAncestors = Arrays.stream(frontendOrigins.split(","))
                .map(String::trim).filter(s -> !s.isEmpty())
                .collect(Collectors.joining(" "));
    }

    @GetMapping("/apps/{deployKey}/{*path}")
    public ResponseEntity<byte[]> file(@PathVariable String deployKey, @PathVariable String path) {
        String filePath = path.startsWith("/") ? path.substring(1) : path;   // "/index.html" → "index.html"
        byte[] body = appService.loadFile(deployKey, filePath);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_TYPE, contentType(filePath))
                .header(HttpHeaders.CACHE_CONTROL, "public, max-age=31536000, immutable")
                .header("Content-Security-Policy", "frame-ancestors " + frameAncestors)
                .body(body);
    }

    private String contentType(String filePath) {
        int dot = filePath.lastIndexOf('.');
        String ext = dot < 0 ? "" : filePath.substring(dot + 1).toLowerCase(Locale.ROOT);
        return CONTENT_TYPES.getOrDefault(ext, "application/octet-stream");
    }
}
