package com.tinyarcade.controller.board;

import com.tinyarcade.config.security.LoginUser;
import com.tinyarcade.dto.board.PostRequest;
import com.tinyarcade.dto.board.PostResponse;
import com.tinyarcade.service.board.BoardService;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

/**
 * 게시글 API (19번 게시판, 허 담당).
 */
@RestController
@RequestMapping("/api/posts")
@RequiredArgsConstructor
public class PostController {

    private final BoardService boardService;

    /** 게시글 목록 조회 (누구나) */
    @GetMapping
    public List<PostResponse> list() {
        return boardService.getPosts();
    }

    /** 게시글 단건 조회 (누구나) */
    @GetMapping("/{postId}")
    public PostResponse detail(@PathVariable Long postId) {
        return boardService.getPost(postId);
    }

    /** 게시글 작성 (로그인 필요, FAQ는 관리자만) */
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public PostResponse create(@AuthenticationPrincipal LoginUser loginUser,
                               @Valid @RequestBody PostRequest request) {
        return boardService.createPost(loginUser, request);
    }

    /** 게시글 수정 (작성자 본인만) */
    @PutMapping("/{postId}")
    public PostResponse update(@PathVariable Long postId,
                               @AuthenticationPrincipal LoginUser loginUser,
                               @Valid @RequestBody PostRequest request) {
        return boardService.updatePost(postId, loginUser, request);
    }

    /** 게시글 삭제 (작성자 본인 또는 관리자) */
    @DeleteMapping("/{postId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long postId,
                       @AuthenticationPrincipal LoginUser loginUser) {
        boardService.deletePost(postId, loginUser);
    }
}
