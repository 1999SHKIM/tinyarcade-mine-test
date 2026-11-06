package com.tinyarcade.service.user;

import com.tinyarcade.dto.user.MeResponse;
import com.tinyarcade.entity.user.User;
import com.tinyarcade.exception.BusinessException;
import com.tinyarcade.exception.ErrorCode;
import com.tinyarcade.repository.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 유저 업무 규칙.
 *
 * <h3>공부 포인트: 왜 controller에서 repository를 바로 부르지 않나?</h3>
 * 계층 구조(03_10_backend_structure-v1.1)에서는 요청이 controller → service → repository 순서로만 흐른다.
 * <ul>
 *   <li>controller는 "HTTP 요청을 받고 응답하는 일"만 한다.</li>
 *   <li>service는 "업무 규칙"(존재 확인, 권한·상태 판단, 트랜잭션, entity → dto 변환)을 한다.</li>
 * </ul>
 * 이렇게 나누면 같은 규칙을 다른 곳(예: 허의 마이페이지)에서 다시 쓸 때 service만 부르면 된다.
 */
@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;

    /** 내 정보 (AUTH-F03) */
    @Transactional(readOnly = true)
    public MeResponse getMe(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.UNAUTHORIZED));
        // 엔티티를 그대로 내보내지 않고 필요한 칸만 담은 DTO로 바꾼다 (비밀번호 해시 노출 방지)
        return MeResponse.from(user);
    }
}
