package com.tinyarcade.service.session;

import com.tinyarcade.config.security.LoginUser;
import com.tinyarcade.dao.session.SessionStatsDao;
import com.tinyarcade.dto.session.ScoreSubmitResponse;
import com.tinyarcade.dto.session.SessionStartResponse;
import com.tinyarcade.entity.app.App;
import com.tinyarcade.entity.app.AppStatus;
import com.tinyarcade.entity.session.PlaySession;
import com.tinyarcade.entity.session.SessionStatus;
import com.tinyarcade.entity.session.VerifyStatus;
import com.tinyarcade.entity.user.User;
import com.tinyarcade.entity.user.UserRole;
import com.tinyarcade.exception.BusinessException;
import com.tinyarcade.exception.ErrorCode;
import com.tinyarcade.repository.app.AppRepository;
import com.tinyarcade.repository.session.PlaySessionRepository;
import com.tinyarcade.repository.user.UserRepository;
import java.math.BigDecimal;
import java.time.Duration;
import java.time.OffsetDateTime;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 세션 시작·점수 제출 (03_12_tinyarcade_session, 01_core_logic_ranking Part A).
 *
 * [참고] 점수 제출 검사 순서 (01 A2)
 * S-05 정지·탈퇴 → JWT 필터가 이미 막음 (요청마다 DB에서 상태 확인, 10번)
 * S-03 본인 세션인가
 * S-01 아직 OPEN인가 (이미 제출·만료면 거부)
 * S-02 60분 안인가 (지났으면 EXPIRED로 바꾸고 거부)
 * S-04 점수 형식
 * → 조건부 UPDATE(OPEN일 때만 SUBMITTED) → 플레이 수 +1 → 이상값 검사(PENDING 표시)
 * - noRollbackFor = BusinessException: 보통은 예외가 나면 그 트랜잭션의 DB 변경이 모두 취소된다.
 *   그런데 만료(S-02)는 "EXPIRED로 바꾸고 + 거부"해야 하므로, 우리가 던지는 BusinessException에서는
 *   취소하지 않게 한다. 그래서 다른 BusinessException은 반드시 DB를 바꾸기 전에 던지도록 순서를 지켰다.
 */
@Service
public class SessionService {

    /** NUMERIC(14,2)의 최대 = 정수 12자리 → 1조(10^12) 미만이어야 한다 */
    private static final BigDecimal SCORE_LIMIT = new BigDecimal("1000000000000");

    private final PlaySessionRepository sessionRepository;
    private final AppRepository appRepository;
    private final UserRepository userRepository;
    private final SessionStatsDao statsDao;
    private final AnomalyDetector anomalyDetector;
    private final Duration expireAfter;

    public SessionService(PlaySessionRepository sessionRepository, AppRepository appRepository,
                          UserRepository userRepository, SessionStatsDao statsDao, AnomalyDetector anomalyDetector,
                          @Value("${ranking.session.expire-minutes}") long expireMinutes) {
        this.sessionRepository = sessionRepository;
        this.appRepository = appRepository;
        this.userRepository = userRepository;
        this.statsDao = statsDao;
        this.anomalyDetector = anomalyDetector;
        this.expireAfter = Duration.ofMinutes(expireMinutes);
    }

    /**
     * 게임 시작 (SES-F01, F02).
     * 승인 앱 → OPEN 세션 기록. 승인 대기 앱 → 본인·관리자만 테스트 모드(기록 없음). 그 밖 → 앱 없음(404).
     */
    @Transactional
    public SessionStartResponse start(LoginUser loginUser, Long appId) {
        App app = appRepository.findWithCreatorById(appId)
                .orElseThrow(() -> new BusinessException(ErrorCode.APP_NOT_FOUND));

        if (app.getStatus() == AppStatus.PENDING && isCreatorOrAdmin(app, loginUser)) {
            return SessionStartResponse.testMode(appId);   // 미리보기: DB에 아무것도 남기지 않는다 (01 A1)
        }
        if (app.getStatus() != AppStatus.APPROVED) {
            // 반려 앱, 남의 승인 대기 앱: 존재를 숨기기 위해 "없음"으로 답한다 (03_11과 같은 규칙)
            throw new BusinessException(ErrorCode.APP_NOT_FOUND);
        }
        User user = userRepository.findById(loginUser.id())
                .orElseThrow(() -> new BusinessException(ErrorCode.UNAUTHORIZED));
        PlaySession session = sessionRepository.save(PlaySession.start(app, user, OffsetDateTime.now()));
        return SessionStartResponse.started(session.getId(), appId, session.getStartedAt());
    }

    /** 점수 제출 (SES-F03~F10) */
    @Transactional(noRollbackFor = BusinessException.class)
    public ScoreSubmitResponse submit(LoginUser loginUser, UUID sessionId, BigDecimal score) {
        PlaySession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new BusinessException(ErrorCode.SESSION_NOT_FOUND));

        // S-03 본인 세션
        if (!session.getUser().getId().equals(loginUser.id())) {
            throw new BusinessException(ErrorCode.SESSION_NOT_OWNED);
        }
        // S-01 이미 제출·만료된 세션
        if (session.getStatus() != SessionStatus.OPEN) {
            throw new BusinessException(ErrorCode.SESSION_ALREADY_SUBMITTED);
        }
        // S-02 만료: 그 자리에서 EXPIRED로 바꾸고 거부 (이 변경은 noRollbackFor 덕분에 저장된다)
        OffsetDateTime now = OffsetDateTime.now();
        Duration played = Duration.between(session.getStartedAt(), now);
        if (played.compareTo(expireAfter) > 0) {
            sessionRepository.expireIfOpen(sessionId);
            throw new BusinessException(ErrorCode.SESSION_EXPIRED);
        }
        // S-04 점수 형식 (DB를 바꾸기 전에 검사)
        validateScore(score);

        // 동시 제출 방지: OPEN일 때만 바뀐다. 0행이면 다른 요청이 먼저 제출한 것 (01 A2)
        if (sessionRepository.submitIfOpen(sessionId, score, now) == 0) {
            throw new BusinessException(ErrorCode.SESSION_ALREADY_SUBMITTED);
        }
        Long appId = session.getApp().getId();
        appRepository.incrementPlayCount(appId);

        // 이상값 검사 (거부하지 않고 표시만, 01 A3)
        App app = appRepository.findById(appId).orElseThrow();
        SessionStatsDao.Stats baseline = statsDao.baseline(appId, sessionId);
        boolean suspicious = anomalyDetector.isSuspicious(score, played.toMillis() / 1000.0, app.getMaxScore(), baseline);
        VerifyStatus verifyStatus = suspicious ? VerifyStatus.PENDING : VerifyStatus.NORMAL;
        if (suspicious) {
            sessionRepository.updateVerifyStatus(sessionId, VerifyStatus.PENDING);
        }
        return new ScoreSubmitResponse(sessionId, appId, score, now, verifyStatus);
    }

    /** S-04: 숫자, 0 이상, NUMERIC(14,2) 범위, 소수 둘째 자리까지 */
    private void validateScore(BigDecimal score) {
        if (score == null
                || score.signum() < 0
                || score.compareTo(SCORE_LIMIT) >= 0
                || score.stripTrailingZeros().scale() > 2) {   // 10.10은 통과, 10.123은 거부
            throw new BusinessException(ErrorCode.INVALID_SCORE);
        }
    }

    private boolean isCreatorOrAdmin(App app, LoginUser loginUser) {
        return loginUser.role() == UserRole.ADMIN || loginUser.id().equals(app.getCreator().getId());
    }
}
