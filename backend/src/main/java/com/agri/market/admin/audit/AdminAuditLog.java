package com.agri.market.admin.audit;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

/**
 * 관리자 감사 로그 엔티티
 * 관리자의 모든 중요한 작업을 추적하여 보안 및 규정 준수를 보장합니다.
 */
@Entity
@Table(name = "admin_audit_logs", indexes = {
        @Index(name = "idx_admin_user_id", columnList = "adminUserId"),
        @Index(name = "idx_action_type", columnList = "actionType"),
        @Index(name = "idx_target_entity", columnList = "targetEntityType,targetEntityId"),
        @Index(name = "idx_created_at", columnList = "createdAt")
})
@Getter
@Setter
public class AdminAuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * 작업을 수행한 관리자의 User ID
     */
    @Column(nullable = false)
    private Long adminUserId;

    /**
     * 작업을 수행한 관리자의 이메일
     */
    @Column(nullable = false, length = 255)
    private String adminEmail;

    /**
     * 수행된 작업 유형
     */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    private ActionType actionType;

    /**
     * 대상 엔티티 유형 (USER, ORDER, PRODUCT, SELLER 등)
     */
    @Column(nullable = false, length = 50)
    private String targetEntityType;

    /**
     * 대상 엔티티 ID
     */
    @Column(nullable = false)
    private Long targetEntityId;

    /**
     * 변경 전 값 (JSON 형식 또는 단순 문자열)
     */
    @Column(length = 1000)
    private String oldValue;

    /**
     * 변경 후 값 (JSON 형식 또는 단순 문자열)
     */
    @Column(length = 1000)
    private String newValue;

    /**
     * 작업 사유 (특히 삭제/환불 등의 경우 필수)
     */
    @Column(length = 500)
    private String reason;

    /**
     * 요청자의 IP 주소 (보안 추적용)
     */
    @Column(length = 45) // IPv6 지원
    private String ipAddress;

    /**
     * 추가 메타데이터 (JSON 형식)
     */
    @Column(length = 2000)
    private String metadata;

    /**
     * 작업 수행 시각
     */
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }

    /**
     * 로그 요약 문자열 생성
     */
    public String getSummary() {
        return String.format("[%s] %s (%s) %s %s #%d - %s -> %s",
                createdAt,
                adminEmail,
                ipAddress,
                actionType.getDescription(),
                targetEntityType,
                targetEntityId,
                oldValue != null ? oldValue : "N/A",
                newValue != null ? newValue : "N/A"
        );
    }
}
