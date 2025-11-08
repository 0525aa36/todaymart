package com.agri.market.coupon;

import com.agri.market.dto.UserCouponResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

/**
 * 사용자 쿠폰 컨트롤러 (인증 필요)
 */
@RestController
@RequestMapping("/api/user/coupons")
public class UserCouponController {

    private final UserCouponService userCouponService;

    public UserCouponController(UserCouponService userCouponService) {
        this.userCouponService = userCouponService;
    }

    /**
     * 내 쿠폰 목록 조회
     * GET /api/user/coupons
     */
    @GetMapping
    public ResponseEntity<List<UserCouponResponse>> getMyCoupons(Authentication authentication) {
        String userEmail = authentication.getName();
        List<UserCouponResponse> coupons = userCouponService.getUserCoupons(userEmail);
        return ResponseEntity.ok(coupons);
    }

    /**
     * 사용 가능한 쿠폰 목록 조회
     * GET /api/user/coupons/available
     */
    @GetMapping("/available")
    public ResponseEntity<List<UserCouponResponse>> getAvailableCoupons(Authentication authentication) {
        String userEmail = authentication.getName();
        List<UserCouponResponse> coupons = userCouponService.getAvailableCoupons(userEmail);
        return ResponseEntity.ok(coupons);
    }

    /**
     * 특정 주문 금액에 사용 가능한 쿠폰 조회
     * GET /api/user/coupons/available-for-order?orderAmount=50000
     */
    @GetMapping("/available-for-order")
    public ResponseEntity<List<UserCouponResponse>> getAvailableCouponsForOrder(
            @RequestParam BigDecimal orderAmount,
            Authentication authentication) {
        String userEmail = authentication.getName();
        List<UserCouponResponse> coupons = userCouponService.getAvailableCouponsForOrder(userEmail, orderAmount);
        return ResponseEntity.ok(coupons);
    }

    /**
     * 쿠폰 다운로드
     * POST /api/user/coupons/download/{couponCode}
     */
    @PostMapping("/download/{couponCode}")
    public ResponseEntity<UserCouponResponse> downloadCoupon(
            @PathVariable String couponCode,
            Authentication authentication) {
        String userEmail = authentication.getName();
        UserCouponResponse coupon = userCouponService.downloadCoupon(userEmail, couponCode);
        return ResponseEntity.ok(coupon);
    }
}
