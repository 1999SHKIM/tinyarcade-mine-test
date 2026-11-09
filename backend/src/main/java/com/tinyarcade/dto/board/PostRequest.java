package com.tinyarcade.dto.board;

import com.tinyarcade.entity.board.BoardType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * 게시글 작성·수정 요청 (19번 게시판, 허 담당).
 */
public record PostRequest(
        @NotNull(message = "게시판 분류를 선택해 주세요.")
        BoardType boardType,

        @NotBlank(message = "게시글 제목을 입력해 주세요.")
        @Size(max = 200, message = "제목은 200자 이하로 입력해 주세요.")
        String title,

        @NotBlank(message = "게시글 본문 내용을 입력해 주세요.")
        @Size(max = 20000, message = "본문은 20,000자 이하로 입력해 주세요.")
        String content
) {
    public PostRequest {
        if (title != null) title = title.trim();
        if (content != null) content = content.trim();
    }
}
