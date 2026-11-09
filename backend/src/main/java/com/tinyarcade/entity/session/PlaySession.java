package com.tinyarcade.entity.session;

import com.tinyarcade.entity.app.App;
import com.tinyarcade.entity.user.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

/**
 * 플레이 세션 = 게임 한 판. 제출된 세션 하나가 리더보드 한 줄이 된다.
 * 테이블 정의는 03_12_tinyarcade_session §2 "데이터 모델 확정: play_sessions"(= 메인 §8 그대로)와 1:1.
 *
 * [참고]
 * - id가 UUID인 이유: 세션 ID는 게임에게 전달된다. 1, 2, 3 같은 번호면 남의 세션 번호를 쉽게 짐작할 수 있다.
 * - @OnDelete(CASCADE): DB에 "앱이 지워지면 그 앱의 세션도 함께 지워라" 규칙(ON DELETE CASCADE)을 만든다.
 *   메인 §5 "앱 삭제 시 리더보드도 함께 삭제".
 * - 상태를 바꾸는 메서드가 없는 이유: 제출은 "아직 OPEN일 때만" 바꿔야 해서(동시 제출 방지)
 *   엔티티 메서드 대신 Repository의 조건부 UPDATE 쿼리로 한다(PlaySessionRepository.submitIfOpen).
 */
@Entity
@Table(name = "play_sessions")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class PlaySession {

    @Id
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "app_id", nullable = false)
    @OnDelete(action = OnDeleteAction.CASCADE)
    private App app;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private int season;

    @Column(name = "started_at", nullable = false)
    private OffsetDateTime startedAt;

    @Column(name = "submitted_at")
    private OffsetDateTime submittedAt;

    @Column(precision = 14, scale = 2)
    private BigDecimal score;              // 높을수록 상위 (메인 §5 점수 방향)

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private SessionStatus status = SessionStatus.OPEN;

    @Enumerated(EnumType.STRING)
    @Column(name = "verify_status", nullable = false, length = 20)
    private VerifyStatus verifyStatus = VerifyStatus.NORMAL;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    /** 게임 시작: OPEN 세션 (시즌은 시작 시점 앱의 현재 시즌, MVP는 1) */
    public static PlaySession start(App app, User user, OffsetDateTime now) {
        PlaySession session = new PlaySession();
        session.id = UUID.randomUUID();
        session.app = app;
        session.user = user;
        session.season = app.getCurrentSeason();
        session.startedAt = now;
        return session;
    }
}
