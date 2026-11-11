package com.tinyarcade.service.ranking;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.anyDouble;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.reset;

import com.tinyarcade.dto.ranking.CloseRecord;
import com.tinyarcade.dto.ranking.CloseResult;
import com.tinyarcade.dto.ranking.RankingEntryResponse;
import com.tinyarcade.dto.ranking.RankingPeriod;
import com.tinyarcade.dto.ranking.RankingResponse;
import com.tinyarcade.exception.BusinessException;
import com.tinyarcade.exception.ErrorCode;
import com.tinyarcade.repository.ranking.FirstPlaceRecordRepository;
import com.tinyarcade.service.admin.AdminAppService;
import com.tinyarcade.service.leaderboard.WeekRange;
import com.tinyarcade.service.setting.SettingService;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.context.bean.override.mockito.MockitoSpyBean;
import org.springframework.transaction.support.TransactionTemplate;

/**
 * 주간 마감·1등 선정·랭킹 테스트 (01_core_logic_ranking F1, 03_17 §6).
 * F1-13·14(계수 숫자)는 CoefficientCalculatorTest에 있다.
 *
 * [참고] 왜 로컬 DB에 실제로 저장하는 테스트인가
 * - 마감은 SQL(잠금, 집계)과 트랜잭션 롤백이 핵심이라 DB 없이 확인할 수 없다.
 * - 테스트 전체를 `@Transactional`로 감싸면 "중간 오류 → 롤백"(F1-07·17)이나 "동시 마감"(F1-06)을 확인할 수 없다.
 *   그래서 데이터를 실제로 저장하고, 각 테스트가 끝나면 `@AfterEach`에서 지운다.
 * - 테스트 데이터 번호: 유저 980001~980009, 앱 980101~980103. 주차는 2026-W20~W39(지난 주차라 실제 데이터와 겹치지 않음).
 * - 로컬 DB가 켜져 있어야 한다(BackendApplicationTests와 같음). 배포용 Docker 빌드는 테스트를 건너뛴다(bootJar -x test).
 *
 * [참고] `@MockitoBean`, `@MockitoSpyBean`
 * - `@MockitoBean` CloseScheduler: 진짜 스케줄러 대신 아무 일도 안 하는 가짜를 넣는다 → 테스트 중 자동 마감이 끼어들지 않는다.
 *   스케줄러를 확인하는 테스트(F1-11·17)는 new로 직접 만들어 쓴다.
 * - `@MockitoSpyBean` CoefficientCalculator: 평소에는 진짜처럼 동작하고, 원하는 테스트에서만 "오류를 던져라"고 바꿀 수 있다
 *   → 마감 도중 오류(F1-07·17)를 일부러 만든다. 테스트가 끝나면 원래대로 돌아간다.
 */
@SpringBootTest
@DisplayName("주간 마감·1등 선정·랭킹 (01 F1)")
class WeeklyCloseServiceTest {

    // 유저
    static final long CREATOR = 980001, U2 = 980002, U3 = 980003, U4 = 980004;
    static final long SUSPENDED = 980005, WITHDRAWN = 980006, MOCK_USER = 980007, TIE_A = 980008, TIE_B = 980009;
    // 앱 (A·B 크리에이터 = CREATOR, M = 목 앱)
    static final long A = 980101, B = 980102, M = 980103;

    @MockitoBean CloseScheduler schedulerBean;
    @MockitoSpyBean CoefficientCalculator calculator;

    @Autowired WeeklyCloseService closeService;
    @Autowired RankingService rankingService;
    @Autowired SettingService settingService;
    @Autowired AdminAppService adminAppService;
    @Autowired FirstPlaceRecordRepository recordRepository;
    @Autowired JdbcTemplate jdbc;
    @Autowired TransactionTemplate tx;

    private List<String> savedToggle;   // 테스트 전 토글 값 (행이 없었으면 빈 목록)

