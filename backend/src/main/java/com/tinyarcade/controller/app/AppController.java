package com.tinyarcade.controller.app;

import com.tinyarcade.config.security.LoginUser;
import com.tinyarcade.dto.app.AppRegisterRequest;
import com.tinyarcade.dto.app.AppResponse;
import com.tinyarcade.entity.app.AppThumbnail;
import com.tinyarcade.service.app.AppService;
import jakarta.validation.Valid;
import java.time.Duration;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

/**
 * 앱 API (03_11_tinyarcade_app §3).
 *
 * [참고]
 * - 같은 /api/apps 아래라도 메서드마다 로그인 필요 여부가 다르다. 그 규칙은 SecurityConfig에 있다
 *   (GET 목록·상세 = 누구나, GET /me·POST = 로그인).
 * - 상세는 "누구나" 경로라서 로그인하지 않으면 @AuthenticationPrincipal이 null로 들어온다.
 *   서비스가 null이면 "비로그인"으로 판단한다.
 * - /me를 /{appId}보다 먼저 적을 필요는 없다. 스프링은 "me"처럼 글자가 정해진 경로를
 *   {변수} 경로보다 우선으로 고른다.
 */
@RestController
@RequestMapping("/api/apps")
@RequiredArgsConstructor
public class AppController {

    private final AppService appService;

    /** 앱 등록, JSON (로그인 필요) → 201. 썸네일 없는 등록. 지금 허 화면이 쓰는 방식이라 그대로 둔다 */
    @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE)
    @ResponseStatus(HttpStatus.CREATED)
    public AppResponse register(@AuthenticationPrincipal LoginUser loginUser,
                                @Valid @RequestBody AppRegisterRequest request) {
        return appService.register(loginUser, request);
    }

    /**
     * [썸네일] 앱 등록 + 썸네일, multipart (로그인 필요) → 201 (03_11_tinyarcade_thumbnail §3-1).
     *
     * [참고] multipart/form-data
     * - 파일과 글자를 한 요청에 "칸(part)"으로 나눠 담아 보내는 방식이다(HTML 파일 업로드 폼과 같음).
     * - data 칸: 앱 정보 JSON (JSON 등록과 같은 칸, 같은 @Valid 검사)
     * - thumbnail 칸: 이미지 파일 (선택, required = false)
     * - 같은 주소 POST /api/apps라도 보내는 형식(consumes)이 다르면 스프링이 알맞은 메서드를 고른다.
     */
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @ResponseStatus(HttpStatus.CREATED)
    public AppResponse registerWithThumbnail(@AuthenticationPrincipal LoginUser loginUser,
                                             @Valid @RequestPart("data") AppRegisterRequest request,
                                             @RequestPart(value = "thumbnail", required = false) MultipartFile thumbnail) {
        return appService.register(loginUser, request, thumbnail);
    }

    /**
     * [썸네일] 썸네일 이미지 (누구나) → 200 이미지 / 404 THUMBNAIL_NOT_FOUND.
     *
     * [참고] 응답 헤더
     * - Content-Type: 서버가 파일 내용으로 판정한 형식(image/png 등). 브라우저는 이것을 보고 그림으로 그린다.
     * - X-Content-Type-Options: nosniff → 브라우저가 내용을 보고 형식을 "추측"하지 못하게 한다(THM-N03).
     * - Cache-Control: 썸네일은 등록 뒤 바뀌지 않으므로 하루 동안 브라우저에 저장해 두고 다시 받지 않게 한다.
     * - cachePrivate으로 둔다. public이면 중간 서버(Vercel)도 하루 저장해서, 앱을 지워도 같은 주소로 이미지가 계속 보인다.
     */
    @GetMapping("/{appId}/thumbnail")
    public ResponseEntity<byte[]> thumbnail(@PathVariable Long appId) {
        AppThumbnail thumbnail = appService.getThumbnail(appId);
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(thumbnail.getContentType()))
                .header("X-Content-Type-Options", "nosniff")
                .cacheControl(CacheControl.maxAge(Duration.ofDays(1)).cachePrivate())
                .body(thumbnail.getData());
    }

    /** 공개 목록: 승인된 앱 전체 (누구나) */
    @GetMapping
    public List<AppResponse> list() {
        return appService.getApprovedApps();
    }

    /** 내 앱 (로그인 필요) */
    @GetMapping("/me")
    public List<AppResponse> myApps(@AuthenticationPrincipal LoginUser loginUser) {
        return appService.getMyApps(loginUser);
    }

    /** 상세 (승인 앱은 누구나, 대기·반려는 본인·관리자) */
    @GetMapping("/{appId}")
    public AppResponse detail(@PathVariable Long appId, @AuthenticationPrincipal LoginUser loginUser) {
        return appService.getApp(appId, loginUser);
    }
}
