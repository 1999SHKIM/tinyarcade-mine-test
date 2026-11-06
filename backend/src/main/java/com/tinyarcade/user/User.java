package com.tinyarcade.user;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.OffsetDateTime;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

/**
 * 유저 엔티티. 테이블 정의는 03_10_tinyarcade_auth §2 "데이터 모델 확정: users"와 1:1.
 * 탈퇴(메인 §4)는 실제 삭제가 아니라 상태 변경이다(20 마이페이지에서 구현).
 *
 * <h3>공부 포인트: JPA 엔티티</h3>
 * <ul>
 *   <li><b>@Entity</b>: 이 클래스 = DB 테이블 한 개. 객체 하나 = 행(row) 하나.
 *       application.yml의 {@code ddl-auto: update} 덕분에 서버가 켜질 때 이 클래스를 보고 테이블을 만든다.</li>
 *   <li><b>@Column(unique = true)</b>: DB에 UNIQUE 제약을 건다 → 같은 이메일·닉네임이 두 번 저장될 수 없다.</li>
 *   <li><b>@Enumerated(EnumType.STRING)</b>: enum을 숫자(0,1)가 아니라 이름("ADMIN")으로 저장한다.
 *       숫자로 저장하면 enum 순서를 바꿨을 때 데이터 의미가 바뀌는 사고가 난다.</li>
 *   <li><b>setter가 없다</b>: 아무 곳에서나 값을 바꾸지 못하게 막고, 바꿀 일은 의미 있는 메서드(signUp 등)로만 한다.</li>
 *   <li><b>@NoArgsConstructor(PROTECTED)</b>: JPA는 빈 생성자가 필요하지만, 다른 코드가 빈 객체를 함부로 만들지는 못하게 protected로 둔다.</li>
 * </ul>
 */
@Entity
@Table(name = "users")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)  // id는 DB가 1, 2, 3... 자동으로 매긴다 (BIGSERIAL)
    private Long id;

    @Column(nullable = false, unique = true, length = 150)
    private String email;          // 소문자로 저장 (AuthService), 탈퇴 시 '원래이메일#exit_{id}'

    @Column(name = "password_hash")
    private String passwordHash;   // BCrypt 해시. 원래 비밀번호는 어디에도 저장하지 않는다. 탈퇴 시 NULL

    @Column(nullable = false, unique = true, length = 50)
    private String nickname;       // 중복 금지 (03_10 §2), 탈퇴해도 그대로 유지

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private UserRole role = UserRole.USER;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private UserStatus status = UserStatus.ACTIVE;

    @Column(name = "is_mock", nullable = false)
    private boolean mock = false;  // 목데이터 유저 (메인 §6)

    @Column(name = "withdrawn_at")
    private OffsetDateTime withdrawnAt;

    @CreationTimestamp  // 처음 저장될 때 현재 시각을 자동으로 넣는다
    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @UpdateTimestamp    // 수정될 때마다 현재 시각으로 자동 갱신
    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    /**
     * 일반 가입 (권한 USER, 상태 ACTIVE).
     * "정적 팩토리 메서드": new User(...) 대신 이름 있는 메서드로 만들면 "가입으로 만든 유저"라는 의도가 드러난다.
     */
    public static User signUp(String email, String passwordHash, String nickname) {
        User user = new User();
        user.email = email;
        user.passwordHash = passwordHash;
        user.nickname = nickname;
        return user;
    }

    /** 로그인·쓰기 가능한 상태인가 (메인 §4: ACTIVE만 가능) */
    public boolean isActive() {
        return status == UserStatus.ACTIVE;
    }
}