    @BeforeEach
    void setUp() {
        cleanUp();
        savedToggle = jdbc.queryForList("select setting_value from system_settings where setting_key = 'MOCK_DATA_ENABLED'", String.class);
        settingService.setMockEnabled(false);
        user(CREATOR, "ACTIVE", false);
        user(U2, "ACTIVE", false);
        user(U3, "ACTIVE", false);
        user(U4, "ACTIVE", false);
        user(SUSPENDED, "SUSPENDED", false);
        user(WITHDRAWN, "WITHDRAWN", false);
        user(MOCK_USER, "ACTIVE", true);
        user(TIE_A, "ACTIVE", false);
        user(TIE_B, "ACTIVE", false);
        app(A, CREATOR, 10, false);
        app(B, CREATOR, 2, false);
        app(M, MOCK_USER, 7, true);
    }

    @AfterEach
    void tearDown() {
        cleanUp();
        // 토글을 테스트 전 상태로 되돌린다 (행이 없었으면 행도 지움)
        if (savedToggle.isEmpty()) {
            jdbc.update("delete from system_settings where setting_key = 'MOCK_DATA_ENABLED'");
        } else {
            settingService.setMockEnabled(Boolean.parseBoolean(savedToggle.get(0)));
        }
    }

    // ---------------------------------------------------------------- 1등 선정 (C3)

    @Test
    @DisplayName("F1-01 리더보드 1위가 크리에이터 본인이면 다음 적격자가 1등")
    void closeWeek_creatorIsTop_picksNextUser() {
        play(A, CREATOR, 1000, at("2026-W30", 1, 10), "NORMAL");
        play(A, U2, 500, at("2026-W30", 1, 11), "NORMAL");

        CloseResult result = closeService.closeWeek("2026-W30");

        assertEquals(U2, recordOf(result, A).getUserId());
    }

    @Test
    @DisplayName("F1-02 1위가 정지·탈퇴·목 유저면 ACTIVE 다음 적격자가 1등")
    void closeWeek_inactiveOrMockTop_picksActiveUser() {
        play(A, SUSPENDED, 900, at("2026-W30", 1, 10), "NORMAL");
        play(A, WITHDRAWN, 850, at("2026-W30", 1, 10), "NORMAL");
        play(A, MOCK_USER, 800, at("2026-W30", 1, 10), "NORMAL");
        play(A, U3, 100, at("2026-W30", 1, 10), "NORMAL");

        CloseResult result = closeService.closeWeek("2026-W30");

        assertEquals(U3, recordOf(result, A).getUserId());
    }

    @Test
    @DisplayName("F1-03 1위가 PENDING인 채 마감하면 APPROVED로 바뀌고 1등 (점수 같으면 먼저 제출한 사람)")
    void closeWeek_pendingTop_approvesAndPicks() {
        play(A, U2, 500, at("2026-W30", 1, 10), "PENDING");
        play(A, U3, 500, at("2026-W30", 1, 11), "NORMAL");

        CloseResult result = closeService.closeWeek("2026-W30");

        assertEquals(U2, recordOf(result, A).getUserId());
        assertEquals(0, count("select count(*) from play_sessions where app_id = ? and verify_status = 'PENDING'", A));
    }

    @Test
    @DisplayName("F1-04 한 유저가 여러 줄을 차지해도 그 앱 1등 기록은 1건")
    void closeWeek_sameUserManyRows_oneRecord() {
        play(B, U4, 200, at("2026-W30", 1, 10), "NORMAL");
        play(B, U4, 250, at("2026-W30", 2, 10), "NORMAL");
        play(B, U3, 100, at("2026-W30", 2, 10), "NORMAL");

        closeService.closeWeek("2026-W30");

        assertEquals(1, count("select count(*) from first_place_records where period_key = '2026-W30' and original_app_id = ?", B));
    }

