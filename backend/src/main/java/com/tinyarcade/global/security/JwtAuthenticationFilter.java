package com.tinyarcade.global.security;

import com.tinyarcade.user.User;
import com.tinyarcade.user.UserRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.List;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

/**
 * 요청마다 토큰을 확인하고, 토큰의 유저를 DB에서 읽어 상태·권한을 확인한다 (AUTH-F05, 메인 §10).
 * 토큰이 없거나 잘못됐거나 유저가 ACTIVE가 아니면 인증 정보를 넣지 않는다.
 * → 로그인이 필요한 경로에서만 SecurityConfig의 EntryPoint가 401/403을 응답한다.
 *   (가입·로그인 같은 공개 경로는 오래된 토큰이 남아 있어도 그대로 동작)
 */
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    /** 유저가 ACTIVE가 아님을 EntryPoint에 알리는 표시 */
    public static final String USER_NOT_ACTIVE_ATTR = "tinyarcade.userNotActive";

    private final JwtProvider jwtProvider;
    private final UserRepository userRepository;

    public JwtAuthenticationFilter(JwtProvider jwtProvider, UserRepository userRepository) {
        this.jwtProvider = jwtProvider;
        this.userRepository = userRepository;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
                                    FilterChain chain) throws ServletException, IOException {
        String header = request.getHeader("Authorization");
        if (header != null && header.startsWith("Bearer ")) {
            jwtProvider.parseUserId(header.substring(7))
                    .flatMap(userRepository::findById)
                    .ifPresent(user -> authenticate(request, user));
        }
        chain.doFilter(request, response);
    }

    private void authenticate(HttpServletRequest request, User user) {
        if (!user.isActive()) {
            request.setAttribute(USER_NOT_ACTIVE_ATTR, true);
            return;
        }
        LoginUser loginUser = new LoginUser(user.getId(), user.getRole());
        var auth = new UsernamePasswordAuthenticationToken(loginUser, null,
                List.of(new SimpleGrantedAuthority("ROLE_" + user.getRole().name())));
        SecurityContextHolder.getContext().setAuthentication(auth);
    }
}
