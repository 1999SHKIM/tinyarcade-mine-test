package com.tinyarcade.dto.board;

import com.tinyarcade.entity.board.CommentTargetType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * 댓글·대댓글 작성 요청 (19번 게시판, 허 담당).
 */
public record CommentRequest(
        @NotNull(message = "댓글 대상 구분이 필요합니다.")
        CommentTargetType targetType,

        Long targetId,

        Long parentId,

        @NotBlank(message = "댓글 내용을 입력해 주세요.")
        @Size(max = 1000, message = "댓글은 1,000자 이하로 입력해 주세요.")
        String content
) {
    public CommentRequest {
        if (content != null) content = content.trim();
    }
}
