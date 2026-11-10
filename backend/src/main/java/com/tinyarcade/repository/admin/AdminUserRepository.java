package com.tinyarcade.repository.admin;

import com.tinyarcade.entity.user.User;
import com.tinyarcade.entity.user.UserStatus;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

/**
 * 어드민 전용 유저 저장소 (24번 유저 관리, 허 담당).
 */
public interface AdminUserRepository extends JpaRepository<User, Long> {

    /** 전체 유저 목록 (최근 가입순) */
    List<User> findAllByOrderByCreatedAtDesc();

    /** 유저 상태 변경 (ACTIVE <-> SUSPENDED) */
    @Modifying(clearAutomatically = true)
    @Query("update User u set u.status = :status, u.updatedAt = CURRENT_TIMESTAMP where u.id = :id")
    int updateStatus(@Param("id") Long id, @Param("status") UserStatus status);
}
