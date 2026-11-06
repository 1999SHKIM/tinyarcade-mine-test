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
 * 모든 요청이 지나가는 "토큰 검문소" (AUTH-F05, 메인 §10).
 *
 * <h3>공부 포인트: 필터의 흐름</h3>
 * <pre>
 * 요청 → [이 필터] 토큰 확인 → 유저를 DB에서 조회 → ACTIVE면 "이 요청은 3번 유저" 표시
 *      → [접근 규칙 검사(SecurityConfig)] → 컨트롤러
 * </pre>
 * <ul>
 *   <li><b>OncePerRequestFilter</b>: 한 요청에 딱 한 번만 실행되는 필터를 만들 때 상속하는 스프링 클래스.</li>
 *   <li><b>SecurityContextHolder</b>: "지금 이 요청을 보낸 사람이 누구인지" 적어 두는 메모장.
 *       여기 적어 두면 접근 규칙 검사와 컨트롤러의 {@code @AuthenticationPrincipal}이 그 값을 읽는다.</li>
 *   <li><b>왜 매번 DB를 조회하나?</b> 토큰은 24시간 유효하다. 그 사이 관리자가 정지시켜도
 *       토큰만 보면 알 수 없다. 그래서 요청마다 DB의 현재 상태를 확인한다(메인 §10 "발급된 토큰도 요청 시 상태 확인").</li>
 *   <li><b>이 필터는 직접 거부하지 않는다.</b> 문제가 있으면 "누구인지 모름"으로 두기만 한다.
 *       거부는 로그인이 필요한 경로에서만 SecurityConfig의 EntryPoint가 한다.
 *       → 가입·로그인 같은 공개 경로는 브라우저에 오래된 토큰이 남아 있어도 정상 동작한다.</li>
 * </ul>
 * (스프링 빈(@Component)으로 만들지 않고 SecurityConfig에서 new로 만든다.
 *  빈으로 만들면 스프링이 일반 서블릿 필터로도 한 번 더 등록해 두 번 실행될 수 있기 때문)
 */
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    /** 유저가 ACTIVE가 아님을 EntryPoint에 알리는 표시 (요청 객체에 붙이는 메모) */
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
        // 프론트(axios)가 보낸 헤더: "Authorization: Bearer eyJhbGci..."
        String header = request.getHeader("Authorization");
        if (header != null && header.startsWith("Bearer ")) {
            jwtProvider.parseUserId(header.substring(7))   // "Bearer " 7글자 뒤가 토큰
                    .flatMap(userRepository::findById)      // 유저 ID → DB의 유저 (없으면 빈 값)
                    .ifPresent(user -> authenticate(request, user));
        }
        // 결과와 상관없이 다음 검문소로 넘긴다 (거부는 접근 규칙 단계에서)
        chain.doFilter(request, response);
    }

    private void authenticate(HttpServletRequest request, User user) {
        if (!user.isActive()) {
            // 정지·탈퇴: 인증 정보는 넣지 않고, 401 대신 403 USER_NOT_ACTIVE로 답하라고 표시만 남긴다
            request.setAttribute(USER_NOT_ACTIVE_ATTR, true);
            return;
        }
        LoginUser loginUser = new LoginUser(user.getId(), user.getRole());
        // 스프링 시큐리티는 권한 이름을 "ROLE_" + 이름으로 비교한다 → hasRole("ADMIN")은 "ROLE_ADMIN"을 찾는다
        var auth = new UsernamePasswordAuthenticationToken(loginUser, null,
                List.of(new SimpleGrantedAuthority("ROLE_" + user.getRole().name())));
        SecurityContextHolder.getContext().setAuthentication(auth);  // "이 요청은 loginUser"라고 메모
    }
}
