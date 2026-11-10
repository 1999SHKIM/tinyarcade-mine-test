package com.tinyarcade.entity.vote;


/**
 * 표 종류 (메인 §5 "평가: 추천·비추천").
 * 글자는 허의 frontend VoteType('RECOMMEND' | 'NOT_RECOMMEND')과 같다.
 */
public enum VoteType {
    RECOMMEND,
    NOT_RECOMMEND
}
