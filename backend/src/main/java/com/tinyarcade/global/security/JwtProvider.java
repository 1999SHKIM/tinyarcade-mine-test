package com.tinyarcade.global.security;

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

/** JWT(Access 토큰) 발급·검증. 토큰에는 유저 ID(subject)와 만료 시각만 담는다. */
@Component
public class JwtProvider {

    private final SecretKey key;
    private final Duration validity;

    public JwtProvider(@Value("${jwt.secret}") String secret,
                       @Value("${jwt.expire-hours}") long expireHours) {
        this.key = Keys.hmacShaKeyFor(Decoders.BASE64.decode(secret));
        this.validity = Duration.ofHours(expireHours);
    }

    public String createToken(Long userId) {
        Instant now = Instant.now();
        return Jwts.builder()
                .subject(String.valueOf(userId))
                .issuedAt(Date.from(now))
                .expiration(Date.from(now.plus(validity)))
                .signWith(key)
                .compact();
    }

    /** 서명·만료가 정상이면 유저 ID, 아니면 빈 값 */
    public Optional<Long> parseUserId(String token) {
        try {
            String subject = Jwts.parser().verifyWith(key).build()
                    .parseSignedClaims(token).getPayload().getSubject();
            return Optional.of(Long.valueOf(subject));
        } catch (JwtException | IllegalArgumentException e) {
            return Optional.empty();
        }
    }
}
