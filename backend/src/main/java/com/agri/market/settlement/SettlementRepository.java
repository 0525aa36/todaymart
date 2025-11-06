package com.agri.market.settlement;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface SettlementRepository extends JpaRepository<Settlement, Long> {

    // 판매자별 정산 내역 조회
    Page<Settlement> findBySellerIdOrderByCreatedAtDesc(Long sellerId, Pageable pageable);

    // 정산 상태별 조회
    Page<Settlement> findByStatusOrderByCreatedAtDesc(SettlementStatus status, Pageable pageable);

    // 판매자 + 정산 기간으로 조회 (중복 정산 방지)
    Optional<Settlement> findBySellerIdAndStartDateAndEndDate(Long sellerId, LocalDate startDate, LocalDate endDate);

    // 특정 기간의 정산 내역 조회
    @Query("SELECT s FROM Settlement s WHERE s.startDate >= :startDate AND s.endDate <= :endDate ORDER BY s.createdAt DESC")
    List<Settlement> findByPeriod(@Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);

    // 판매자별 정산 통계
    @Query("SELECT COALESCE(SUM(s.settlementAmount), 0) FROM Settlement s WHERE s.seller.id = :sellerId AND s.status = 'COMPLETED'")
    java.math.BigDecimal sumCompletedSettlementAmountBySeller(@Param("sellerId") Long sellerId);
}
