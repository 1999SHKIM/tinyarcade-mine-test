package com.tinyarcade.service.app;

import com.tinyarcade.config.security.LoginUser;
import com.tinyarcade.dto.app.AppRegisterRequest;
import com.tinyarcade.dto.app.AppResponse;
import com.tinyarcade.entity.app.App;
import com.tinyarcade.entity.app.AppStatus;
import com.tinyarcade.entity.user.User;
import com.tinyarcade.entity.user.UserRole;
import com.tinyarcade.exception.BusinessException;
import com.tinyarcade.exception.ErrorCode;
import com.tinyarcade.repository.app.AppRepository;
import com.tinyarcade.repository.user.UserRepository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 앱 등록·조회·게임 파일 전달의 업무 규칙 (03_11_tinyarcade_app §1).
 *
 * [참고] 등록 순서
 * 레포 주소 형식 확인 → GitHub에 레포 확인(공개인가) → 기본 브랜치 최신 커밋 번호 받기(고정)
 *   → 그 커밋에 진입 HTML이 있는가 → 저장(PENDING, 새 deployKey)
 * 하나라도 실패하면 저장하지 않고 이유를 알려 준다(APP-F03, 메인 §5 "등록을 거부하고 사유를 안내").
 */
@Service
public class AppService {

    /** https://github.com/{owner}/{repo} (끝의 / 나 .git 허용). 괄호 두 개가 owner, repo */
    private static final Pattern GITHUB_REPO_URL =
            Pattern.compile("^https://github\\.com/([A-Za-z0-9-]+)/([A-Za-z0-9._-]+?)(?:\\.git)?/?$");

    private final AppRepository appRepository;
    private final UserRepository userRepository;
    private final GitHubClient gitHubClient;
    private final String serveOrigin;

    public AppService(AppRepository appRepository, UserRepository userRepository, GitHubClient gitHubClient,
                      @Value("${app.serve-origin}") String serveOrigin) {
        this.appRepository = appRepository;
        this.userRepository = userRepository;
        this.gitHubClient = gitHubClient;
        // 끝에 / 가 붙어 있으면 떼어 내서 playUrl에 // 가 생기지 않게 한다
        this.serveOrigin = serveOrigin.endsWith("/") ? serveOrigin.substring(0, serveOrigin.length() - 1) : serveOrigin;
    }

    /** 앱 등록 (APP-F01~F04) */
    @Transactional
    public AppResponse register(LoginUser loginUser, AppRegisterRequest request) {
        RepoName repo = parseRepoUrl(request.repoUrl());

        GitHubClient.RepoInfo info = gitHubClient.getRepo(repo.owner(), repo.name());
        if (info.isPrivate()) {
            // 토큰 주인(김)의 비공개 레포는 토큰 때문에 보일 수 있다 → 반드시 거른다 (공개 레포만 등록 가능)
            throw new BusinessException(ErrorCode.REPO_NOT_FOUND);
        }
        String sha = gitHubClient.getLatestCommitSha(repo.owner(), repo.name(), info.defaultBranch());
        if (gitHubClient.fetchFile(repo.owner(), repo.name(), sha, request.entryPath()).isEmpty()) {
            throw new BusinessException(ErrorCode.ENTRY_NOT_FOUND);
        }

        User creator = userRepository.findById(loginUser.id())
                .orElseThrow(() -> new BusinessException(ErrorCode.UNAUTHORIZED));
        App app = App.register(creator, request.title(), request.description(), repo.normalizedUrl(),
                sha, request.entryPath(), request.maxScore());
        return AppResponse.from(appRepository.save(app), serveOrigin);
    }

    /** 공개 목록: 승인된 앱 전체, 추천순 → 최근 승인순 (APP-F06, 03_11 §2) */
    @Transactional(readOnly = true)
    public List<AppResponse> getApprovedApps() {
        return appRepository.findByStatusOrderByRecommendCountDescApprovedAtDesc(AppStatus.APPROVED).stream()
                .map(app -> AppResponse.from(app, serveOrigin))
                .toList();
    }

    /**
     * 상세 (APP-F07). 승인 앱은 누구나, 대기·반려 앱은 본인·관리자만.
     * 볼 수 없는 앱은 "권한 없음"이 아니라 "없음(404)"으로 답한다 → 남의 미등록 앱이 있는지조차 알 수 없게.
     *
     * @param viewer 로그인하지 않았으면 null
     */
    @Transactional(readOnly = true)
    public AppResponse getApp(Long appId, LoginUser viewer) {
        App app = appRepository.findWithCreatorById(appId)
                .orElseThrow(() -> new BusinessException(ErrorCode.APP_NOT_FOUND));
        if (!app.isApproved() && !canSeeUnapproved(app, viewer)) {
            throw new BusinessException(ErrorCode.APP_NOT_FOUND);
        }
        return AppResponse.from(app, serveOrigin);
    }

    /** 내 앱 (APP-F08): 모든 상태, 최근 등록순 */
    @Transactional(readOnly = true)
    public List<AppResponse> getMyApps(LoginUser loginUser) {
        return appRepository.findByCreatorIdOrderByCreatedAtDesc(loginUser.id()).stream()
                .map(app -> AppResponse.from(app, serveOrigin))
                .toList();
    }

    /**
     * 게임 파일 (APP-F05, N02). 주소의 deployKey로 앱을 찾고, 고정 커밋의 파일을 GitHub에서 가져온다.
     * 상태와 상관없이 같은 주소를 쓴다(승인 전 미리보기 = 주소를 아는 사람만, 메인 §5).
     */
    @Transactional(readOnly = true)
    public byte[] loadFile(String deployKey, String path) {
        if (!isSafePath(path)) {
            throw new BusinessException(ErrorCode.APP_NOT_FOUND);
        }
        App app = parseUuid(deployKey)
                .flatMap(appRepository::findByDeployKey)
                .orElseThrow(() -> new BusinessException(ErrorCode.APP_NOT_FOUND));
        RepoName repo = parseRepoUrl(app.getRepoUrl());
        return gitHubClient.fetchFile(repo.owner(), repo.name(), app.getCommitSha(), path)
                .orElseThrow(() -> new BusinessException(ErrorCode.APP_NOT_FOUND));
    }

    // ── 도우미 ──

    private boolean canSeeUnapproved(App app, LoginUser viewer) {
        return viewer != null
                && (viewer.role() == UserRole.ADMIN || viewer.id().equals(app.getCreator().getId()));
    }

    /** 경로 조작 차단: 비어 있음, 맨 앞 /, .. , \ , 빈 조각(//)을 모두 거부 */
    private boolean isSafePath(String path) {
        if (path == null || path.isBlank() || path.startsWith("/") || path.contains("\\")) {
            return false;
        }
        for (String segment : path.split("/", -1)) {
            if (segment.isEmpty() || segment.equals(".") || segment.equals("..")) {
                return false;
            }
        }
        return true;
    }

    private Optional<UUID> parseUuid(String value) {
        try {
            return Optional.of(UUID.fromString(value));
        } catch (IllegalArgumentException e) {
            return Optional.empty();
        }
    }

    private RepoName parseRepoUrl(String url) {
        Matcher m = GITHUB_REPO_URL.matcher(url == null ? "" : url.trim());
        if (!m.matches()) {
            throw new BusinessException(ErrorCode.INVALID_REPO_URL);
        }
        return new RepoName(m.group(1), m.group(2));
    }

    /** owner/repo 한 쌍 */
    private record RepoName(String owner, String name) {
        String normalizedUrl() {
            return "https://github.com/" + owner + "/" + name;
        }
    }
}
