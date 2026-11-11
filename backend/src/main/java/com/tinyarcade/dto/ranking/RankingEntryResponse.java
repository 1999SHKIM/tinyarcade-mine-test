package com.tinyarcade.dto.ranking;

import java.math.BigDecimal;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Getter;

/**
 * 유저 랭킹 한 줄 (03_17 §3-1). 칸 이름은 허 화면 타입 OverallRankingEntry와 같다(결정 ④).
 *
 * [참고] handle, highlightNote가 항상 null인 이유
 * - 허 화면 타입에는 있지만 우리 서비스에는 없는 값이다(아이디 핸들, 화면용 강조 문구).
 * - 서버가 없는 값을 지어내지 않고 null로 보낸다. 허 화면은 null이면 그 자리를 비워 둔다.
 *
 * [참고] isMe를 boolean이 아니라 Boolean(감싼 타입)으로 둔 이유
 * - Lombok은 boolean(기본형) 필드 isMe의 getter를 isMe()로 만든다. JSON 변환기(Jackson)는 isXxx() 모양을 보면
 *   앞의 is를 떼고 "me"라는 칸 이름으로 내보낸다 → 허 화면이 기다리는 "isMe"가 아니게 된다.
 * - Boolean(대문자)이면 Lombok이 getIsMe()를 만들고, Jackson은 get을 떼서 "isMe"로 내보낸다.
 * - (구현 중 확인: 처음엔 boolean + `@JsonProperty("isMe")`로 했더니 JSON에 "isMe"와 "me"가 둘 다 나왔다)
 */
@Getter
@AllArgsConstructor
public class RankingEntryResponse {
    private final int rank;                     // 동점이면 같은 순위 (1, 1, 3)
    private final Long userId;
    private final String nickname;              // 탈퇴 유저는 "탈퇴한 유저"
    private final String handle;                // 항상 null
    private final BigDecimal totalPoints;       // 100 × 계수 합
    private final int firstPlaceCount;          // 1등 기록 수
    private final List<String> firstPlaceApps;  // 1등 한 앱 이름들, 삭제된 앱은 "삭제된 앱"
    private final String highlightNote;         // 항상 null
    private final Boolean isMe;                 // 로그인한 내 줄인가 (true / false)
}
