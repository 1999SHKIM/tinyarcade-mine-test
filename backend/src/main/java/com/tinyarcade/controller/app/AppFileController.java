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
 * [참고]
 * - 왜 /api 가 아닌가: 게임은 사이트(Vercel)와 다른 주소(Render)에서 열려야
 *   게임 코드가 사이트의 로그인 토큰을 훔칠 수 없다(메인 §10). 그래서 Vercel이 넘겨주는 /api 밖에 둔다.
 * - {*path}: 주소의 나머지 전부(폴더 포함)를 한 변수로 받는다. 예: /apps/abc/js/main.js → "/js/main.js"
 * - Content-Type: GitHub raw는 html도 "text/plain"으로 준다. 그대로 보내면 브라우저가 화면 대신
 *   글자로 보여 주므로, 확장자를 보고 직접 정한다.
 * - Cache-Control immutable: 고정 커밋의 파일은 영원히 안 바뀐다 → 브라우저가 1년 저장해도 안전(APP-N07).
 * - frame-ancestors: "이 파일을 iframe으로 띄워도 되는 사이트" 목록. 우리 사이트에서만 허용한다(APP-N03).
 *
 * [참고] Access-Control-Allow-Origin: * 를 붙이는 이유 (11/11 추가)
 * - 게임 iframe은 sandbox="allow-scripts"만 쓴다(03_13 PLY-N03). 그래서 게임 화면은 "출처 없음(null)"으로 취급된다.
 * - Vite로 빌드한 게임은 index.html의 script 줄에 `type="module" crossorigin`이 자동으로 들어간다.
 *   module 스크립트는 브라우저가 "서버가 읽어도 된다고 허락했나(CORS)"를 검사하는데,
 *   출처가 null이라 허락 헤더가 없으면 막혀서 빈 화면이 된다(실험으로 확인).
 * - 메인 §5 "빌드 결과물이 정적 파일만으로 동작하면 등록 가능"을 지키려고 허락한다.
 * - 안전한 이유: 게임 파일은 원래 공개 레포의 공개 파일이다. 로그인 토큰·개인 정보가 없다.
 *   이 헤더는 게임 파일 응답에만 붙고 /api 응답에는 붙지 않는다.
 * - type="module" 없이 평범한 script로 만든 게임(13번 테스트 화면 등)은 원래도 되고, 이 헤더가 있어도 그대로 된다.
 *
 * [참고] X-Content-Type-Options: nosniff
 * - 브라우저가 Content-Type을 무시하고 내용을 추측하지 않게 한다. 03_11 §2에 적혀 있었는데 코드에 빠져 있어 맞췄다.
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
                .header("Access-Control-Allow-Origin", "*")     // sandbox 게임이 Vite 빌드 파일을 읽을 수 있게 (위 [참고])
                .header("X-Content-Type-Options", "nosniff")
                .body(body);
    }

    private String contentType(String filePath) {
        int dot = filePath.lastIndexOf('.');
        String ext = dot < 0 ? "" : filePath.substring(dot + 1).toLowerCase(Locale.ROOT);
        return CONTENT_TYPES.getOrDefault(ext, "application/octet-stream");
    }
}
