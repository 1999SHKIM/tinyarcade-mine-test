package com.tinyarcade.repository.session;

import com.tinyarcade.entity.session.PlaySession;
import com.tinyarcade.entity.session.VerifyStatus;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

/**
 * play_sessions 조회·저장.
 *
 * [참고] 조건부 UPDATE로 "동시 제출" 막기 (01 A2 S-01)
 * "읽어서 OPEN인지 확인 → 저장" 두 단계로 하면, 같은 세션 제출이 거의 동시에 두 번 오면
 * 둘 다 "OPEN이네?"를 읽고 둘 다 저장해 버릴 수 있다(경쟁 상태).
 * 그래서 확인과 변경을 SQL 한 줄로 합친다:
 *   UPDATE ... SET status='SUBMITTED' ... WHERE id = ? AND status = 'OPEN'
 * DB는 한 행을 한 번에 한 요청만 바꾸게 하므로, 먼저 온 요청만 1행을 바꾸고 늦은 요청은 0행이 된다.
 * → 돌아온 숫자가 1이면 성공, 0이면 "이미 제출됨".
 * - @Modifying: SELECT가 아니라 UPDATE·DELETE 쿼리라는 표시. 바뀐 행 수(int)를 돌려준다.
 * - clearAutomatically = true: UPDATE 쿼리는 JPA가 기억해 둔 엔티티(1차 캐시)를 거치지 않고 DB를 바로 바꾼다.
 *   그래서 쿼리 뒤에 캐시를 비워, 이후 조회가 DB의 새 값을 읽게 한다.
 */
public interface PlaySessionRepository extends JpaRepository<PlaySession, UUID> {

    /** 제출: 아직 OPEN일 때만 SUBMITTED로 바꾼다. 결과 1 = 성공, 0 = 이미 제출·만료됨 */
    @Modifying(clearAutomatically = true)
    @Query("""
            update PlaySession s
               set s.status = com.tinyarcade.entity.session.SessionStatus.SUBMITTED,
                   s.submittedAt = :now, s.score = :score
             where s.id = :id and s.status = com.tinyarcade.entity.session.SessionStatus.OPEN
            """)
    int submitIfOpen(@Param("id") UUID id, @Param("score") BigDecimal score, @Param("now") OffsetDateTime now);

    /** 만료 표시: 아직 OPEN일 때만 EXPIRED로 (01 A1 "제출이 들어오면 그 자리에서 EXPIRED로") */
    @Modifying(clearAutomatically = true)
    @Query("""
            update PlaySession s
               set s.status = com.tinyarcade.entity.session.SessionStatus.EXPIRED
             where s.id = :id and s.status = com.tinyarcade.entity.session.SessionStatus.OPEN
            """)
    int expireIfOpen(@Param("id") UUID id);

    /** 이상값 플래그 결과 저장 (PENDING) */
    @Modifying(clearAutomatically = true)
    @Query("update PlaySession s set s.verifyStatus = :verifyStatus where s.id = :id")
    int updateVerifyStatus(@Param("id") UUID id, @Param("verifyStatus") VerifyStatus verifyStatus);
}
