package com.tinyarcade.global.security;

import com.tinyarcade.user.UserRole;

/**
 * 로그인한 유저 정보. 컨트롤러에서 @AuthenticationPrincipal LoginUser loginUser 로 받는다.
 * 권한(role)은 토큰이 아니라 매 요청 DB에서 읽은 값이다.
 */
public record LoginUser(Long id, UserRole role) {
}
