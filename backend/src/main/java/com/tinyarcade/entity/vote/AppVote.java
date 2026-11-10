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

import java.time.OffsetDateTime;

@Entity
@Table(name = "app_votes")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class AppVote {

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

}
