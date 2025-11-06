package com.agri.market.seller;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 판매자(농가/공급업체) 엔티티
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
    private String name; // 판매자명 (농가명, 업체명)

    @Column(nullable = false, unique = true, length = 20)
    private String businessNumber; // 사업자등록번호

    @Column(nullable = false, length = 100)
    private String representative; // 대표자명

    @Column(nullable = false, length = 20)
    private String phone; // 연락처

    @Column(length = 100)
    private String email; // 이메일

    @Column(length = 200)
    private String address; // 주소

    @Column(nullable = false, length = 50)
    private String bankName; // 은행명

    @Column(nullable = false, length = 50)
    private String accountNumber; // 계좌번호

    @Column(nullable = false, length = 100)
    private String accountHolder; // 예금주

    @Column(nullable = false, precision = 5, scale = 2)
    private BigDecimal commissionRate = BigDecimal.valueOf(10.0); // 수수료율 (기본 10%)

    @Column(nullable = false)
    private Boolean isActive = true; // 활성화 상태

    @Column(columnDefinition = "TEXT")
    private String memo; // 메모

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}
