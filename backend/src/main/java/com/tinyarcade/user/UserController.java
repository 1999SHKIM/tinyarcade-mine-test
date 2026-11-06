package com.tinyarcade.user;

import com.tinyarcade.global.error.BusinessException;
import com.tinyarcade.global.error.ErrorCode;
import com.tinyarcade.global.security.LoginUser;
import com.tinyarcade.user.dto.MeResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 유저 API. /api/users/** 는 로그인이 필요하다 (SecurityConfig).
 *
 * <h3>공부 포인트</h3>
 * <ul>
 *   <li><b>@RestController</b>: 메서드가 돌려준 객체를 JSON으로 바꿔 응답하는 컨트롤러.</li>
 *   <li><b>@RequiredArgsConstructor</b>(Lombok): final 필드를 받는 생성자를 자동으로 만든다
 *       → 스프링이 그 생성자로 UserRepository를 넣어 준다(생성자 주입).</li>
 *   <li><b>@AuthenticationPrincipal</b>: JwtAuthenticationFilter가 SecurityContext에 적어 둔 LoginUser를 꺼내 준다.
 *       그래서 컨트롤러는 토큰을 직접 해석하지 않는다.</li>
 * </ul>
 */
@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserRepository userRepository;

    /** 내 정보 (AUTH-F03). 프론트는 새로고침 때 이 API로 로그인 상태를 복원한다 */
    @GetMapping("/me")
    public MeResponse me(@AuthenticationPrincipal LoginUser loginUser) {
        User user = userRepository.findById(loginUser.id())
                .orElseThrow(() -> new BusinessException(ErrorCode.UNAUTHORIZED));
        return MeResponse.from(user);  // 엔티티를 그대로 내보내지 않고 필요한 칸만 담은 DTO로 바꾼다 (비밀번호 해시 노출 방지)
    }
}
