package com.tinyarcade.dto.vote;

import com.tinyarcade.entity.vote.VoteType;
import lombok.AllArgsConstructor;
import lombok.Getter;

/**
 * 내 투표 상태 (03_16 결정 ②). 앱 상세 화면이 열릴 때 쓴다.
 *
 * [참고] boolean 칸의 이름
 * - Lombok `@Getter`는 boolean 칸 hasPlayed에 isHasPlayed()를 만든다. 서버(Jackson)는 앞의 is를 떼고
 *   JSON 칸 이름을 "hasPlayed"로 만든다. 그래서 화면이 받는 이름은 그대로다.
 */
@Getter
@AllArgsConstructor
public class MyVoteResponse {

    /** 내가 누른 표. 없거나 비로그인이면 null */
    private final VoteType myVote;
    /** 이 앱을 1번 이상 플레이(점수 제출)했는가. 비로그인이면 false */
    private final boolean hasPlayed;
}