    // ---------------------------------------------------------------- 재마감·동시 실행·오류 (C2)

    @Test
    @DisplayName("F1-05 같은 주차를 두 번 마감하면 기록이 교체되고 중복 없음")
    void closeWeek_twice_noDuplicate() {
        play(A, U2, 500, at("2026-W31", 1, 10), "NORMAL");
        play(B, U4, 200, at("2026-W31", 1, 10), "NORMAL");

        closeService.closeWeek("2026-W31");
        closeService.closeWeek("2026-W31");

        assertEquals(2, count("select count(*) from first_place_records where period_key = '2026-W31'"));
    }

    @Test
    @DisplayName("F1-06 같은 주차 마감이 동시에 오면 잠금으로 한 줄로 처리 (대기 확인, 오류·중복 없음)")
    void closeWeek_concurrent_serializedByLock() throws Exception {
        play(A, U2, 500, at("2026-W31", 1, 10), "NORMAL");
        ExecutorService pool = Executors.newFixedThreadPool(6);
        try {
            // 1) 다른 트랜잭션이 같은 주차 이름표를 1.5초 잡고 있으면, closeWeek는 그동안 기다린다
            Future<?> holder = pool.submit(() -> tx.executeWithoutResult(status -> {
                jdbc.query("select pg_advisory_xact_lock(hashtext('2026-W31'))", rs -> { });
                sleep(1500);
            }));
            sleep(300);   // holder가 먼저 잡도록
            long start = System.currentTimeMillis();
            closeService.closeWeek("2026-W31");
            long waited = System.currentTimeMillis() - start;
            holder.get();
            assertTrue(waited >= 1000, "잠금 때문에 기다려야 함: " + waited + "ms");

            // 2) 6개를 동시에 실행해도 오류 없이 기록 1건
            List<Future<CloseResult>> futures = new ArrayList<>();
            for (int i = 0; i < 6; i++) {
                futures.add(pool.submit(() -> closeService.closeWeek("2026-W31")));
            }
            for (Future<CloseResult> future : futures) {
                future.get();   // 오류가 났으면 여기서 예외
            }
        } finally {
            pool.shutdown();
        }
        assertEquals(1, count("select count(*) from first_place_records where period_key = '2026-W31'"));
    }

    @Test
    @DisplayName("F1-07 재마감 중 오류가 나면 롤백되어 기존 결과가 그대로 남음")
    void closeWeek_errorDuringReclose_keepsOldRecords() {
        play(A, U2, 500, at("2026-W32", 1, 10), "NORMAL");
        closeService.closeWeek("2026-W32");
        BigDecimal before = coefficientOf("2026-W32", A);

        play(A, U3, 900, at("2026-W32", 2, 10), "NORMAL");   // 재마감하면 1등이 바뀔 상황
        doThrow(new IllegalStateException("테스트용 오류")).when(calculator).coefficient(anyDouble(), anyDouble());

        assertThrows(IllegalStateException.class, () -> closeService.closeWeek("2026-W32"));
        assertEquals(1, count("select count(*) from first_place_records where period_key = '2026-W32'"));
        assertEquals(U2, count("select user_id from first_place_records where period_key = '2026-W32'"));
        assertEquals(0, before.compareTo(coefficientOf("2026-W32", A)));
    }

    @Test
    @DisplayName("F1-08 앱을 삭제해도 1등 기록은 남고(app_id NULL), 재마감해도 보존·모집단에서는 빠짐")
    void closeWeek_afterAppDeleted_keepsDeletedAppRecord() {
        play(A, U2, 500, at("2026-W33", 1, 10), "NORMAL");
        play(B, U4, 200, at("2026-W33", 1, 10), "NORMAL");
        closeService.closeWeek("2026-W33");

        adminAppService.deleteApp(B);   // 허 어드민 앱 삭제 (DELETE /api/admin/apps/{id}가 부르는 메서드)
        CloseResult reclosed = closeService.closeWeek("2026-W33");

        assertEquals(1, count("select count(*) from first_place_records where original_app_id = ? and app_id is null", B));
        assertEquals(2, count("select count(*) from first_place_records where period_key = '2026-W33'"));
        assertEquals(1, reclosed.getAppCount());   // 삭제된 B는 비교 대상에서 빠짐
    }

