package com.tinyarcade.dto.leaderboard;

import com.tinyarcade.entity.session.VerifyStatus;
import com.tinyarcade.entity.user.UserStatus;
import java.math.BigDecimal;
import java.time.OffsetDateTime;

/**
 * 리더보드 한 줄 = 제출 기록 1건 (03_15 §3-1).
 * 칸 이름은 허의 frontend LeaderboardEntry 타입과 같다(LB-N01) → 허 타입·화면을 고치지 않아도 된다.
 *
 * @param id       세션 번호 (화면에서 줄을 구분하는 key)
 * @param nickname 탈퇴 유저는 "탈퇴한 유저" (서버에서 바꿈, LB-F09)
 * @param isMe     로그인한 사람의 기록이면 true
 */
public record LeaderboardEntryResponse(
        String id,
        int rank,
        Long userId,
        String nickname,
        UserStatus userStatus,
        BigDecimal score,
        OffsetDateTime submittedAt,
        VerifyStatus verifyStatus,
        boolean isMe
) {
}
