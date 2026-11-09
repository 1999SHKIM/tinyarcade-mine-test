package com.tinyarcade.service.board;

import com.tinyarcade.config.security.LoginUser;
import com.tinyarcade.dto.board.CommentRequest;
import com.tinyarcade.dto.board.CommentResponse;
import com.tinyarcade.dto.board.CommentUpdateRequest;
import com.tinyarcade.dto.board.PostRequest;
import com.tinyarcade.dto.board.PostResponse;
import com.tinyarcade.entity.board.BoardType;
import com.tinyarcade.entity.board.Comment;
import com.tinyarcade.entity.board.CommentTargetType;
import com.tinyarcade.entity.board.Post;
import com.tinyarcade.entity.user.User;
import com.tinyarcade.entity.user.UserRole;
import com.tinyarcade.exception.BusinessException;
import com.tinyarcade.exception.ErrorCode;
import com.tinyarcade.repository.board.CommentRepository;
import com.tinyarcade.repository.board.PostRepository;
import com.tinyarcade.repository.user.UserRepository;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 게시판·댓글 업무 규칙 (19번 게시판, 허 담당).
 */
@Service
@RequiredArgsConstructor
public class BoardService {

    private final PostRepository postRepository;
    private final CommentRepository commentRepository;
    private final UserRepository userRepository;

    /** 게시글 전체 목록 (최신순, 댓글 수 및 문의 답변완료 여부 포함) */
    @Transactional(readOnly = true)
    public List<PostResponse> getPosts() {
        List<Post> posts = postRepository.findAllByOrderByIdDesc();
        if (posts.isEmpty()) {
            return List.of();
        }
        List<Long> postIds = posts.stream().map(Post::getId).toList();
        List<Comment> comments = commentRepository.findByTargetTypeAndTargetIdIn(CommentTargetType.POST, postIds);

        Map<Long, Integer> countMap = new HashMap<>();
        Map<Long, Boolean> adminReplyMap = new HashMap<>();
        for (Comment c : comments) {
            Long postId = c.getTargetId();
            if (postId == null) continue;
            countMap.merge(postId, 1, Integer::sum);
            if (c.getUser().getRole() == UserRole.ADMIN) {
                adminReplyMap.put(postId, true);
            }
        }

        return posts.stream()
                .map(post -> PostResponse.from(
                        post,
                        countMap.getOrDefault(post.getId(), 0),
                        adminReplyMap.getOrDefault(post.getId(), false)
                ))
                .toList();
    }

    /** 게시글 단건 상세 조회 */
    @Transactional(readOnly = true)
    public PostResponse getPost(Long postId) {
        Post post = postRepository.findWithUserById(postId)
                .orElseThrow(() -> new BusinessException(ErrorCode.POST_NOT_FOUND));
        List<Comment> comments = commentRepository.findByTargetTypeAndTargetIdOrderByIdAsc(
                CommentTargetType.POST, postId);
        int count = comments.size();
        boolean hasAdminReply = comments.stream().anyMatch(c -> c.getUser().getRole() == UserRole.ADMIN);
        return PostResponse.from(post, count, hasAdminReply);
    }

    /** 게시글 작성 (로그인 필요, FAQ는 관리자만 가능) */
    @Transactional
    public PostResponse createPost(LoginUser loginUser, PostRequest request) {
        requireLogin(loginUser);
        if (request.boardType() == BoardType.FAQ && loginUser.role() != UserRole.ADMIN) {
            throw new BusinessException(ErrorCode.FORBIDDEN);
        }
        User author = userRepository.findById(loginUser.id())
                .orElseThrow(() -> new BusinessException(ErrorCode.UNAUTHORIZED));
        Post saved = postRepository.save(
                Post.create(request.boardType(), author, request.title(), request.content()));
        return PostResponse.from(saved, 0, false);
    }

    /** 게시글 수정 (작성자 본인만 가능, FAQ 분류 지정은 관리자만 가능) */
    @Transactional
    public PostResponse updatePost(Long postId, LoginUser loginUser, PostRequest request) {
        requireLogin(loginUser);
        Post post = postRepository.findWithUserById(postId)
                .orElseThrow(() -> new BusinessException(ErrorCode.POST_NOT_FOUND));
        if (!post.getUser().getId().equals(loginUser.id())) {
            throw new BusinessException(ErrorCode.FORBIDDEN);
        }
        if (request.boardType() == BoardType.FAQ && loginUser.role() != UserRole.ADMIN) {
            throw new BusinessException(ErrorCode.FORBIDDEN);
        }
        post.update(request.boardType(), request.title(), request.content());
        List<Comment> comments = commentRepository.findByTargetTypeAndTargetIdOrderByIdAsc(
                CommentTargetType.POST, postId);
        int count = comments.size();
        boolean hasAdminReply = comments.stream().anyMatch(c -> c.getUser().getRole() == UserRole.ADMIN);
        return PostResponse.from(post, count, hasAdminReply);
    }

