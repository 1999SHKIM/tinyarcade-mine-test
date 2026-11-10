package com.tinyarcade.dto.vote;


import com.tinyarcade.entity.vote.VoteType;
import lombok.AllArgsConstructor;
import lombok.Getter;

/**
 * 투표 결과 (03_16 §3-1). 화면은 이 숫자로 버튼과 개수를 바꾸면 된다(화면이 직접 +1/-1 계산하지 않음).
 *
 * [참고] 응답 DTO를 class로 만들 때
 * - `@AllArgsConstructor`: 모든 칸을 받는 생성자 → new VoteResponse(myVote, 추천 수, 비추천 수)
 * - `@Getter`: getMyVote() 등이 생기고, 서버(Jackson)는 이 이름으로 JSON 칸(myVote ...)을 만든다.
 * - 한 번 만든 뒤 바꿀 일이 없으므로 칸에 final을 붙인다.
 */

@Getter
@AllArgsConstructor
public class VoteResponse {
    /** 지금 내 표. 취소했으면 null */
    private final VoteType myVote;
    private final int recommendCount;
    private final int notRecommendCount;
    
}
