package com.agri.market.googlesheets;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface GoogleSheetsSyncLogRepository extends JpaRepository<GoogleSheetsSyncLog, Long> {

    // 특정 판매자의 최근 동기화 이력 조회
    List<GoogleSheetsSyncLog> findBySellerIdOrderBySyncTimeDesc(Long sellerId);

    // 특정 판매자의 마지막 동기화 조회
    Optional<GoogleSheetsSyncLog> findTopBySellerIdOrderBySyncTimeDesc(Long sellerId);

    // 전체 동기화 이력 조회 (판매자 NULL인 경우)
    @Query("SELECT l FROM GoogleSheetsSyncLog l WHERE l.seller IS NULL ORDER BY l.syncTime DESC")
    List<GoogleSheetsSyncLog> findAllSyncLogs();

    // 특정 기간 동안의 성공/실패 통계
    @Query("SELECT l.status, COUNT(l) FROM GoogleSheetsSyncLog l WHERE l.syncTime BETWEEN :startDate AND :endDate GROUP BY l.status")
    List<Object[]> findSyncStatsByPeriod(@Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);
}
