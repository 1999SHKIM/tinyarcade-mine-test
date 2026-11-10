package com.tinyarcade.controller.vote;


import com.tinyarcade.config.security.LoginUser;
import com.tinyarcade.dto.vote.MyVoteResponse;
import com.tinyarcade.dto.vote.VoteRequest;
import com.tinyarcade.dto.vote.VoteResponse;
import com.tinyarcade.service.vote.VoteService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

/**
 * 추천·비추천 API (03_16 §3-1).
 *
 * [참고]
 * - POST(투표)는 로그인이 필요하다. SecurityConfig의 "/api/** 로그인 필요" 규칙을 그대로 따른다.
 * - GET .../votes/me(내 투표 상태)는 누구나 부를 수 있다. 로그인하지 않았으면 loginUser가 null로 들어온다.
 */

@RestController
@RequiredArgsConstructor
public class VoteController {

    private final VoteService voteService;

    /* 투표 (토글) → 200 { myVote, recommendCount, notRecommendCount } */
    @PostMapping("/api/apps/{appId}/votes")
    public VoteResponse vote(@AuthenticationPrincipal LoginUser loginUser,
                             @PathVariable Long appId,
                             @Valid @RequestBody VoteRequest request) {
        return voteService.vote(loginUser, appId, request.getVoteType());
    }

    /* 내 투표 상태 → 200 { myVote, hasPlayed } */
    @GetMapping("/api/apps/{appId}/votes/me")
    public MyVoteResponse myVote(@AuthenticationPrincipal LoginUser loginUser,
                                 @PathVariable Long appId) {
        return voteService.getMyVote(loginUser, appId);
    }
}