    @Test
    @DisplayName("F1-09 처음엔 ACTIVE였던 1등이 재마감 때 정지 상태면 다음 적격자로 바뀜")
    void closeWeek_topSuspendedBeforeReclose_picksNextUser() {
        play(A, U2, 500, at("2026-W34", 1, 10), "NORMAL");
        play(A, U3, 300, at("2026-W34", 1, 10), "NORMAL");
        closeService.closeWeek("2026-W34");

        jdbc.update("update users set status = 'SUSPENDED' where id = ?", U2);
        CloseResult reclosed = closeService.closeWeek("2026-W34");

        assertEquals(U3, recordOf(reclosed, A).getUserId());
    }

    @Test
    @DisplayName("F1-16 일요일 23:59 시작·월요일 00:01 제출이면 제출 시각 기준 새 주차")
    void closeWeek_weekBoundary_usesSubmittedAt() {
        WeekRange next = WeekRange.ofKey("2026-W36");
        play(A, U2, 500, next.start().minusMinutes(1).toString(), next.start().plusMinutes(1).toString(), "NORMAL");

        CloseResult w35 = closeService.closeWeek("2026-W35");
        CloseResult w36 = closeService.closeWeek("2026-W36");

        assertNull(recordOf(w35, A));
        assertEquals(U2, recordOf(w36, A).getUserId());
    }

    @Test
    @DisplayName("F1-20 진행 중 주차는 마감 거부, 형식이 틀린 키는 VALIDATION_ERROR")
    void closeWeek_currentWeekOrBadKey_rejected() {
        BusinessException current = assertThrows(BusinessException.class,
                () -> closeService.closeWeek(WeekRange.current().key()));
        BusinessException badKey = assertThrows(BusinessException.class, () -> closeService.closeWeek("abc"));

        assertEquals(ErrorCode.WEEK_NOT_COMPLETED, current.getErrorCode());
        assertEquals(ErrorCode.VALIDATION_ERROR, badKey.getErrorCode());
    }

    // ---------------------------------------------------------------- 미리보기 (C4)

    @Test
    @DisplayName("F1-10·19 미리보기는 PENDING 1위도 포함해 계산하지만 저장·상태 변경 없음")
    void previewCurrentWeek_pendingTop_noSideEffect() {
        play(A, U2, 500, WeekRange.current().start().plusMinutes(1).toString(), "PENDING");

        CloseResult preview = closeService.previewCurrentWeek();

        assertEquals(U2, recordOf(preview, A).getUserId());
        assertEquals(0, count("select count(*) from first_place_records where period_key = ?", WeekRange.current().key()));
        assertEquals(1, count("select count(*) from play_sessions where app_id = ? and verify_status = 'PENDING'", A));
    }

    @Test
    @DisplayName("F1-18 미리보기 후 앱을 삭제하면 그 앱 기록은 생기지 않음 (미리보기는 저장하지 않으므로)")
    void previewCurrentWeek_thenAppDeleted_noRecord() {
        play(B, U4, 200, WeekRange.current().start().plusMinutes(1).toString(), "NORMAL");
        assertNotNull(recordOf(closeService.previewCurrentWeek(), B));

        adminAppService.deleteApp(B);

        assertNull(recordOf(closeService.previewCurrentWeek(), B));
        assertEquals(0, count("select count(*) from first_place_records where original_app_id = ?", B));
    }

    // ---------------------------------------------------------------- 자동 마감 (C1)

