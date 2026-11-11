package com.tinyarcade.dto.ranking;

import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Getter;

/**
 * 마감·미리보기 결과 (03_17 §3-2).
 * - 마감(closeWeek): 이 내용이 first_place_records에 저장된 뒤 돌려준다.
 * - 미리보기(previewCurrentWeek): 저장하지 않고 계산 결과만 돌려준다.
 */
@Getter
@AllArgsConstructor
public class CloseResult {
    private final String periodKey;           // 예: 2026-W45
    private final boolean mockIncluded;       // 계산할 때 목데이터 토글 값
    private final int appCount;               // 비교 대상(모집단) 앱 수
    private final List<CloseRecord> records;  // 1등이 있는 앱마다 한 줄
}
