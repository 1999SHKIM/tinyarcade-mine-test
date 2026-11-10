package com.tinyarcade.repository.admin;

import com.tinyarcade.entity.app.App;
import com.tinyarcade.entity.app.AppStatus;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

/**
 * 어드민 전용 앱 저장소 (25번 앱 관리 · 26번 이상값 검증 대기, 허 담당).
 */
public interface AdminAppRepository extends JpaRepository<App, Long> {

    @EntityGraph(attributePaths = "creator")
    List<App> findAllByOrderByCreatedAtDesc();

    @EntityGraph(attributePaths = "creator")
    List<App> findByStatusOrderByCreatedAtDesc(AppStatus status);

    @EntityGraph(attributePaths = "creator")
    Optional<App> findWithCreatorById(Long id);

    /** [26번] 이상값 검증 대기 기록 삭제 시 play_count 1 감소 (0 아래로는 내려가지 않게) */
    @Modifying(clearAutomatically = true)
    @Query("update App a set a.playCount = case when a.playCount > 0 then a.playCount - 1 else 0 end where a.id = :appId")
    int decrementPlayCount(@Param("appId") Long appId);
}