    @Test
    @DisplayName("F1-11 자동 마감: 기록이 없는 주차는 마감하고, 이미 마감된 주차는 다시 계산하지 않음")
    void closeIfMissing_missingWeek_closesOnce() {
        CloseScheduler scheduler = new CloseScheduler(closeService, recordRepository);
        play(A, U2, 500, at("2026-W37", 1, 10), "NORMAL");

        scheduler.closeIfMissing("2026-W37");
        play(A, U3, 900, at("2026-W37", 2, 10), "NORMAL");   // 마감 뒤 기록이 늘어도
        scheduler.closeIfMissing("2026-W37");                 // 이미 마감됐으니 그대로

        assertEquals(U2, count("select user_id from first_place_records where period_key = '2026-W37'"));
    }

    @Test
    @DisplayName("F1-17 자동 마감 중 오류면 저장 없음(로그만), 이후 재마감으로 저장")
    void closeIfMissing_error_savesNothingThenRecloseWorks() {
        CloseScheduler scheduler = new CloseScheduler(closeService, recordRepository);
        play(A, U2, 500, at("2026-W38", 1, 10), "NORMAL");
        doThrow(new IllegalStateException("테스트용 오류")).when(calculator).coefficient(anyDouble(), anyDouble());

        scheduler.closeIfMissing("2026-W38");   // 예외가 밖으로 나오지 않음
        assertEquals(0, count("select count(*) from first_place_records where period_key = '2026-W38'"));

        reset(calculator);   // 오류 원인 해결
        closeService.closeWeek("2026-W38");
        assertEquals(1, count("select count(*) from first_place_records where period_key = '2026-W38'"));
    }

    // ---------------------------------------------------------------- 목데이터 토글 (E)

    @Test
    @DisplayName("F1-12 토글 ON 마감 → OFF로 바꿔 다른 주차 마감: 새 결과에만 반영, 과거 mock_included 유지")
    void closeWeek_toggleChanged_onlyNextCloseAffected() {
        play(A, U2, 500, at("2026-W27", 1, 10), "NORMAL");
        play(M, MOCK_USER, 50, at("2026-W27", 1, 10), "NORMAL");
        play(A, U2, 500, at("2026-W28", 1, 10), "NORMAL");
        play(M, MOCK_USER, 50, at("2026-W28", 1, 10), "NORMAL");

        settingService.setMockEnabled(true);
        CloseResult on = closeService.closeWeek("2026-W27");
        settingService.setMockEnabled(false);
        CloseResult off = closeService.closeWeek("2026-W28");

        assertEquals(2, on.getAppCount());   // A + 목 앱 M
        assertEquals(1, off.getAppCount());  // A만
        assertNull(recordOf(on, M));         // 목 앱은 1등 기록을 만들지 않음
        assertTrue(mockIncludedOf("2026-W27", A));    // 과거 기록은 ON 그대로
        assertFalse(mockIncludedOf("2026-W28", A));
    }

    // ---------------------------------------------------------------- 유저 랭킹 (D3·D4)

    @Test
    @DisplayName("F1-15 포인트 합·참여자 합이 같으면 공동 순위, 참여자 합이 적으면 아래 (1, 1, 3)")
    void getRanking_tie_sharesRank() {
        record(TIE_A, "2026-W20", 3, "1.5000");
        record(TIE_B, "2026-W21", 3, "1.5000");
        record(U4, "2026-W22", 2, "1.5000");   // 포인트는 같고 참여자 합이 적음

        RankingResponse all = rankingService.getRanking(RankingPeriod.ALL, null);
        int rankA = rankOf(all, TIE_A), rankB = rankOf(all, TIE_B), rankU4 = rankOf(all, U4);

        assertEquals(rankA, rankB);
        assertEquals(rankA + 2, rankU4);
    }

    // ================================================================ 도우미

