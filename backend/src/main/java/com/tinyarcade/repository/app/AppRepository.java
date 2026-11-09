package com.tinyarcade.repository.app;

import com.tinyarcade.entity.app.App;
import com.tinyarcade.entity.app.AppStatus;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

/**
 * apps 테이블 조회·저장.
 *
 * <h3>공부 포인트</h3>
 * <ul>
 *   <li>메서드 이름 규칙: {@code findByStatusOrderByRecommendCountDescApprovedAtDesc}
 *       → "status가 ?인 것을 추천수 내림차순, 같으면 승인 시각 내림차순으로" SQL이 자동으로 만들어진다.</li>
 *   <li><b>@EntityGraph(attributePaths = "creator")</b>: 앱 목록을 읽을 때 크리에이터(유저)도 한 번에 JOIN해서 읽는다.
 *       없으면 앱 N개마다 유저 조회가 1번씩 더 나가는 "N+1 문제"가 생긴다.</li>
 * </ul>
 */
public interface AppRepository extends JpaRepository<App, Long> {

    /** 공개 목록: 승인된 앱, 추천순 → 최근 승인순 (03_11 §2) */
    @EntityGraph(attributePaths = "creator")
    List<App> findByStatusOrderByRecommendCountDescApprovedAtDesc(AppStatus status);

    /** 내 앱: 최근 등록순 */
    @EntityGraph(attributePaths = "creator")
    List<App> findByCreatorIdOrderByCreatedAtDesc(Long creatorId);

    /** 상세 (크리에이터 닉네임까지 함께) */
    @EntityGraph(attributePaths = "creator")
    Optional<App> findWithCreatorById(Long id);

    /** 게임 파일 전달: 주소의 deployKey로 앱 찾기 */
    Optional<App> findByDeployKey(UUID deployKey);
}
