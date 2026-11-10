package com.tinyarcade.repository.app;

import com.tinyarcade.entity.app.AppThumbnail;
import java.util.Collection;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

/**
 * app_thumbnails 조회·저장 (03_11_tinyarcade_thumbnail).
 *
 * [참고]
 * - 기본 키가 앱 번호라서 findById(앱 번호) = "이 앱의 썸네일", existsById(앱 번호) = "썸네일이 있는가".
 * - findAppIdsIn: 목록 화면용. 이미지(data)는 읽지 않고 "썸네일이 있는 앱 번호"만 한 번에 가져온다(THM-N01).
 *   앱마다 하나씩 물어보면 앱 수만큼 쿼리가 나가므로 IN (...)으로 한 번에 묻는다.
 */
public interface AppThumbnailRepository extends JpaRepository<AppThumbnail, Long> {

    @Query("select t.appId from AppThumbnail t where t.appId in :appIds")
    List<Long> findAppIdsIn(@Param("appIds") Collection<Long> appIds);
}
