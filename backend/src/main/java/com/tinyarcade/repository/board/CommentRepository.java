package com.tinyarcade.repository.board;

import com.tinyarcade.entity.board.Comment;
import com.tinyarcade.entity.board.CommentTargetType;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

/**
 * 댓글·대댓글 테이블 조회·저장 (19번 게시판, 허 담당).
 */
public interface CommentRepository extends JpaRepository<Comment, Long> {

    @EntityGraph(attributePaths = {"user", "parent"})
    List<Comment> findByTargetTypeAndTargetIdOrderByIdAsc(CommentTargetType targetType, Long targetId);

    @EntityGraph(attributePaths = {"user", "parent"})
    List<Comment> findByTargetTypeAndTargetIdIsNullOrderByIdAsc(CommentTargetType targetType);

    @EntityGraph(attributePaths = {"user", "parent"})
    List<Comment> findByTargetTypeAndTargetIdIn(CommentTargetType targetType, Collection<Long> targetIds);

    @EntityGraph(attributePaths = {"user", "parent"})
    Optional<Comment> findWithUserById(Long id);

    void deleteByParentId(Long parentId);

    void deleteByTargetTypeAndTargetId(CommentTargetType targetType, Long targetId);
}
