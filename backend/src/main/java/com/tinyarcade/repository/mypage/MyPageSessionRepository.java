package com.tinyarcade.repository.mypage;

import com.tinyarcade.dto.mypage.MyBestScoreResponse;
import com.tinyarcade.entity.session.PlaySession;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

/**
 * 마이페이지 전용 플레이 세션 저장소 (20번 마이페이지, 허 담당).
 */
public interface MyPageSessionRepository extends JpaRepository<PlaySession, UUID> {

    /**
     * 내 SUBMITTED 세션을 앱별로 묶어 최고 점수, 플레이 횟수, 마지막 제출 시각 조회.
     * 최근 플레이 순(lastPlayedAt desc)으로 정렬.
     */
    @Query("""
            select new com.tinyarcade.dto.mypage.MyBestScoreResponse(
                ps.app.id,
                ps.app.title,
                max(ps.score),
                count(ps),
                max(ps.submittedAt)
            )
            from PlaySession ps
            where ps.user.id = :userId
              and ps.status = com.tinyarcade.entity.session.SessionStatus.SUBMITTED
            group by ps.app.id, ps.app.title
            order by max(ps.submittedAt) desc
            """)
    List<MyBestScoreResponse> findMyBestScores(@Param("userId") Long userId);
}
