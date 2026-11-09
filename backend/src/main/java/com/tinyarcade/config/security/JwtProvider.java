package com.tinyarcade.config.security;

import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import java.time.Duration;
import java.time.Instant;
import java.util.Date;
import java.util.Optional;
import javax.crypto.SecretKey;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/**
 * JWT(Access 토큰) 발급·검증 담당.
 *
 * [참고] JWT 구조
 * 토큰은 점(.)으로 나뉜 3조각이다: 헤더.내용(payload).서명
 * - 내용(payload)은 암호화가 아니라 Base64 인코딩이라 누구나 읽을 수 있다.
 *   그래서 비밀번호 같은 민감한 정보는 넣지 않고 유저 ID(subject)와 만료 시각만 넣는다.
 * - 서명은 서버만 아는 비밀 키(JWT_SECRET)로 만든다. 내용을 한 글자라도 바꾸면 서명이 맞지 않아
 *   parseUserId에서 거부된다 → 위조 불가.
 * - 권한(USER/ADMIN)은 일부러 넣지 않았다. 매 요청 DB에서 읽어야 관리자 지정·정지가 즉시 반영되기 때문.
 * `@Component`: 스프링이 이 객체를 하나 만들어 두고 필요한 곳(AuthService, SecurityConfig)에 넣어 준다.
 */
@Component
public class JwtProvider {

    private final SecretKey key;      // 서명용 비밀 키
    private final Duration validity;  // 토큰 유효 기간 (24시간)

    /**
     * `@Value("${jwt.secret}")`: application.yml의 jwt.secret 값을 읽는다.
     * 그 값은 다시 환경변수 JWT_SECRET(로컬은 backend/.env, 배포는 Render)에서 온다 → 코드에 비밀값이 없다(AUTH-N02).
     */
    public JwtProvider(@Value("${jwt.secret}") String secret,
                       @Value("${jwt.expire-hours}") long expireHours) {
        // .env에는 Base64 문자열로 저장되어 있으므로 바이트로 되돌린 뒤 HMAC-SHA 서명 키로 만든다
        this.key = Keys.hmacShaKeyFor(Decoders.BASE64.decode(secret));
        this.validity = Duration.ofHours(expireHours);
    }

    /** 로그인 성공 시 호출: 유저 ID를 담은 토큰을 만든다 */
    public String createToken(Long userId) {
        Instant now = Instant.now();
        return Jwts.builder()
                .subject(String.valueOf(userId))            // 이 토큰의 주인 = 유저 ID
                .issuedAt(Date.from(now))                   // 발급 시각
                .expiration(Date.from(now.plus(validity)))  // 만료 시각 (지나면 자동 거부)
                .signWith(key)                              // 비밀 키로 서명
                .compact();                                 // "xxx.yyy.zzz" 문자열로 만들기
    }

    /**
     * 요청마다 호출: 서명·만료가 정상이면 유저 ID, 아니면 빈 값.
     * Optional은 "값이 있을 수도, 없을 수도 있음"을 나타내는 상자다. null 대신 써서 실수를 줄인다.
     */
    public Optional<Long> parseUserId(String token) {
        try {
            String subject = Jwts.parser().verifyWith(key).build()  // 같은 키로 서명 검증
                    .parseSignedClaims(token).getPayload().getSubject();
            return Optional.of(Long.valueOf(subject));
        } catch (JwtException | IllegalArgumentException e) {
            // 위조·만료·형식 오류 모두 여기로 온다 → "토큰 없음"과 똑같이 취급
            return Optional.empty();
        }
    }
}
