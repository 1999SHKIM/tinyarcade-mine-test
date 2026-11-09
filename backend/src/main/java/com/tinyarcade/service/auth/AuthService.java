package com.tinyarcade.service.auth;

import com.tinyarcade.dto.auth.LoginRequest;
import com.tinyarcade.dto.auth.LoginResponse;
import com.tinyarcade.dto.auth.SignupRequest;
import com.tinyarcade.dto.auth.SignupResponse;
import com.tinyarcade.exception.BusinessException;
import com.tinyarcade.exception.ErrorCode;
import com.tinyarcade.config.security.JwtProvider;
import com.tinyarcade.entity.user.User;
import com.tinyarcade.repository.user.UserRepository;
import java.util.Locale;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 가입·로그인의 실제 규칙을 처리한다. (컨트롤러는 요청을 받아 넘기기만 하고, 판단은 여기서 한다)
 *
 * [참고]
 * - @Service: 업무 규칙을 담는 클래스라고 스프링에 알린다.
 * - @Transactional: 이 메서드 안의 DB 작업을 "한 묶음"으로 처리한다.
 *   중간에 예외가 나면 앞서 한 작업도 모두 취소(rollback)된다.
 *   readOnly = true는 "읽기만 한다"는 표시로, DB가 조금 더 가볍게 처리한다.
 */
@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;  // SecurityConfig의 BCrypt
    private final JwtProvider jwtProvider;

    /** 회원가입 (AUTH-F01). 순서: 14세 확인 → 중복 확인 → 비밀번호 해시 → 저장 */
    @Transactional
    public SignupResponse signup(SignupRequest request) {
        // 형식·길이 검사는 컨트롤러의 @Valid가 이미 끝냈다. 14세 체크는 전용 오류 코드가 있어 여기서 확인
        if (!Boolean.TRUE.equals(request.ageConfirmed())) {   // null·false 모두 거부 (null-safe 비교)
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
            // saveAndFlush: 바로 DB에 INSERT를 보내서, UNIQUE 위반이 있으면 지금 이 자리에서 예외가 나게 한다
            User user = userRepository.saveAndFlush(
                    User.signUp(email, passwordEncoder.encode(request.password()), nickname));
            return SignupResponse.from(user);
        } catch (DataIntegrityViolationException e) {
            // 위의 exists 확인과 저장 사이에 다른 사람이 같은 값으로 먼저 가입하면(동시 요청) DB UNIQUE 제약에 걸린다.
            // 그때도 500 오류가 아니라 같은 409 오류로 응답한다.
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
        // Optional 체인: 유저가 없거나 / 비밀번호 해시가 없거나(탈퇴) / 비밀번호가 틀리면 → 모두 같은 오류
        User user = userRepository.findByEmail(normalizeEmail(request.email()))
                .filter(u -> u.getPasswordHash() != null)
                .filter(u -> passwordEncoder.matches(request.password(), u.getPasswordHash()))  // 입력값을 해시해 비교
                .orElseThrow(() -> new BusinessException(ErrorCode.INVALID_CREDENTIALS));
        if (!user.isActive()) {
            throw new BusinessException(ErrorCode.USER_NOT_ACTIVE);
        }
        return LoginResponse.of(jwtProvider.createToken(user.getId()), user);
    }

    /** 앞뒤 공백 제거 후 소문자 (03_10_tinyarcade_auth §3). "Kim@A.com"과 "kim@a.com"을 같은 이메일로 본다 */
    private String normalizeEmail(String email) {
        return email.trim().toLowerCase(Locale.ROOT);  // Locale.ROOT: 언어 설정에 따라 결과가 달라지는 것을 막는다
    }
}
