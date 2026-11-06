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

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserRepository userRepository;

    /** 내 정보 (AUTH-F03) */
    @GetMapping("/me")
    public MeResponse me(@AuthenticationPrincipal LoginUser loginUser) {
        User user = userRepository.findById(loginUser.id())
                .orElseThrow(() -> new BusinessException(ErrorCode.UNAUTHORIZED));
        return MeResponse.from(user);
    }
}
