package com.agri.market.googlesheets;

import com.agri.market.seller.Seller;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

/**
 * 구글 스프레드시트 동기화 이력 엔티티
 */
@Entity
@Table(name = "google_sheets_sync_log")
@Getter
@Setter
public class GoogleSheetsSyncLog {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "seller_id")
    private Seller seller; // NULL이면 전체 동기화

    @Column(name = "sync_time", nullable = false)
    private LocalDateTime syncTime = LocalDateTime.now();

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private SyncStatus status;

    @Column(name = "rows_updated")
    private Integer rowsUpdated = 0; // 업데이트된 행 수

    @Column(columnDefinition = "TEXT")
    private String errorMessage; // 오류 메시지 (실패 시)

    @Enumerated(EnumType.STRING)
    @Column(name = "triggered_by", length = 50)
    private TriggerType triggeredBy; // MANUAL, SCHEDULED, ADMIN

    public enum SyncStatus {
        SUCCESS,
        FAILED
    }

    public enum TriggerType {
        MANUAL,    // 판매자가 수동으로 트리거
        SCHEDULED, // 스케줄러에 의한 자동 실행
        ADMIN      // 관리자가 트리거
    }
}
