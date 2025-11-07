package com.agri.market.settlement;

import com.agri.market.seller.Seller;
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

    /**
     * 판매자별 정산 내역 조회
     */
    Page<Settlement> findBySeller(Seller seller, Pageable pageable);

    /**
     * 판매자 ID로 정산 내역 조회
     */
    Page<Settlement> findBySellerId(Long sellerId, Pageable pageable);

    /**
     * 상태별 정산 내역 조회
     */
    Page<Settlement> findByStatus(SettlementStatus status, Pageable pageable);

    /**
     * 판매자 + 상태별 정산 내역 조회
     */
    Page<Settlement> findBySellerIdAndStatus(Long sellerId, SettlementStatus status, Pageable pageable);

    /**
     * 특정 기간의 정산 내역 조회
     */
    @Query("SELECT s FROM Settlement s WHERE s.startDate >= :startDate AND s.endDate <= :endDate")
    Page<Settlement> findByPeriod(@Param("startDate") LocalDate startDate,
                                   @Param("endDate") LocalDate endDate,
                                   Pageable pageable);

    /**
     * 판매자의 특정 기간 정산 내역 조회 (중복 체크용)
     */
    @Query("SELECT s FROM Settlement s WHERE s.seller.id = :sellerId " +
           "AND s.startDate = :startDate AND s.endDate = :endDate")
    Optional<Settlement> findBySellerIdAndPeriod(@Param("sellerId") Long sellerId,
                                                   @Param("startDate") LocalDate startDate,
                                                   @Param("endDate") LocalDate endDate);

    /**
     * 판매자의 정산 대기 건수
     */
    long countBySellerIdAndStatus(Long sellerId, SettlementStatus status);

    /**
     * 전체 정산 내역을 최신순으로 조회
     */
    @Query("SELECT s FROM Settlement s LEFT JOIN FETCH s.seller ORDER BY s.createdAt DESC")
    Page<Settlement> findAllWithSeller(Pageable pageable);
}
