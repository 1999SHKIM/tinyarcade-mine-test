package com.tinyarcade.entity.setting;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.OffsetDateTime;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.UpdateTimestamp;

/**
 * 전역 설정 한 줄 (메인 §8 system_settings, 01 E).
 * 지금은 목데이터 토글(MOCK_DATA_ENABLED = "true" / "false") 하나만 쓴다.
 *
 * [참고] 왜 설정 파일(application.yml)이 아니라 DB에 두나
 * - 설정 파일 값은 서버를 다시 배포해야 바뀐다. 목데이터 토글은 관리자가 화면에서 바로 켜고 끄는 값이라 DB에 둔다(01 G1).
 * - 기본 키가 문자열(setting_key)이라 나중에 설정이 늘어나도 줄만 추가하면 된다.
 */
@Entity
@Table(name = "system_settings")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class SystemSetting {

    /** 목데이터 토글 키 */
    public static final String MOCK_DATA_ENABLED = "MOCK_DATA_ENABLED";

    @Id
    @Column(name = "setting_key", length = 50)
    private String settingKey;

    @Column(name = "setting_value", nullable = false, length = 200)
    private String settingValue;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    public static SystemSetting of(String settingKey, String settingValue) {
        SystemSetting setting = new SystemSetting();
        setting.settingKey = settingKey;
        setting.settingValue = settingValue;
        return setting;
    }

    public void changeValue(String settingValue) {
        this.settingValue = settingValue;
    }
}
