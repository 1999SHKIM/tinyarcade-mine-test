package com.tinyarcade.service.admin;

import com.tinyarcade.dto.admin.AppRejectRequest;
import com.tinyarcade.dto.app.AppResponse;
import com.tinyarcade.entity.app.App;
import com.tinyarcade.entity.app.AppStatus;
import com.tinyarcade.entity.board.CommentTargetType;
import com.tinyarcade.exception.BusinessException;
import com.tinyarcade.exception.ErrorCode;
import com.tinyarcade.repository.admin.AdminAppRepository;
import com.tinyarcade.repository.board.CommentRepository;
import java.util.List;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 어드민 앱 관리 업무 규칙 (25번 앱 관리, 허 담당).
 */
@Service
public class AdminAppService {

    private final AdminAppRepository adminAppRepository;
    private final CommentRepository commentRepository;
    private final String serveOrigin;

    public AdminAppService(AdminAppRepository adminAppRepository,
                           CommentRepository commentRepository,
                           @Value("${app.serve-origin}") String serveOrigin) {
        this.adminAppRepository = adminAppRepository;
        this.commentRepository = commentRepository;
        this.serveOrigin = serveOrigin.endsWith("/")
                ? serveOrigin.substring(0, serveOrigin.length() - 1)
                : serveOrigin;
    }

    /** 앱 목록 조회 (status가 있으면 해당 상태만, 없으면 전체. 최근 등록순) */
    @Transactional(readOnly = true)
    public List<AppResponse> getApps(AppStatus status) {
        List<App> apps = (status == null)
                ? adminAppRepository.findAllByOrderByCreatedAtDesc()
                : adminAppRepository.findByStatusOrderByCreatedAtDesc(status);
        return apps.stream()
                .map(app -> AppResponse.from(app, serveOrigin))
                .toList();
    }

    /** 앱 승인 (PENDING 앱만 가능) */
    @Transactional
    public AppResponse approveApp(Long appId) {
        App app = adminAppRepository.findWithCreatorById(appId)
                .orElseThrow(() -> new BusinessException(ErrorCode.APP_NOT_FOUND));
        if (app.getStatus() != AppStatus.PENDING) {
            throw new BusinessException(ErrorCode.VALIDATION_ERROR);
        }
        app.approve();
        return AppResponse.from(app, serveOrigin);
    }

    /** 앱 반려 (PENDING 앱만 가능, 사유 1~300자 필수) */
    @Transactional
    public AppResponse rejectApp(Long appId, AppRejectRequest request) {
        App app = adminAppRepository.findWithCreatorById(appId)
                .orElseThrow(() -> new BusinessException(ErrorCode.APP_NOT_FOUND));
        if (app.getStatus() != AppStatus.PENDING) {
            throw new BusinessException(ErrorCode.VALIDATION_ERROR);
        }
        String trimmedReason = request == null || request.reason() == null ? "" : request.reason().trim();
        if (trimmedReason.isEmpty() || trimmedReason.length() > 300) {
            throw new BusinessException(ErrorCode.VALIDATION_ERROR);
        }
        app.reject(trimmedReason);
        return AppResponse.from(app, serveOrigin);
    }

    /** 앱 강제 삭제 (앱 댓글 먼저 삭제 후 앱 삭제) */
    @Transactional
    public void deleteApp(Long appId) {
        App app = adminAppRepository.findById(appId)
                .orElseThrow(() -> new BusinessException(ErrorCode.APP_NOT_FOUND));
        commentRepository.deleteRepliesByTarget(CommentTargetType.APP, appId);
        commentRepository.deleteAllByTarget(CommentTargetType.APP, appId);
        adminAppRepository.delete(app);
    }
}
