package com.tinyarcade.dto.vote;


import com.tinyarcade.entity.vote.VoteType;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * POST /api/apps/{appId}/votes 요청 본문 (03_16 §3-1). 예: { "voteType": "RECOMMEND" }
 * voteType이 없으면 @NotNull 검사로 400 VALIDATION_ERROR, RECOMMEND·NOT_RECOMMEND가 아니면 JSON을 읽지 못해 400.
 */

@Getter
@NoArgsConstructor
public class VoteRequest {

    @NotNull(message = "추천 또는 비추천을 골라주세요.")
    private VoteType voteType;
}
