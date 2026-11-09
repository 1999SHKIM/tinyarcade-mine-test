package com.tinyarcade.config.security;

import com.tinyarcade.exception.ErrorCode;
import com.tinyarcade.repository.user.UserRepository;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

/**
 * 보안 설정: "어떤 주소를 누가 부를 수 있는가"를 정한다 (03_10_tinyarcade_auth §3 접근 규칙).
 *
 * <h3>공부 포인트</h3>
 * <ul>
 *   <li><b>Spring Security</b>는 모든 요청이 컨트롤러에 닿기 전에 "필터 체인"(검문소 줄)을 지나가게 한다.
 *       이 클래스는 그 검문소 줄을 어떻게 세울지 정하는 설정이다.</li>
 *   <li><b>@Configuration + @Bean</b>: 스프링이 시작할 때 이 메서드들을 실행해서 나온 객체를 보관해 두고,
 *       필요한 곳(예: AuthService의 PasswordEncoder)에 자동으로 넣어 준다(의존성 주입).</li>
 *   <li><b>JWT 방식은 "세션 없음(STATELESS)"</b>: 서버가 로그인 상태를 기억하지 않는다.
 *       대신 요청마다 함께 오는 토큰(출입증)을 보고 누구인지 판단한다.</li>
 * </ul>
 * 새 공개 경로(로그인 없이 조회 등)는 각 기능 작업에서 permitAll 줄에 추가한다.
 */
@Configuration
public class SecurityConfig {

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http, JwtProvider jwtProvider,
                                                   UserRepository userRepository) throws Exception {
        http
                // CSRF 방어는 "브라우저가 쿠키를 자동으로 보내는" 방식에서 필요하다.
                // 우리는 쿠키가 아니라 Authorization 헤더로 토큰을 직접 보내므로 끈다.
                .csrf(csrf -> csrf.disable())
                // 스프링 기본 로그인 화면·기본 인증 팝업·기본 로그아웃 주소는 쓰지 않는다 (우리 API로 대체)
                .formLogin(form -> form.disable())
                .httpBasic(basic -> basic.disable())
                .logout(logout -> logout.disable())
                // 서버 세션을 만들지 않는다 → 로그인 상태는 오직 토큰으로만 판단
                .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                // [11번] 스프링 기본값 X-Frame-Options: DENY("어떤 사이트도 iframe으로 띄우지 마라")를 끈다.
                // 게임 파일(/apps/**)은 사이트의 iframe 안에서 열려야 하기 때문이다.
                // 대신 어느 사이트에서만 띄울 수 있는지는 AppFileController가 frame-ancestors로 정한다 (APP-N03).
                // (이 서버의 나머지 응답은 JSON API라 화면이 없어서 iframe 보호가 필요 없다)
                .headers(h -> h.frameOptions(f -> f.disable()))
                // 접근 규칙: 위에서부터 순서대로 검사하고, 처음 맞는 줄이 적용된다
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/api/health", "/api/auth/**").permitAll()   // 누구나 (AUTH-F08)
                        // [11번] 앱: 내 앱은 로그인 필요, 목록·상세 조회는 누구나 (03_11 §3). /me를 먼저 적어야 아래 줄에 안 걸린다
                        .requestMatchers(HttpMethod.GET, "/api/apps/me").authenticated()
                        .requestMatchers(HttpMethod.GET, "/api/apps", "/api/apps/*").permitAll()
                        // [19번] 게시판·댓글: 목록·상세 조회는 누구나 열람 가능, 작성·수정·삭제는 로그인 필요 (메인 §7)
                        .requestMatchers(HttpMethod.GET, "/api/posts", "/api/posts/*", "/api/comments").permitAll()
                        .requestMatchers("/api/admin/**").hasRole("ADMIN")            // 관리자만 (AUTH-F07)
                        .requestMatchers("/api/**").authenticated()                   // 로그인 필요 (AUTH-F06)
                        .anyRequest().permitAll())                                    // /api 밖(게임 파일 등)은 누구나
                .exceptionHandling(e -> e
                        // AuthenticationEntryPoint: "로그인이 필요한데 안 되어 있음"일 때 호출된다.
                        // 정지·탈퇴 유저면 필터가 남긴 표시를 보고 403 USER_NOT_ACTIVE, 그 외에는 401 UNAUTHORIZED
                        .authenticationEntryPoint((request, response, ex) -> JsonErrorWriter.write(response,
                                request.getAttribute(JwtAuthenticationFilter.USER_NOT_ACTIVE_ATTR) != null
                                        ? ErrorCode.USER_NOT_ACTIVE : ErrorCode.UNAUTHORIZED))
                        // AccessDeniedHandler: "로그인은 했지만 권한이 부족함"(예: 일반 유저가 관리자 API)일 때 → 403
                        .accessDeniedHandler((request, response, ex) ->
                                JsonErrorWriter.write(response, ErrorCode.FORBIDDEN)))
                // 우리가 만든 JWT 검사 필터를 스프링 기본 로그인 필터 "앞"에 세운다
                // → 모든 요청이 접근 규칙 검사 전에 토큰 검사를 먼저 거친다
                .addFilterBefore(new JwtAuthenticationFilter(jwtProvider, userRepository),
                        UsernamePasswordAuthenticationFilter.class);
        return http.build();
    }

    /**
     * 비밀번호 해시 (AUTH-N01).
     * BCrypt는 같은 비밀번호라도 매번 다른 결과($2a$10$...)를 만드는 단방향 해시다.
     * 원래 비밀번호로 되돌릴 수 없고, 로그인할 때는 matches()로 "같은 비밀번호인지"만 확인한다.
     */
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    /**
     * 스프링 부트는 UserDetailsService가 없으면 연습용 임시 계정을 만들고 로그에 비밀번호를 찍는다.
     * 우리는 로그인을 AuthService에서 직접 처리하므로, "아무 계정도 없음"을 등록해 그 동작을 막는다.
     */
    @Bean
    public UserDetailsService userDetailsService() {
        return username -> {
            throw new UsernameNotFoundException(username);
        };
    }
}
