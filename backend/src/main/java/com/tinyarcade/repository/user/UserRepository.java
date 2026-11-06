package com.tinyarcade.repository.user;

import com.tinyarcade.entity.user.User;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

/**
 * users 테이블을 읽고 쓰는 창구.
 *
 * <h3>공부 포인트: Spring Data JPA</h3>
 * 인터페이스만 만들면 스프링이 구현을 자동으로 만들어 준다.
 * <ul>
 *   <li>JpaRepository&lt;User, Long&gt;을 상속하면 save, findById, findAll, delete 등이 공짜로 생긴다.</li>
 *   <li>메서드 이름 규칙으로 SQL이 만들어진다:
 *       {@code findByEmail} → {@code SELECT ... WHERE email = ?},
 *       {@code existsByNickname} → "그 닉네임이 있는가"(true/false).</li>
 * </ul>
 * 허의 마이페이지·유저 관리도 이 저장소를 가져다 쓴다 (03_10_backend_structure-v1.1 §3).
 */
public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);

    boolean existsByNickname(String nickname);
}
