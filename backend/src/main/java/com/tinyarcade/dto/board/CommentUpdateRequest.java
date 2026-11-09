package com.tinyarcade.dto.board;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * 댓글·대댓글 수정 요청 (19번 게시판, 허 담당).
 */
public record CommentUpdateRequest(
        @NotBlank(message = "댓글 내용을 입력해 주세요.")
        @Size(max = 1000, message = "댓글은 1,000자 이하로 입력해 주세요.")
        String content
) {
    public CommentUpdateRequest {
        if (content != null) content = content.trim();
    }
}
