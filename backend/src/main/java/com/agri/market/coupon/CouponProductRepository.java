package com.agri.market.coupon;

import com.agri.market.product.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * 쿠폰 상품 리포지토리
 */
@Repository
public interface CouponProductRepository extends JpaRepository<CouponProduct, Long> {

    /**
     * 쿠폰의 적용 가능한 상품 목록 조회
     */
    List<CouponProduct> findByCoupon(Coupon coupon);

    /**
     * 특정 쿠폰이 특정 상품에 적용 가능한지 확인
     */
    boolean existsByCouponAndProduct(Coupon coupon, Product product);

    /**
     * 쿠폰에 연결된 모든 상품 삭제
     */
    void deleteByCoupon(Coupon coupon);
}
