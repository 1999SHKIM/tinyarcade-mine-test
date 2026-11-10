package com.tinyarcade.entity.vote;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import java.io.Serializable;

/**
 * app_votes 테이블의 기본 키 = 앱 번호 + 유저 번호 (메인 §8 PRIMARY KEY (app_id, user_id)).
 *
 * [참고] 왜 키를 따로 클래스로 만드나
 * - 보통 엔티티는 id 칸 하나가 기본 키다. app_votes는 "앱 번호 + 유저 번호" 두 칸이 합쳐져야 한 줄을 구별한다.
 *   그래서 한 유저는 한 앱에 표를 하나만 가질 수 있다(1인 1표, DB가 보장).
 * - JPA에서는 두 칸짜리 키를 이렇게 작은 클래스(`@Embeddable`)로 묶어서 쓴다.
 * - record로 만들면 키 비교에 필요한 equals·hashCode가 자동으로 생긴다.
 * - Serializable: JPA가 키 클래스에 요구하는 규칙이다.
 */
@Embeddable
public record AppVoteId(
        @Column(name = "app_id") Long appId,
        @Column(name = "user_id") Long userId
) implements Serializable {
}