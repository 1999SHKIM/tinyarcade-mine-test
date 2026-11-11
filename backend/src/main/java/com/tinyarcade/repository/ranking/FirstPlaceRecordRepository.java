package com.tinyarcade.repository.ranking;

import com.tinyarcade.entity.ranking.FirstPlaceRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

/**
 * first_place_records 저장·삭제·간단 조회 (03_17).
 * 유저별 합산처럼 여러 줄을 묶는 계산은 dao(RankingDao)에서 SQL로 한다.
 */
public interface FirstPlaceRecordRepository extends JpaRepository<FirstPlaceRecord, Long> {

    /**
     * 재마감 전에 그 주차의 기존 기록 중 "지금 있는 앱"의 것만 지운다 (01 C2-5).
     * 앱이 삭제된 기록(app이 NULL)은 지우지 않고 보존한다 → 삭제된 앱의 확정 포인트는 그대로 남음.
     */
    @Modifying
    @Query("delete from FirstPlaceRecord r "
            + "where r.periodType = :periodType and r.periodKey = :periodKey and r.app is not null")
    int deleteLiveRecords(@Param("periodType") String periodType, @Param("periodKey") String periodKey);

    /** 이 주차가 이미 마감됐는가 (자동 마감의 "밀린 마감 확인"에 사용, 03_17 결정 ③) */
    boolean existsByPeriodTypeAndPeriodKey(String periodType, String periodKey);

    /**
     * 기록이 저장된 가장 최근 주차 키 (주간 랭킹 = 이 주차, 01 C1 "공개 판정").
     * 주차 키는 "2026-W05"처럼 숫자를 두 자리로 맞춰 두어서, 글자 순서로 비교해도 시간 순서와 같다.
     */
    @Query("select max(r.periodKey) from FirstPlaceRecord r where r.periodType = :periodType")
    String findLatestPeriodKey(@Param("periodType") String periodType);
}
