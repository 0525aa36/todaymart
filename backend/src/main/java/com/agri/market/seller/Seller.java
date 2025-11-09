package com.agri.market.seller;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.LocalTime;

/**
 * 판매자 엔티티 (농가/공급업체)
 */
@Entity
@Table(name = "sellers")
@Getter
@Setter
public class Seller {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String name; // 사업자명 (농가명/상호명)

    @Column(nullable = false, unique = true, length = 20)
    private String businessNumber; // 사업자등록번호

    @Column(nullable = false, length = 50)
    private String representative; // 대표자명

    @Column(nullable = false, length = 20)
    private String phone; // 연락처

    @Column(nullable = false, length = 100)
    private String email; // 이메일

    @Column(nullable = false, length = 200)
    private String address; // 주소

    @Column(length = 50)
    private String bankName; // 은행명

    @Column(length = 50)
    private String accountNumber; // 계좌번호

    @Column(length = 50)
    private String accountHolder; // 예금주

    @Column(nullable = false, precision = 5, scale = 2)
    private BigDecimal commissionRate = BigDecimal.valueOf(10.0); // 수수료율 (기본 10%)

    @Column(nullable = false)
    private Boolean isActive = true; // 활성 상태

    @Column(columnDefinition = "TEXT")
    private String memo; // 메모

    // Google Sheets 연동 관련 필드
    @Column(name = "spreadsheet_id", length = 200)
    private String spreadsheetId; // 판매자별 구글 스프레드시트 ID

    @Column(name = "update_schedule_time")
    private LocalTime updateScheduleTime; // 자동 업데이트 시간 (예: 23:00:00)

    @Column(name = "last_synced_at")
    private LocalDateTime lastSyncedAt; // 마지막 동기화 시간

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}
