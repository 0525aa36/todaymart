package com.agri.market.coupon;

import com.agri.market.dto.CouponRequest;
import com.agri.market.dto.CouponResponse;
import com.agri.market.dto.UserCouponResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.HashMap;
import java.util.Map;

/**
 * 관리자 쿠폰 컨트롤러 (ADMIN 권한 필요)
 */
@RestController
@RequestMapping("/api/admin/coupons")
@PreAuthorize("hasRole('ADMIN')")
public class AdminCouponController {

    private final CouponService couponService;

    public AdminCouponController(CouponService couponService) {
        this.couponService = couponService;
    }

    /**
     * 쿠폰 생성
     * POST /api/admin/coupons
     */
    @PostMapping
    public ResponseEntity<CouponResponse> createCoupon(@Valid @RequestBody CouponRequest request) {
        CouponResponse coupon = couponService.createCoupon(request);
        return ResponseEntity.ok(coupon);
    }

    /**
     * 쿠폰 수정
     * PUT /api/admin/coupons/{id}
     */
    @PutMapping("/{id}")
    public ResponseEntity<CouponResponse> updateCoupon(
            @PathVariable Long id,
            @Valid @RequestBody CouponRequest request) {
        CouponResponse coupon = couponService.updateCoupon(id, request);
        return ResponseEntity.ok(coupon);
    }

    /**
     * 쿠폰 삭제
     * DELETE /api/admin/coupons/{id}
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteCoupon(@PathVariable Long id) {
        couponService.deleteCoupon(id);
        return ResponseEntity.noContent().build();
    }

    /**
     * 쿠폰 조회 (ID)
     * GET /api/admin/coupons/{id}
     */
    @GetMapping("/{id}")
    public ResponseEntity<CouponResponse> getCoupon(@PathVariable Long id) {
        CouponResponse coupon = couponService.getCoupon(id);
        return ResponseEntity.ok(coupon);
    }

    /**
     * 모든 쿠폰 조회 (페이징)
     * GET /api/admin/coupons?page=0&size=10
     */
    @GetMapping
    public ResponseEntity<Page<CouponResponse>> getAllCoupons(
            @PageableDefault(size = 10, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<CouponResponse> coupons = couponService.getAllCoupons(pageable);
        return ResponseEntity.ok(coupons);
    }

    /**
     * 특정 사용자에게 쿠폰 발급
     * POST /api/admin/coupons/{couponId}/issue
     * Body: { "userEmail": "user@example.com" }
     */
    @PostMapping("/{couponId}/issue")
    public ResponseEntity<UserCouponResponse> issueCouponToUser(
            @PathVariable Long couponId,
            @RequestBody Map<String, String> request) {
        String userEmail = request.get("userEmail");
        UserCouponResponse userCoupon = couponService.issueCouponToUser(couponId, userEmail);
        return ResponseEntity.ok(userCoupon);
    }

    /**
     * 모든 사용자에게 쿠폰 발급
     * POST /api/admin/coupons/{couponId}/issue-all
     */
    @PostMapping("/{couponId}/issue-all")
    public ResponseEntity<Map<String, Integer>> issueCouponToAllUsers(@PathVariable Long couponId) {
        int issuedCount = couponService.issueCouponToAllUsers(couponId);
        Map<String, Integer> response = new HashMap<>();
        response.put("issuedCount", issuedCount);
        return ResponseEntity.ok(response);
    }
}
