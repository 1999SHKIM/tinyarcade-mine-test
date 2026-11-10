package com.tinyarcade.entity.app;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.MapsId;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import java.time.OffsetDateTime;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

/**
 * 앱 썸네일 이미지 (03_11_tinyarcade_thumbnail §2-3). 앱 1개당 최대 1장.
 *
 * [참고] apps 테이블에 칸을 더하지 않고 테이블을 따로 둔 이유
 * - 앱 목록은 승인된 앱 전체를 한 번에 읽는다. 이미지(최대 500KB)가 apps에 있으면 목록을 읽을 때마다
 *   이미지까지 같이 읽혀 무거워진다(THM-N01). 테이블을 나누면 목록은 이미지를 건드리지 않는다.
 * - 서버 디스크가 아니라 DB에 저장하는 이유: Render는 재배포할 때 디스크가 초기화된다(허 요청 R1).
 *
 * [참고] @MapsId
 * - "기본 키(app_id)를 따로 만들지 않고, 연결된 앱의 id를 그대로 기본 키로 쓴다"는 뜻이다.
 *   그래서 한 앱에 썸네일이 두 장 생길 수 없다.
 * - @OnDelete(CASCADE): 앱이 삭제되면 썸네일도 DB가 함께 지운다(THM-N04, 메인 §5).
 *
 * [참고] byte[] data
 * - 이미지 파일 내용 그대로다. PostgreSQL에서는 BYTEA(바이트 배열) 칸으로 만들어진다.
 */
@Entity
@Table(name = "app_thumbnails")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class AppThumbnail {

    @Id
    @Column(name = "app_id")
    private Long appId;

    @MapsId
    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "app_id")
    @OnDelete(action = OnDeleteAction.CASCADE)
    private App app;

    /** image/png, image/jpeg, image/webp 중 하나 (서버가 파일 내용으로 판정한 값) */
    @Column(name = "content_type", nullable = false, length = 20)
    private String contentType;

    @Column(nullable = false)
    private byte[] data;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    public static AppThumbnail of(App app, String contentType, byte[] data) {
        AppThumbnail thumbnail = new AppThumbnail();
        thumbnail.app = app;
        thumbnail.contentType = contentType;
        thumbnail.data = data;
        return thumbnail;
    }
}
