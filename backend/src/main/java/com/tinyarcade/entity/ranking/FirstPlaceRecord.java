package com.tinyarcade.entity.ranking;

import com.tinyarcade.entity.app.App;
import com.tinyarcade.entity.user.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

/**
 * 앱별 주간 1등 확정 기록 = 유저 랭킹의 원재료 (메인 §8 first_place_records, 03_17).
 * 한 줄 = "이 주차에 이 앱의 1등은 이 유저였고, 마감 당시 계수는 얼마였다".
 *
 * [참고] 앱이 삭제돼도 기록을 남기는 방법 (허 요청, 메인 §5·§6)
 * - app 칸에 `@OnDelete(SET_NULL)`을 붙였다 → DB에 "앱이 지워지면 이 칸만 NULL로 바꿔라"(ON DELETE SET NULL) 규칙이 생긴다.
 *   그래서 1등 기록이 있는 앱도 삭제가 막히지 않고, 기록 줄은 그대로 남는다.
 * - 앱이 지워지면 어떤 앱이었는지 알 수 없으므로, 만들 때 원래 앱 번호(originalAppId)와 제목(appTitleSnapshot)을
 *   따로 복사해 둔다. originalAppId는 일부러 외래 키로 만들지 않았다(앱이 없어져도 값이 남아야 하므로).
 * - 같은 앱·같은 주차 기록은 하나만(UNIQUE). 기준을 app_id가 아니라 original_app_id로 잡아서,
 *   앱이 지워진 뒤에도 중복 방지가 유지된다(01 C2-9).
 *
 * [참고] 왜 수정 메서드가 없나
 * - 확정 기록은 고정이다(01 D3 "마감 이후 추천수·참여자수가 바뀌어도 재계산하지 않음").
 *   바꿔야 할 때는 재마감이 기존 줄을 지우고 새로 만든다(of로만 생성).
 */
@Entity
@Table(name = "first_place_records",
        uniqueConstraints = @UniqueConstraint(columnNames = {"original_app_id", "period_type", "period_key"}))
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class FirstPlaceRecord {

    /** 지금은 주간만 있다 (SEASON은 Next MVP, 메인 §8) */
    public static final String PERIOD_WEEK = "WEEK";

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;                       // 1등 유저

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "app_id")             // NULL 허용: 앱이 삭제되면 NULL
    @OnDelete(action = OnDeleteAction.SET_NULL)
    private App app;

    @Column(name = "original_app_id", nullable = false)
    private Long originalAppId;              // 원래 앱 번호 (외래 키 아님)

    @Column(name = "app_title_snapshot", nullable = false, length = 100)
    private String appTitleSnapshot;         // 마감 당시 앱 제목

    @Column(name = "period_type", nullable = false, length = 10)
    private String periodType;               // 'WEEK'

    @Column(name = "period_key", nullable = false, length = 20)
    private String periodKey;                // 예: 2026-W45

    @Column(name = "recommend_at_close", nullable = false)
    private int recommendAtClose;            // 마감 당시 앱 추천 수 (누적값)

    @Column(name = "participants_at_close", nullable = false)
    private int participantsAtClose;         // 그 주차 참여자 수 (동점 처리에도 씀, 01 D4)

    @Column(name = "app_count_at_close", nullable = false)
    private int appCountAtClose;             // 계수 계산에 쓴 모집단 앱 수

    @Column(name = "mock_included", nullable = false)
    private boolean mockIncluded;            // 마감 당시 목데이터 토글 값 (01 E)

    @Column(nullable = false, precision = 10, scale = 4)
    private BigDecimal coefficient;          // 계수 (소수 4자리). 포인트 = 100 × coefficient (조회 때 계산)

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    /** 주간 1등 기록 만들기 (마감 때만 호출) */
    public static FirstPlaceRecord weekly(User user, App app, String periodKey, int recommendAtClose,
                                          int participantsAtClose, int appCountAtClose,
                                          boolean mockIncluded, BigDecimal coefficient) {
        FirstPlaceRecord record = new FirstPlaceRecord();
        record.user = user;
        record.app = app;
        record.originalAppId = app.getId();
        record.appTitleSnapshot = app.getTitle();
        record.periodType = PERIOD_WEEK;
        record.periodKey = periodKey;
        record.recommendAtClose = recommendAtClose;
        record.participantsAtClose = participantsAtClose;
        record.appCountAtClose = appCountAtClose;
        record.mockIncluded = mockIncluded;
        record.coefficient = coefficient;
        return record;
    }
}
