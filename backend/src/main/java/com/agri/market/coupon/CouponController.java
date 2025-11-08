package com.agri.market.coupon;

import com.agri.market.dto.CouponResponse;
import com.agri.market.dto.CouponValidationRequest;
import com.agri.market.dto.CouponValidationResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.List;

/**
 * 쿠폰 컨트롤러 (공개 엔드포인트)
 */
@RestController
@RequestMapping("/api/coupons")
public class CouponController {

    private final CouponService couponService;

    public CouponController(CouponService couponService) {
        this.couponService = couponService;
    }

    /**
     * 활성화된 쿠폰 목록 조회 (공개)
     * GET /api/coupons/active
     */
    @GetMapping("/active")
    public ResponseEntity<List<CouponResponse>> getActiveCoupons() {
        List<CouponResponse> coupons = couponService.getActiveCoupons();
        return ResponseEntity.ok(coupons);
    }

    /**
     * 쿠폰 코드로 조회 (공개)
     * GET /api/coupons/code/{code}
     */
    @GetMapping("/code/{code}")
    public ResponseEntity<CouponResponse> getCouponByCode(@PathVariable String code) {
        CouponResponse coupon = couponService.getCouponByCode(code);
        return ResponseEntity.ok(coupon);
    }

    /**
     * 쿠폰 유효성 검증 (공개)
     * POST /api/coupons/validate
     */
    @PostMapping("/validate")
    public ResponseEntity<CouponValidationResponse> validateCoupon(
            @Valid @RequestBody CouponValidationRequest request) {
        CouponValidationResponse response = couponService.validateCoupon(request);
        return ResponseEntity.ok(response);
    }
}
