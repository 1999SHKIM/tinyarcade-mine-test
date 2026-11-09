package com.tinyarcade.dto.board;

import com.tinyarcade.entity.board.Comment;
import com.tinyarcade.entity.board.CommentTargetType;
import com.tinyarcade.entity.user.User;
import com.tinyarcade.entity.user.UserRole;
import com.tinyarcade.entity.user.UserStatus;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.List;

/**
 * 댓글·대댓글 응답 (frontend CommentItem / CommentReplyItem과 1:1 매핑).
 */
public record CommentResponse(
        Long id,
        CommentTargetType targetType,
        Long targetId,
        Long userId,
        String nickname,
        UserStatus userStatus,
        Boolean isAdmin,
        String content,
        String createdAt,
        List<ReplyResponse> replies
) {
    private static final DateTimeFormatter FORMATTER =
            DateTimeFormatter.ofPattern("yyyy.MM.dd HH:mm").withZone(ZoneId.of("Asia/Seoul"));

    public record ReplyResponse(
            Long id,
            Long parentId,
            Long userId,
            String nickname,
            UserStatus userStatus,
            Boolean isAdmin,
            String content,
            String createdAt
    ) {
        public static ReplyResponse from(Comment reply) {
            User author = reply.getUser();
            String nickname = author.getStatus() == UserStatus.WITHDRAWN ? "탈퇴한 유저" : author.getNickname();
            OffsetDateTime created = reply.getCreatedAt() != null ? reply.getCreatedAt() : OffsetDateTime.now();
            return new ReplyResponse(
                    reply.getId(),
                    reply.getParent() != null ? reply.getParent().getId() : null,
                    author.getId(),
                    nickname,
                    author.getStatus(),
                    author.getRole() == UserRole.ADMIN,
                    reply.getContent(),
                    FORMATTER.format(created)
            );
        }
    }

    public static CommentResponse from(Comment root, List<ReplyResponse> replies) {
        User author = root.getUser();
        String nickname = author.getStatus() == UserStatus.WITHDRAWN ? "탈퇴한 유저" : author.getNickname();
        OffsetDateTime created = root.getCreatedAt() != null ? root.getCreatedAt() : OffsetDateTime.now();
        return new CommentResponse(
                root.getId(),
                root.getTargetType(),
                root.getTargetId(),
                author.getId(),
                nickname,
                author.getStatus(),
                author.getRole() == UserRole.ADMIN,
                root.getContent(),
                FORMATTER.format(created),
                replies
        );
    }
}
