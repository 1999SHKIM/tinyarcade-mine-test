package com.tinyarcade.service.app;

import com.tinyarcade.exception.BusinessException;
import com.tinyarcade.exception.ErrorCode;
import java.net.URI;
import java.net.http.HttpClient;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Arrays;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.util.unit.DataSize;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.util.UriUtils;

/**
 * GitHub와 대화하는 담당 (03_11_tinyarcade_app §4-3).
 *
 * [참고]
 * - RestClient: 스프링의 "다른 서버에 HTTP 요청을 보내는" 도구. 프론트의 axios와 같은 역할을 서버에서 한다.
 * - 두 종류의 GitHub 주소
 *   - api.github.com: 레포 정보·커밋 번호를 묻는 API. 요청 한도가 있다(토큰 없이 시간당 60회, 토큰 있으면 5,000회).
 *   - raw.githubusercontent.com: 파일 내용 그대로를 주는 주소. 게임 파일을 가져올 때 쓴다.
 * - 토큰: Authorization 헤더에 "Bearer 토큰"을 붙이면 GitHub가 "회원"으로 대해 한도가 늘어난다.
 *   값은 application.yml → 환경변수 GITHUB_TOKEN에서 오고, 비어 있으면 붙이지 않는다(APP-N04).
 * - 타임아웃: GitHub가 응답하지 않을 때 영원히 기다리지 않도록 연결 5초·응답 10초로 끊는다.
 */
@Slf4j
@Component
public class GitHubClient {

    /** api.github.com에서 받은 레포 정보 중 필요한 것만 */
    public record RepoInfo(boolean isPrivate, String defaultBranch) {
    }

    private final RestClient api;   // api.github.com 전용
    private final RestClient raw;   // raw.githubusercontent.com 전용
    private final int maxFileBytes; // 게임 파일 하나 상한 (06_31)

    public GitHubClient(@Value("${app.github-token:}") String token,
                        @Value("${app.game-file-max-size:5MB}") DataSize maxFileSize) {
        this.maxFileBytes = (int) maxFileSize.toBytes();
        HttpClient httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(5))
                .followRedirects(HttpClient.Redirect.NORMAL)
                .build();
        JdkClientHttpRequestFactory factory = new JdkClientHttpRequestFactory(httpClient);
        factory.setReadTimeout(Duration.ofSeconds(10));

        RestClient.Builder apiBuilder = RestClient.builder()
                .requestFactory(factory)
                .baseUrl("https://api.github.com")
                .defaultHeader("Accept", "application/vnd.github+json")
                .defaultHeader("X-GitHub-Api-Version", "2022-11-28")
                .defaultHeader("User-Agent", "tinyarcade");   // GitHub API는 User-Agent가 꼭 있어야 한다
        if (token != null && !token.isBlank()) {
            apiBuilder.defaultHeader("Authorization", "Bearer " + token.trim());
        } else {
            log.info("GITHUB_TOKEN이 없어 토큰 없이 GitHub에 요청합니다 (시간당 60회 제한)");
        }
        this.api = apiBuilder.build();
        this.raw = RestClient.builder()
                .requestFactory(factory)
                .defaultHeader("User-Agent", "tinyarcade")
                .build();
    }

    /** 레포가 있으면 공개 여부·기본 브랜치, 없으면 REPO_NOT_FOUND */
    public RepoInfo getRepo(String owner, String repo) {
        try {
            // 응답 JSON 전체를 Map으로 받아 필요한 두 칸만 꺼낸다 (모르는 칸이 많아도 문제없게)
            Map<?, ?> body = api.get().uri("/repos/{owner}/{repo}", owner, repo)
                    .retrieve().body(Map.class);
            if (body == null) {
                throw new BusinessException(ErrorCode.GITHUB_UNAVAILABLE);
            }
            return new RepoInfo(Boolean.TRUE.equals(body.get("private")), String.valueOf(body.get("default_branch")));
        } catch (HttpClientErrorException.NotFound e) {
            throw new BusinessException(ErrorCode.REPO_NOT_FOUND);
        } catch (RestClientException e) {
            throw unavailable(e);
        }
    }

    /** 브랜치의 최신 커밋 번호(40자 sha) */
    public String getLatestCommitSha(String owner, String repo, String branch) {
        try {
            // Accept를 "sha 전용"으로 바꾸면 GitHub가 JSON 대신 커밋 번호 문자열 하나만 돌려준다
            String sha = api.get().uri("/repos/{owner}/{repo}/commits/{branch}", owner, repo, branch)
                    .header("Accept", "application/vnd.github.sha")
                    .retrieve().body(String.class);
            if (sha == null || !sha.trim().matches("[0-9a-f]{40}")) {
                throw new BusinessException(ErrorCode.GITHUB_UNAVAILABLE);
            }
            return sha.trim();
        } catch (HttpClientErrorException.NotFound | HttpClientErrorException.UnprocessableEntity e) {
            // 빈 레포(커밋이 하나도 없음)도 여기로 온다
            throw new BusinessException(ErrorCode.REPO_NOT_FOUND);
        } catch (RestClientException e) {
            throw unavailable(e);
        }
    }

    /**
     * 고정 커밋의 파일 내용. 없으면 빈 값.
     * raw 주소는 https://raw.githubusercontent.com/{owner}/{repo}/{sha}/{경로}
     */
    public Optional<byte[]> fetchFile(String owner, String repo, String sha, String path) {
        // 경로의 각 조각을 URL용으로 인코딩한다 (한글·공백 파일 이름 대비). "/"는 그대로 둔다
        String encodedPath = Arrays.stream(path.split("/"))
                .map(seg -> UriUtils.encodePathSegment(seg, StandardCharsets.UTF_8))
                .collect(Collectors.joining("/"));
        URI uri = URI.create("https://raw.githubusercontent.com/" + owner + "/" + repo + "/" + sha + "/" + encodedPath);
        // [참고] 게임 파일은 상한까지만 읽는다 (06_31)
        // - body(byte[].class)는 끝까지 다 받은 뒤 돌려준다. 받은 뒤에 크기를 재면 이미 메모리에 다 올라간 뒤라 늦다.
        // - 그래서 흘러오는 내용을 "상한 + 1바이트"까지만 읽는다. 그만큼 읽혔으면 상한을 넘은 것이니 거기서 멈춘다.
        // - 메모리에는 최대 상한만큼만 올라간다. GitHub가 크기 정보를 주든 안 주든 똑같이 동작한다.
        try {
            return raw.get().uri(uri).exchange((request, response) -> {
                if (response.getStatusCode().value() == 404) {
                    return Optional.empty();
                }
                if (response.getStatusCode().isError()) {
                    throw new RestClientException("GitHub raw 응답 " + response.getStatusCode());
                }
                byte[] body = response.getBody().readNBytes(maxFileBytes + 1);
                if (body.length > maxFileBytes) {
                    throw new BusinessException(ErrorCode.GAME_FILE_TOO_LARGE);
                }
                return Optional.of(body);
            });
        } catch (RestClientException e) {
            throw unavailable(e);
        }
    }

    /** 한도 초과(403·429)·네트워크 오류 등 → "잠시 후 다시" */
    private BusinessException unavailable(RestClientException e) {
        log.warn("GitHub 요청 실패: {}", e.getMessage());
        return new BusinessException(ErrorCode.GITHUB_UNAVAILABLE);
    }
}
