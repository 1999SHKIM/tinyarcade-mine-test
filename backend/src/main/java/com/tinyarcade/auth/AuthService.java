package com.tinyarcade.auth;

import com.tinyarcade.auth.dto.LoginRequest;
import com.tinyarcade.auth.dto.LoginResponse;
import com.tinyarcade.auth.dto.SignupRequest;
import com.tinyarcade.auth.dto.SignupResponse;
import com.tinyarcade.global.error.BusinessException;
import com.tinyarcade.global.error.ErrorCode;
import com.tinyarcade.global.security.JwtProvider;
import com.tinyarcade.user.User;
import com.tinyarcade.user.UserRepository;
import java.util.Locale;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtProvider jwtProvider;

    /** 회원가입 (AUTH-F01) */
    @Transactional
    public SignupResponse signup(SignupRequest request) {
        if (!Boolean.TRUE.equals(request.ageConfirmed())) {
            throw new BusinessException(ErrorCode.AGE_NOT_CONFIRMED);
        }
        String email = normalizeEmail(request.email());
        String nickname = request.nickname(); // 요청 객체에서 이미 공백 제거·길이 검사됨
        if (userRepository.existsByEmail(email)) {
            throw new BusinessException(ErrorCode.EMAIL_DUPLICATE);
        }
        if (userRepository.existsByNickname(nickname)) {
            throw new BusinessException(ErrorCode.NICKNAME_DUPLICATE);
        }
        try {
            User user = userRepository.saveAndFlush(
                    User.signUp(email, passwordEncoder.encode(request.password()), nickname));
            return SignupResponse.from(user);
        } catch (DataIntegrityViolationException e) {
            // 같은 값으로 동시에 가입한 경우 DB UNIQUE 제약에 걸린다 → 같은 409 오류로 응답
            // (PostgreSQL 메시지 "Key (email)=..." 로 어느 칸인지 구분)
            String detail = String.valueOf(e.getMostSpecificCause().getMessage());
            throw new BusinessException(detail.contains("(email)")
                    ? ErrorCode.EMAIL_DUPLICATE : ErrorCode.NICKNAME_DUPLICATE);
        }
    }

    /**
     * 로그인 (AUTH-F02, F04).
     * 이메일·비밀번호가 맞을 때만 상태를 확인한다 → 틀린 비밀번호로 정지 여부를 알아낼 수 없다 (AUTH-N05).
     */
    @Transactional(readOnly = true)
    public LoginResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(normalizeEmail(request.email()))
                .filter(u -> u.getPasswordHash() != null)
                .filter(u -> passwordEncoder.matches(request.password(), u.getPasswordHash()))
                .orElseThrow(() -> new BusinessException(ErrorCode.INVALID_CREDENTIALS));
        if (!user.isActive()) {
            throw new BusinessException(ErrorCode.USER_NOT_ACTIVE);
        }
        return LoginResponse.of(jwtProvider.createToken(user.getId()), user);
    }

    /** 앞뒤 공백 제거 후 소문자 (03_10_tinyarcade_auth §3) */
    private String normalizeEmail(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }
}