    /** 게시글 삭제 (작성자 본인 또는 관리자) */
    @Transactional
    public void deletePost(Long postId, LoginUser loginUser) {
        requireLogin(loginUser);
        Post post = postRepository.findWithUserById(postId)
                .orElseThrow(() -> new BusinessException(ErrorCode.POST_NOT_FOUND));
        if (!post.getUser().getId().equals(loginUser.id()) && loginUser.role() != UserRole.ADMIN) {
            throw new BusinessException(ErrorCode.FORBIDDEN);
        }
        commentRepository.deleteByTargetTypeAndTargetId(CommentTargetType.POST, postId);
        postRepository.delete(post);
    }

    /** 댓글·대댓글 트리 목록 조회 */
    @Transactional(readOnly = true)
    public List<CommentResponse> getComments(CommentTargetType targetType, Long targetId) {
        List<Comment> raw = fetchRawComments(targetType, targetId);
        return buildCommentTree(raw);
    }

    /** 댓글·대댓글 작성 (로그인 필요, FAQ 게시글 댓글 불가, 대댓글 1단계 제한) */
    @Transactional
    public List<CommentResponse> createComment(LoginUser loginUser, CommentRequest request) {
        requireLogin(loginUser);
        Long normalizedTargetId = request.targetType() == CommentTargetType.RANKING ? null : request.targetId();

        if (request.targetType() != CommentTargetType.RANKING && normalizedTargetId == null) {
            throw new BusinessException(ErrorCode.VALIDATION_ERROR);
        }

        if (request.targetType() == CommentTargetType.POST) {
            Post post = postRepository.findById(normalizedTargetId)
                    .orElseThrow(() -> new BusinessException(ErrorCode.POST_NOT_FOUND));
            if (post.getBoardType() == BoardType.FAQ) {
                throw new BusinessException(ErrorCode.FORBIDDEN);
            }
        }

        Comment parent = null;
        if (request.parentId() != null) {
            parent = commentRepository.findWithUserById(request.parentId())
                    .orElseThrow(() -> new BusinessException(ErrorCode.COMMENT_NOT_FOUND));
            if (parent.getParent() != null) {
                throw new BusinessException(ErrorCode.VALIDATION_ERROR);
            }
        }

        User author = userRepository.findById(loginUser.id())
                .orElseThrow(() -> new BusinessException(ErrorCode.UNAUTHORIZED));

        commentRepository.save(Comment.create(
                request.targetType(),
                normalizedTargetId,
                parent,
                author,
                request.content()
        ));

        return getComments(request.targetType(), normalizedTargetId);
    }

    /** 댓글·대댓글 수정 (작성자 본인만 가능) */
    @Transactional
    public CommentResponse.ReplyResponse updateComment(Long commentId, LoginUser loginUser,
                                                       CommentUpdateRequest request) {
        requireLogin(loginUser);
        Comment comment = commentRepository.findWithUserById(commentId)
                .orElseThrow(() -> new BusinessException(ErrorCode.COMMENT_NOT_FOUND));
        if (!comment.getUser().getId().equals(loginUser.id())) {
            throw new BusinessException(ErrorCode.FORBIDDEN);
        }
        comment.update(request.content());
        return CommentResponse.ReplyResponse.from(comment);
    }

    /** 댓글·대댓글 삭제 (작성자 본인만 가능) */
    @Transactional
    public void deleteComment(Long commentId, LoginUser loginUser) {
        requireLogin(loginUser);
        Comment comment = commentRepository.findWithUserById(commentId)
                .orElseThrow(() -> new BusinessException(ErrorCode.COMMENT_NOT_FOUND));
        if (!comment.getUser().getId().equals(loginUser.id())) {
            throw new BusinessException(ErrorCode.FORBIDDEN);
        }
        commentRepository.deleteByParentId(comment.getId());
        commentRepository.delete(comment);
    }

    private void requireLogin(LoginUser loginUser) {
        if (loginUser == null) {
            throw new BusinessException(ErrorCode.UNAUTHORIZED);
        }
    }

    private List<Comment> fetchRawComments(CommentTargetType targetType, Long targetId) {
        if (targetType == CommentTargetType.RANKING || targetId == null) {
            return commentRepository.findByTargetTypeAndTargetIdIsNullOrderByIdAsc(targetType);
        }
        return commentRepository.findByTargetTypeAndTargetIdOrderByIdAsc(targetType, targetId);
    }

    private List<CommentResponse> buildCommentTree(List<Comment> all) {
        List<Comment> roots = new ArrayList<>();
        Map<Long, List<CommentResponse.ReplyResponse>> repliesMap = new HashMap<>();

        for (Comment c : all) {
            if (c.getParent() == null) {
                roots.add(c);
            } else {
                Long parentId = c.getParent().getId();
                repliesMap.computeIfAbsent(parentId, k -> new ArrayList<>())
                        .add(CommentResponse.ReplyResponse.from(c));
            }
        }

        // 루트 댓글은 최신순(위쪽), 대댓글은 작성순(아래쪽)
        roots.sort(Comparator.comparing(Comment::getId).reversed());

        return roots.stream()
                .map(root -> CommentResponse.from(root, repliesMap.getOrDefault(root.getId(), List.of())))
                .toList();
    }
}
