package com.tinyarcade.repository.vote;

import com.tinyarcade.entity.vote.AppVote;
import com.tinyarcade.entity.vote.AppVoteId;
import jakarta.persistence.LockModeType;
import lombok.extern.log4j.Log4j2;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

/**
 * app_votes 조회·저장 (03_16).
 *
 * [참고]
 * - JpaRepository<AppVote, AppVoteId>: 엔티티는 AppVote, 기본 키 타입은 AppVoteId(앱 번호 + 유저 번호).
 * - 저장은 saveAndFlush, 취소는 delete. JPA가 기본으로 준다.
 */
public interface AppVoteRepository extends JpaRepository<AppVote, AppVoteId> {
     /*
     * 내 표를 찾으면서 잠근다 (투표할 때 사용, 03_16 VOTE-N02).
     *
     * [참고] 왜 잠그나 (`@Lock(PESSIMISTIC_WRITE)` = SQL의 SELECT ... FOR UPDATE)
     * - 같은 사람이 버튼을 거의 동시에 두 번 누르면, 두 요청이 같은 "예전 표"를 보고 둘 다 숫자를 바꿔
     *   추천 수가 실제 표와 어긋난다(검증 중 실제로 -1이 나옴).
     * - 잠그면 두 번째 요청은 첫 번째가 끝날 때까지 기다렸다가 "바뀐 표"를 보고 처리한다. 한 줄로 서는 셈이다.
     * - 잠금은 이 유저의 이 앱 표 한 줄에만 걸린다. 다른 사람의 투표는 기다리지 않는다.
     */

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    //잠금을 걸고 읽기 (누가 동시에 바꿀 수 있으니 미리 잠가둠), @Transactional 끝날 때 자동 풀림
    @Query("select v from AppVote v where v.id = :id") // 넘겨 받은 id값을 위 조회문의 :id  자리에 넣음
    Optional<AppVote> findByIdForUpdate(@Param("id") AppVoteId id);

}
