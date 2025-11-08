package com.agri.market.coupon;

import com.agri.market.order.Order;
import com.agri.market.user.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * 사용자 쿠폰 리포지토리
 */
@Repository
public interface UserCouponRepository extends JpaRepository<UserCoupon, Long> {

    /**
     * 사용자의 모든 쿠폰 조회
     */
    List<UserCoupon> findByUserOrderByIssuedAtDesc(User user);

    /**
     * 사용자의 미사용 쿠폰 조회
     */
    List<UserCoupon> findByUserAndUsedAtIsNullOrderByIssuedAtDesc(User user);

    /**
     * 사용자의 사용 가능한 쿠폰 조회 (미사용 + 미만료 + 쿠폰 유효)
     */
    @Query("SELECT uc FROM UserCoupon uc " +
           "JOIN FETCH uc.coupon c " +
           "WHERE uc.user = :user " +
           "AND uc.usedAt IS NULL " +
           "AND uc.expiresAt > :now " +
           "AND c.isActive = true " +
           "AND c.startDate <= :now " +
           "AND c.endDate >= :now " +
           "ORDER BY uc.expiresAt ASC")
    List<UserCoupon> findAvailableCoupons(@Param("user") User user, @Param("now") LocalDateTime now);

    /**
     * 특정 쿠폰에 대한 사용자의 미사용 쿠폰 조회
     */
    Optional<UserCoupon> findByUserAndCouponAndUsedAtIsNull(User user, Coupon coupon);

    /**
     * 사용자가 특정 쿠폰을 보유하고 있는지 확인
     */
    boolean existsByUserAndCoupon(User user, Coupon coupon);

    /**
     * 사용자의 쿠폰 개수 조회
     */
    long countByUser(User user);

    /**
     * 사용자의 사용 가능한 쿠폰 개수 조회
     */
    @Query("SELECT COUNT(uc) FROM UserCoupon uc " +
           "WHERE uc.user = :user " +
           "AND uc.usedAt IS NULL " +
           "AND uc.expiresAt > :now " +
           "AND uc.coupon.isActive = true")
    long countAvailableCoupons(@Param("user") User user, @Param("now") LocalDateTime now);

    /**
     * 만료된 쿠폰 조회 (배치 작업용)
     */
    @Query("SELECT uc FROM UserCoupon uc WHERE uc.expiresAt < :now AND uc.usedAt IS NULL")
    List<UserCoupon> findExpiredCoupons(@Param("now") LocalDateTime now);

    /**
     * 주문에 사용된 쿠폰 조회
     */
    Optional<UserCoupon> findByOrder(Order order);
}
