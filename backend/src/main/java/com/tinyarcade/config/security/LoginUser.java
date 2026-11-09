package com.tinyarcade.config.security;

import com.tinyarcade.entity.user.UserRole;

/**
 * 로그인한 유저 정보. 컨트롤러에서 @AuthenticationPrincipal LoginUser loginUser로 받는다.
 *
 * [참고] record
 * Java 16부터 생긴 record는 "값만 담는 상자"를 한 줄로 만든다.
 * 생성자, getter(이름은 id(), role()), equals/hashCode/toString을 자동으로 만들어 주고, 값을 바꿀 수 없다.
 *
 * 권한(role)은 토큰이 아니라 매 요청 DB에서 읽은 값이다(JwtAuthenticationFilter).
 */
public record LoginUser(Long id, UserRole role) {
}
