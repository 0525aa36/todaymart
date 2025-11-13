package com.agri.market.admin.audit;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 관리자 감사 로그 Repository
 */
@Repository
public interface AdminAuditLogRepository extends JpaRepository<AdminAuditLog, Long> {

    /**
     * 특정 관리자의 모든 로그 조회
     */
    Page<AdminAuditLog> findByAdminUserId(Long adminUserId, Pageable pageable);

    /**
     * 특정 작업 유형의 로그 조회
     */
    Page<AdminAuditLog> findByActionType(ActionType actionType, Pageable pageable);

    /**
     * 특정 엔티티에 대한 모든 로그 조회
     */
    Page<AdminAuditLog> findByTargetEntityTypeAndTargetEntityId(
            String targetEntityType,
            Long targetEntityId,
            Pageable pageable
    );

    /**
     * 특정 기간 동안의 로그 조회
     */
    @Query("SELECT a FROM AdminAuditLog a WHERE a.createdAt >= :startDate AND a.createdAt <= :endDate ORDER BY a.createdAt DESC")
    Page<AdminAuditLog> findByDateRange(
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate,
            Pageable pageable
    );

    /**
     * 고급 검색: 여러 조건 조합
     */
    @Query("SELECT a FROM AdminAuditLog a WHERE " +
            "(:adminUserId IS NULL OR a.adminUserId = :adminUserId) AND " +
            "(:actionType IS NULL OR a.actionType = :actionType) AND " +
            "(:targetEntityType IS NULL OR a.targetEntityType = :targetEntityType) AND " +
            "(:targetEntityId IS NULL OR a.targetEntityId = :targetEntityId) AND " +
            "(:startDate IS NULL OR a.createdAt >= :startDate) AND " +
            "(:endDate IS NULL OR a.createdAt <= :endDate) " +
            "ORDER BY a.createdAt DESC")
    Page<AdminAuditLog> advancedSearch(
            @Param("adminUserId") Long adminUserId,
            @Param("actionType") ActionType actionType,
            @Param("targetEntityType") String targetEntityType,
            @Param("targetEntityId") Long targetEntityId,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate,
            Pageable pageable
    );

    /**
     * 특정 IP 주소의 최근 활동 조회 (보안 모니터링용)
     */
    List<AdminAuditLog> findTop20ByIpAddressOrderByCreatedAtDesc(String ipAddress);

    /**
     * 최근 N개의 로그 조회
     */
    List<AdminAuditLog> findTop50ByOrderByCreatedAtDesc();
}