    private void user(long id, String status, boolean mock) {
        jdbc.update("insert into users (id, email, nickname, role, status, is_mock, created_at, updated_at) "
                + "values (?, ?, ?, 'USER', ?, ?, now(), now())", id, "t" + id + "@close.test", "t" + id, status, mock);
    }

    private void app(long id, long creator, int recommendCount, boolean mock) {
        jdbc.update("insert into apps (id, creator_id, title, description, repo_url, commit_sha, entry_path, deploy_key, "
                + "status, is_official, is_mock, current_season, recommend_count, not_recommend_count, play_count, "
                + "approved_at, created_at, updated_at) "
                + "values (?, ?, ?, 'test', 'https://github.com/t/t', 'sha', 'index.html', gen_random_uuid(), "
                + "'APPROVED', false, ?, 1, ?, 0, 0, now(), now(), now())", id, creator, "T" + id, mock, recommendCount);
    }

    /** 제출 기록 (시작 시각 = 제출 시각) */
    private void play(long app, long user, int score, String submittedAt, String verify) {
        play(app, user, score, submittedAt, submittedAt, verify);
    }

    private void play(long app, long user, int score, String startedAt, String submittedAt, String verify) {
        jdbc.update("insert into play_sessions (id, app_id, user_id, season, status, verify_status, score, started_at, submitted_at, created_at) "
                + "values (gen_random_uuid(), ?, ?, 1, 'SUBMITTED', ?, ?, ?::timestamptz, ?::timestamptz, now())",
                app, user, verify, score, startedAt, submittedAt);
    }

    /** 1등 기록을 직접 넣기 (랭킹 합산 테스트용) */
    private void record(long user, String periodKey, int participants, String coefficient) {
        jdbc.update("insert into first_place_records (user_id, app_id, original_app_id, app_title_snapshot, period_type, period_key, "
                + "recommend_at_close, participants_at_close, app_count_at_close, mock_included, coefficient, created_at) "
                + "values (?, ?, ?, 'TA', 'WEEK', ?, 0, ?, 1, false, ?::numeric, now())",
                user, A, A, periodKey, participants, coefficient);
    }

    /** 그 주 월요일 0시(KST) + 며칠 + 몇 시 */
    private String at(String weekKey, int days, int hours) {
        return WeekRange.ofKey(weekKey).start().plusDays(days).plusHours(hours).toString();
    }

    private long count(String sql, Object... args) {
        return jdbc.queryForObject(sql, Long.class, args);
    }

    private CloseRecord recordOf(CloseResult result, long appId) {
        for (CloseRecord record : result.getRecords()) {
            if (record.getAppId() == appId) {
                return record;
            }
        }
        return null;
    }

    private BigDecimal coefficientOf(String periodKey, long appId) {
        return jdbc.queryForObject("select coefficient from first_place_records where period_key = ? and original_app_id = ?",
                BigDecimal.class, periodKey, appId);
    }

    private boolean mockIncludedOf(String periodKey, long appId) {
        return jdbc.queryForObject("select mock_included from first_place_records where period_key = ? and original_app_id = ?",
                Boolean.class, periodKey, appId);
    }

    private int rankOf(RankingResponse response, long userId) {
        for (RankingEntryResponse entry : response.getEntries()) {
            if (entry.getUserId() == userId) {
                return entry.getRank();
            }
        }
        throw new AssertionError("랭킹에 없음: " + userId);
    }

    private void sleep(long millis) {
        try {
            Thread.sleep(millis);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    }

    /** 이 테스트가 넣은 데이터만 지운다 (앱을 지우면 제출 기록은 CASCADE로 함께 지워짐) */
    private void cleanUp() {
        jdbc.update("delete from first_place_records where original_app_id between 980101 and 980103 or user_id between 980001 and 980009");
        jdbc.update("delete from apps where id between 980101 and 980103");
        jdbc.update("delete from play_sessions where user_id between 980001 and 980009");
        jdbc.update("delete from users where id between 980001 and 980009");
    }
}
