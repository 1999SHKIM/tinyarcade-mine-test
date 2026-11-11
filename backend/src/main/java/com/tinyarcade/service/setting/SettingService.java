package com.tinyarcade.service.setting;

import com.tinyarcade.entity.setting.SystemSetting;
import com.tinyarcade.repository.setting.SystemSettingRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 목데이터 토글 읽기·바꾸기 (03_17 RANK-F12, 01 E).
 *
 * [참고] 이 클래스가 하는 일
 * - getMockEnabled(): 주간 마감이 "목 앱도 1등 후보에 넣을지" 정할 때 읽는다.
 * - setMockEnabled(): 관리자 화면(허 담당 어드민 API)에서 켜고 끌 때 부른다.
 *
 * [참고] 왜 값이 없으면 false인가
 * - system_settings 테이블은 처음엔 비어 있다(따로 초기 데이터를 넣지 않음).
 * - 행이 없을 때 "꺼짐"으로 보면, 실제 서비스에 목 데이터가 실수로 섞이는 일이 없다.
 *
 * [참고] 바꾼 값은 언제 반영되나
 * - 다음 마감부터 적용된다. 이미 만든 1등 기록은 mock_included 칸에 그때 값이 남아 있어서 바뀌지 않는다.
 */
@Service
@RequiredArgsConstructor
public class SettingService {

    private final SystemSettingRepository systemSettingRepository;

    /** 목데이터 토글 값. 행이 없으면 false */
    @Transactional(readOnly = true)
    public boolean getMockEnabled() {
        return systemSettingRepository.findById(SystemSetting.MOCK_DATA_ENABLED)
                .map(setting -> Boolean.parseBoolean(setting.getSettingValue()))
                .orElse(false);
    }

    /**
     * 목데이터 토글 바꾸기. 행이 없으면 새로 만들고, 있으면 값만 바꾼다.
     *
     * [참고] 있으면 changeValue만 부르고 save를 안 하는 이유
     * - findById로 꺼낸 엔티티는 JPA가 지켜보고 있다(영속 상태).
     *   `@Transactional` 메서드가 끝날 때 바뀐 칸을 알아서 UPDATE 한다(변경 감지, dirty checking).
     */
    @Transactional
    public void setMockEnabled(boolean enabled) {
        String value = String.valueOf(enabled);   // true → "true"
        systemSettingRepository.findById(SystemSetting.MOCK_DATA_ENABLED)
                .ifPresentOrElse(
                        setting -> setting.changeValue(value),
                        () -> systemSettingRepository.save(SystemSetting.of(SystemSetting.MOCK_DATA_ENABLED, value)));
    }
}
