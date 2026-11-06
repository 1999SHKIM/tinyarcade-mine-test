package com.tinyarcade.global.security;

import com.tinyarcade.global.error.ErrorCode;
import com.tinyarcade.user.UserRepository;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

/**
 * 접근 규칙 (03_10_tinyarcade_auth §3).
 * 새 공개 경로(로그인 없이 조회 등)는 각 기능 작업에서 permitAll 줄에 추가한다.
 */
@Configuration
public class SecurityConfig {

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http, JwtProvider jwtProvider,
                                                   UserRepository userRepository) throws Exception {
        http
                .csrf(csrf -> csrf.disable())
                .formLogin(form -> form.disable())
                .httpBasic(basic -> basic.disable())
                .logout(logout -> logout.disable())
                .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/api/health", "/api/auth/**").permitAll()
                        .requestMatchers("/api/admin/**").hasRole("ADMIN")
                        .requestMatchers("/api/**").authenticated()
                        .anyRequest().permitAll())
                .exceptionHandling(e -> e
                        // 로그인 필요: 정지·탈퇴면 403 USER_NOT_ACTIVE, 그 외 401 UNAUTHORIZED
                        .authenticationEntryPoint((request, response, ex) -> JsonErrorWriter.write(response,
                                request.getAttribute(JwtAuthenticationFilter.USER_NOT_ACTIVE_ATTR) != null
                                        ? ErrorCode.USER_NOT_ACTIVE : ErrorCode.UNAUTHORIZED))
                        // 로그인했지만 권한 부족: 403 FORBIDDEN
                        .accessDeniedHandler((request, response, ex) ->
                                JsonErrorWriter.write(response, ErrorCode.FORBIDDEN)))
                .addFilterBefore(new JwtAuthenticationFilter(jwtProvider, userRepository),
                        UsernamePasswordAuthenticationFilter.class);
        return http.build();
    }

    /** 비밀번호 해시 (AUTH-N01) */
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    /** Spring 기본 임시 계정(로그에 비밀번호 출력)을 만들지 않게 한다. 로그인은 AuthService가 처리 */
    @Bean
    public UserDetailsService userDetailsService() {
        return username -> {
            throw new UsernameNotFoundException(username);
        };
    }
}
