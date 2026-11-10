package com.tinyarcade.repository.admin;

import com.tinyarcade.entity.session.PlaySession;
import com.tinyarcade.entity.session.SessionStatus;
import com.tinyarcade.entity.session.VerifyStatus;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

/**
 * 어드민 전용 세션 저장소 (26번 이상값 검증 대기, 허 담당).
 */
public interface AdminSessionRepository extends JpaRepository<PlaySession, UUID> {

    /** status = SUBMITTED 이고 verifyStatus = PENDING 인 기록 목록 (최근 제출순, 앱과 유저 fetch) */
    @EntityGraph(attributePaths = {"app", "user"})
    List<PlaySession> findByStatusAndVerifyStatusOrderBySubmittedAtDesc(
            SessionStatus status, VerifyStatus verifyStatus);
}
