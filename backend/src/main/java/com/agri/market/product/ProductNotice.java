package com.agri.market.product;

import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

/**
 * 전자상거래법에 따른 상품 고시 정보 (농수산물/식품)
 */
@Entity
@Table(name = "product_notices")
@Getter
@Setter
public class ProductNotice {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne
    @JoinColumn(name = "product_id", nullable = false, unique = true)
    @JsonBackReference
    private Product product;

    /**
     * 제품명
     */
    @Column(columnDefinition = "TEXT")
    private String productName;

    /**
     * 식품의 유형
     */
    @Column(columnDefinition = "TEXT")
    private String foodType;

    /**
     * 생산자 및 소재지 (수입품의 경우 생산자, 수입자 및 제조국)
     */
    @Column(columnDefinition = "TEXT")
    private String manufacturer;

    /**
     * 제조연월일, 소비기한 또는 품질유지기한
     */
    @Column(columnDefinition = "TEXT")
    private String expirationInfo;

    /**
     * 포장단위별 내용물의 용량(중량), 수량
     */
    @Column(columnDefinition = "TEXT")
    private String capacity;

    /**
     * 원재료명 및 함량
     */
    @Column(columnDefinition = "TEXT")
    private String ingredients;

    /**
     * 영양성분
     */
    @Column(columnDefinition = "TEXT")
    private String nutritionFacts;

    /**
     * 유전자변형식품에 해당하는 경우의 표시
     */
    @Column(columnDefinition = "TEXT")
    private String gmoInfo;

    /**
     * 소비자 안전을 위한 주의사항
     */
    @Column(columnDefinition = "TEXT")
    private String safetyWarnings;

    /**
     * 수입식품의 경우 수입신고 문구
     */
    @Column(columnDefinition = "TEXT")
    private String importDeclaration;

    /**
     * 소비자 상담 관련 전화번호
     */
    @Column(length = 50)
    private String customerServicePhone;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(nullable = false)
    private LocalDateTime updatedAt;
}
