package com.agri.market.coupon;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * 쿠폰 리포지토리
 */
@Repository
public interface CouponRepository extends JpaRepository<Coupon, Long> {

    /**
     * 쿠폰 코드로 조회
     */
    Optional<Coupon> findByCode(String code);

    /**
     * 활성화된 쿠폰 목록 조회 (현재 유효 기간 내)
     */
    @Query("SELECT c FROM Coupon c WHERE c.isActive = true " +
           "AND c.startDate <= :now AND c.endDate >= :now " +
           "ORDER BY c.createdAt DESC")
    List<Coupon> findActiveCoupons(@Param("now") LocalDateTime now);

    /**
     * 활성화된 쿠폰 페이징 조회
     */
    @Query("SELECT c FROM Coupon c WHERE c.isActive = true " +
           "AND c.startDate <= :now AND c.endDate >= :now")
    Page<Coupon> findActiveCoupons(@Param("now") LocalDateTime now, Pageable pageable);

    /**
     * 모든 쿠폰 페이징 조회 (관리자용)
     */
    Page<Coupon> findAllByOrderByCreatedAtDesc(Pageable pageable);

    /**
     * 쿠폰 코드 중복 확인
     */
    boolean existsByCode(String code);

    /**
     * 카테고리별 활성 쿠폰 조회
     */
    @Query("SELECT c FROM Coupon c WHERE c.isActive = true " +
           "AND c.startDate <= :now AND c.endDate >= :now " +
           "AND (c.applicableCategory IS NULL OR c.applicableCategory = :category)")
    List<Coupon> findActiveCouponsByCategory(@Param("now") LocalDateTime now,
                                              @Param("category") String category);

    /**
     * 쿠폰 통계 조회
     */
    @Query("SELECT COUNT(c) FROM Coupon c WHERE c.isActive = true")
    long countActiveCoupons();

    @Query("SELECT SUM(c.usedQuantity) FROM Coupon c")
    Long sumUsedQuantity();
}
