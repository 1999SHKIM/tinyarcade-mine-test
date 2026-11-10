package com.tinyarcade.entity.vote;

import com.tinyarcade.entity.app.App;
import com.tinyarcade.entity.user.User;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;
import org.hibernate.annotations.UpdateTimestamp;
import org.springframework.data.domain.Persistable;

import java.time.OffsetDateTime;

/**
 * 추천·비추천 표 한 장 = 한 유저가 한 앱에 누른 표 (메인 §8 app_votes, 03_16).
 *
 * [참고] 왜 Persistable을 붙였나 (배포 확인 중 발견한 버그 수정)
 * - 스프링의 save는 "새 엔티티면 INSERT(persist), 아니면 있으면 덮어쓰기(merge)"로 동작한다.
 *   새것인지는 보통 "id가 비어 있나"로 판단한다.
 * - 그런데 표의 id(AppVoteId = 앱 번호 + 유저 번호)는 우리가 직접 채운다. 그래서 스프링이 새 표도
 *   "이미 있는 것"으로 보고 merge를 했다.
 * - 같은 사람이 거의 동시에 두 번 눌러 둘 다 "새로 저장"하면, 두 번째 요청이 "이미 있음" 오류 대신
 *   첫 표를 조용히 덮어쓰고 추천 수를 한 번 더 바꿨다 → 추천 수가 실제 표와 어긋남(배포 서버에서 재현).
 * - Persistable의 isNew()로 "생성 시각이 비어 있으면 새 표"라고 직접 알려 주면, 새 표는 항상 INSERT된다.
 *   동시에 겹치면 기본 키 충돌이 나고, VoteService의 catch가 409 VOTE_CONFLICT로 바꿔 준다.
 * - Persistable이 요구하는 getId()는 Lombok `@Getter`가 이미 만들어 준다.
 */
@Entity
@Table(name = "app_votes")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class AppVote implements Persistable<AppVoteId> {

    @EmbeddedId
    private AppVoteId id;

    @MapsId("appId")
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "app_id")
    @OnDelete(action = OnDeleteAction.CASCADE)
    private App app;

    @MapsId("userId")
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id")
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(name ="vote_type", nullable = false, length = 20)
    private VoteType voteType;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    //새 표만들기
    public static AppVote of(App app, User user, VoteType voteType) {
        AppVote vote = new AppVote();
        vote.id = new AppVoteId(app.getId(), user.getId());
        vote.app = app;
        vote.user = user;
        vote.voteType = voteType;
        return vote;
    }

    //추천 비추천 전환
    public void changeType(VoteType voteType) {
        this.voteType = voteType;
    }

    /**
     * 새 표인가 (Persistable). 생성 시각(createdAt)은 처음 저장할 때 `@CreationTimestamp`가 채운다.
     * - of()로 막 만든 표: createdAt이 null → 새 표 → INSERT
     * - DB에서 읽어 온 표: createdAt이 있음 → 새 표 아님
     */
    @Override
    public boolean isNew() {
        return createdAt == null;
    }

}
