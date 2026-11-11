package com.tinyarcade.repository.setting;

import com.tinyarcade.entity.setting.SystemSetting;
import org.springframework.data.jpa.repository.JpaRepository;

/**
 * system_settings 읽기·쓰기 (03_17).
 * 기본 키가 설정 이름(문자열)이라 findById("MOCK_DATA_ENABLED")로 바로 찾는다. 새로 적을 메서드는 없다.
 */
public interface SystemSettingRepository extends JpaRepository<SystemSetting, String> {
}
