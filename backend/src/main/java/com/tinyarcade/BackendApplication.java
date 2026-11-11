package com.tinyarcade;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * 서버 시작점.
 *
 * [참고] `@EnableScheduling` (17번)
 * - "정해진 시각·간격에 메서드를 자동으로 실행"하는 기능(`@Scheduled`)을 켠다. 이게 없으면 `@Scheduled`가 붙어 있어도 돌지 않는다.
 * - 지금은 주간 자동 마감(service/ranking/CloseScheduler)만 쓴다.
 */
@SpringBootApplication
@EnableScheduling
public class BackendApplication {

	public static void main(String[] args) {
		SpringApplication.run(BackendApplication.class, args);
	}

}
