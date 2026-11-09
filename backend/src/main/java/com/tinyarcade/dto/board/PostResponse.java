package com.tinyarcade.dto.board;

import com.tinyarcade.entity.board.BoardType;
import com.tinyarcade.entity.board.Post;
import com.tinyarcade.entity.user.User;
import com.tinyarcade.entity.user.UserRole;
import com.tinyarcade.entity.user.UserStatus;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;

/**
 * 게시글 응답 (frontend PostItem과 1:1 매핑).
 */
public record PostResponse(
        Long id,
        BoardType boardType,
        Long userId,
        String nickname,
        UserRole userRole,
        UserStatus userStatus,
        String title,
        String content,
        int views,
        int commentCount,
        Boolean isAnswered,
        Boolean isPinned,
        String createdAt,
        String updatedAt
) {
    private static final DateTimeFormatter FORMATTER =
            DateTimeFormatter.ofPattern("yyyy.MM.dd HH:mm").withZone(ZoneId.of("Asia/Seoul"));

    public static PostResponse from(Post post, int commentCount, boolean hasAdminReply) {
        User author = post.getUser();
        String nickname = author.getStatus() == UserStatus.WITHDRAWN ? "탈퇴한 유저" : author.getNickname();
        Boolean isAnswered = post.getBoardType() == BoardType.INQUIRY ? hasAdminReply : null;
        Boolean isPinned = post.getBoardType() == BoardType.FAQ;

        OffsetDateTime created = post.getCreatedAt() != null ? post.getCreatedAt() : OffsetDateTime.now();
        OffsetDateTime updated = post.getUpdatedAt();
        String createdStr = FORMATTER.format(created);
        String updatedStr = (updated != null && updated.isAfter(created.plusSeconds(2)))
                ? FORMATTER.format(updated)
                : null;

        return new PostResponse(
                post.getId(),
                post.getBoardType(),
                author.getId(),
                nickname,
                author.getRole(),
                author.getStatus(),
                post.getTitle(),
                post.getContent(),
                0,
                commentCount,
                isAnswered,
                isPinned,
                createdStr,
                updatedStr
        );
    }
}
