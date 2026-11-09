package com.tinyarcade.entity.app;

import com.tinyarcade.entity.user.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
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
import org.hibernate.annotations.UpdateTimestamp;

/**
 * 타이니앱. 테이블 정의는 03_11_tinyarcade_app §2 "데이터 모델 확정: apps"(= 메인 §8 초안 그대로)와 1:1.
 *
 * <h3>공부 포인트</h3>
 * <ul>
 *   <li><b>@ManyToOne</b>: "앱 여러 개 → 크리에이터(유저) 한 명" 관계. DB에는 creator_id(외래 키) 칸으로 저장된다.
 *       {@code fetch = LAZY}: 앱을 읽을 때 유저까지 바로 읽지 않고, 실제로 creator를 쓸 때 읽는다(불필요한 조회 방지).</li>
 *   <li><b>commitSha</b>: 등록하는 순간 게임 레포의 기본 브랜치 최신 커밋 번호. 이후 레포가 바뀌어도
 *       플랫폼은 항상 이 번호의 파일만 보여 준다(메인 §5 "등록 시점의 커밋으로 고정").</li>
 *   <li><b>deployKey (UUID)</b>: 게임 파일 주소 /apps/{deployKey}/... 에 쓰는 추측할 수 없는 값.
 *       id(1, 2, 3...)를 주소에 쓰면 남의 미리보기를 번호만 바꿔 열어 볼 수 있기 때문이다(메인 §5 "미리보기 접근").</li>
 *   <li><b>BigDecimal</b>: max_score는 NUMERIC(14,2). double은 0.1 같은 소수를 정확히 못 담아서 돈·점수에는 BigDecimal을 쓴다.</li>
 * </ul>
 */
@Entity
@Table(name = "apps")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class App {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "creator_id", nullable = false)
    private User creator;

    @Column(nullable = false, length = 100)
    private String title;

    @Column(nullable = false, length = 500)
    private String description;

    @Column(name = "repo_url", nullable = false, length = 300)
    private String repoUrl;          // 정규화된 주소: https://github.com/{owner}/{repo}

    @Column(name = "commit_sha", nullable = false, length = 40)
    private String commitSha;        // 등록 시 고정

    @Column(name = "entry_path", nullable = false, length = 200)
    private String entryPath;        // 진입 HTML (레포 루트 기준)

    @Column(name = "deploy_key", nullable = false, unique = true)
    private UUID deployKey;          // 게임 파일 주소용 (추측 불가)

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private AppStatus status = AppStatus.PENDING;

    @Column(name = "reject_reason", length = 300)
    private String rejectReason;

    @Column(name = "is_official", nullable = false)
    private boolean official = false;   // 공식 앱 뱃지 (관리자가 DB에서 지정)

    @Column(name = "is_mock", nullable = false)
    private boolean mock = false;

    @Column(name = "max_score", precision = 14, scale = 2)
    private BigDecimal maxScore;        // 선택. NULL이면 상한 검사 생략 (01 A3 R-MAX)

    @Column(name = "current_season", nullable = false)
    private int currentSeason = 1;

    @Column(name = "recommend_count", nullable = false)
    private int recommendCount = 0;

    @Column(name = "not_recommend_count", nullable = false)
    private int notRecommendCount = 0;

    @Column(name = "play_count", nullable = false)
    private int playCount = 0;          // SUBMITTED 세션 수 (12번에서 증가)

    @Column(name = "approved_at")
    private OffsetDateTime approvedAt;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    /** 등록 (상태 PENDING, 새 deployKey 발급) */
    public static App register(User creator, String title, String description, String repoUrl,
                               String commitSha, String entryPath, BigDecimal maxScore) {
        App app = new App();
        app.creator = creator;
        app.title = title;
        app.description = description;
        app.repoUrl = repoUrl;
        app.commitSha = commitSha;
        app.entryPath = entryPath;
        app.maxScore = maxScore;
        app.deployKey = UUID.randomUUID();   // 무작위 128비트 값 → 사실상 추측 불가
        return app;
    }

    /** 관리자 승인 (어드민 작업에서 사용, 허 담당) */
    public void approve() {
        this.status = AppStatus.APPROVED;
        this.rejectReason = null;
        this.approvedAt = OffsetDateTime.now();
    }

    /** 관리자 반려 (어드민 작업에서 사용, 허 담당) */
    public void reject(String reason) {
        this.status = AppStatus.REJECTED;
        this.rejectReason = reason;
    }

    public boolean isApproved() {
        return status == AppStatus.APPROVED;
    }
}
