package com.tinyarcade.repository.board;

import com.tinyarcade.entity.board.Post;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

/**
 * 게시글 테이블 조회·저장 (19번 게시판, 허 담당).
 */
public interface PostRepository extends JpaRepository<Post, Long> {

    @EntityGraph(attributePaths = "user")
    List<Post> findAllByOrderByIdDesc();

    @EntityGraph(attributePaths = "user")
    Optional<Post> findWithUserById(Long id);
}
