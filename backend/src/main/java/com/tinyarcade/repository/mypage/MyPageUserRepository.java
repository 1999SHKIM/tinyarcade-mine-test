package com.tinyarcade.repository.mypage;

import com.tinyarcade.entity.user.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

/**
 * 마이페이지 전용 유저 저장소 (20번 마이페이지, 허 담당).
 * 김의 User 엔티티를 직접 수정하지 않고 @Modifying @Query로 필요한 값만 업데이트한다.
 */
public interface MyPageUserRepository extends JpaRepository<User, Long> {

    /** 비밀번호 변경 (새 해시 저장 + 수정시각 갱신) */
    @Modifying(clearAutomatically = true)
    @Query("update User u set u.passwordHash = :newPasswordHash, u.updatedAt = CURRENT_TIMESTAMP where u.id = :id")
    int updatePassword(@Param("id") Long id, @Param("newPasswordHash") String newPasswordHash);

    /** 회원 탈퇴 처리 (이메일 exit 표기, 비밀번호 해시 null, WITHDRAWN 상태, 탈퇴/수정시각 갱신) */
    @Modifying(clearAutomatically = true)
    @Query("""
            update User u
               set u.email = :exitEmail,
                   u.passwordHash = null,
                   u.status = com.tinyarcade.entity.user.UserStatus.WITHDRAWN,
                   u.withdrawnAt = CURRENT_TIMESTAMP,
                   u.updatedAt = CURRENT_TIMESTAMP
             where u.id = :id
            """)
    int withdraw(@Param("id") Long id, @Param("exitEmail") String exitEmail);
}
