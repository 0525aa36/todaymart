package com.agri.market.coupon;

import com.agri.market.dto.UserCouponResponse;
import com.agri.market.exception.BusinessException;
import com.agri.market.order.Order;
import com.agri.market.user.User;
import com.agri.market.user.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

/**
 * 사용자 쿠폰 서비스
 */
@Service
public class UserCouponService {

    private final UserCouponRepository userCouponRepository;
    private final CouponRepository couponRepository;
    private final UserRepository userRepository;

    public UserCouponService(UserCouponRepository userCouponRepository,
                             CouponRepository couponRepository,
                             UserRepository userRepository) {
        this.userCouponRepository = userCouponRepository;
        this.couponRepository = couponRepository;
        this.userRepository = userRepository;
    }

    /**
     * 사용자의 모든 쿠폰 조회
     */
    @Transactional(readOnly = true)
    public List<UserCouponResponse> getUserCoupons(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new BusinessException("사용자를 찾을 수 없습니다: " + userEmail, "USER_NOT_FOUND"));

        List<UserCoupon> userCoupons = userCouponRepository.findByUserOrderByIssuedAtDesc(user);

        return userCoupons.stream()
                .map(UserCouponResponse::new)
                .collect(Collectors.toList());
    }

    /**
     * 사용자의 사용 가능한 쿠폰 조회
     */
    @Transactional(readOnly = true)
    public List<UserCouponResponse> getAvailableCoupons(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new BusinessException("사용자를 찾을 수 없습니다: " + userEmail, "USER_NOT_FOUND"));

        LocalDateTime now = LocalDateTime.now();
        List<UserCoupon> availableCoupons = userCouponRepository.findAvailableCoupons(user, now);

        return availableCoupons.stream()
                .map(UserCouponResponse::new)
                .collect(Collectors.toList());
    }

    /**
     * 특정 주문 금액에 사용 가능한 쿠폰 조회
     */
    @Transactional(readOnly = true)
    public List<UserCouponResponse> getAvailableCouponsForOrder(String userEmail, BigDecimal orderAmount) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new BusinessException("사용자를 찾을 수 없습니다: " + userEmail, "USER_NOT_FOUND"));

        LocalDateTime now = LocalDateTime.now();
        List<UserCoupon> availableCoupons = userCouponRepository.findAvailableCoupons(user, now);

        // 최소 주문 금액을 만족하는 쿠폰만 필터링
        return availableCoupons.stream()
                .filter(uc -> uc.getCoupon().meetsMinOrderAmount(orderAmount))
                .map(UserCouponResponse::new)
                .collect(Collectors.toList());
    }

    /**
     * 쿠폰 다운로드 (공개 쿠폰)
     */
    @Transactional
    public UserCouponResponse downloadCoupon(String userEmail, String couponCode) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new BusinessException("사용자를 찾을 수 없습니다: " + userEmail, "USER_NOT_FOUND"));

        Coupon coupon = couponRepository.findByCode(couponCode.toUpperCase())
                .orElseThrow(() -> new BusinessException("쿠폰을 찾을 수 없습니다: " + couponCode, "COUPON_NOT_FOUND"));

        // 쿠폰 유효성 확인
        if (!coupon.isValid()) {
            if (!coupon.getIsActive()) {
                throw new BusinessException("비활성화된 쿠폰입니다.", "COUPON_INACTIVE");
            }
            if (coupon.isExpired()) {
                throw new BusinessException("만료된 쿠폰입니다.", "COUPON_EXPIRED");
            }
            if (!coupon.hasStock()) {
                throw new BusinessException("쿠폰 수량이 모두 소진되었습니다.", "COUPON_OUT_OF_STOCK");
            }
            throw new BusinessException("유효하지 않은 쿠폰입니다.", "COUPON_INVALID");
        }

        // 이미 다운로드한 쿠폰인지 확인 (단일 사용 쿠폰만)
        if (coupon.getUsageType() == CouponUsageType.SINGLE_USE) {
            if (userCouponRepository.existsByUserAndCoupon(user, coupon)) {
                throw new BusinessException("이미 다운로드한 쿠폰입니다.", "COUPON_ALREADY_DOWNLOADED");
            }
        }

        // UserCoupon 생성
        UserCoupon userCoupon = new UserCoupon();
        userCoupon.setUser(user);
        userCoupon.setCoupon(coupon);
        userCoupon.setExpiresAt(coupon.getEndDate());

        UserCoupon savedUserCoupon = userCouponRepository.save(userCoupon);

        return new UserCouponResponse(savedUserCoupon);
    }

    /**
     * 쿠폰 사용 처리 (주문 시 호출)
     */
    @Transactional
    public void useCoupon(Long userCouponId, Order order) {
        UserCoupon userCoupon = userCouponRepository.findById(userCouponId)
                .orElseThrow(() -> new BusinessException("사용자 쿠폰을 찾을 수 없습니다: " + userCouponId, "USER_COUPON_NOT_FOUND"));

        // 쿠폰 사용 가능 여부 확인
        if (!userCoupon.isAvailable()) {
            if (userCoupon.isUsed()) {
                throw new BusinessException("이미 사용된 쿠폰입니다.", "COUPON_ALREADY_USED");
            }
            if (userCoupon.isExpired()) {
                throw new BusinessException("만료된 쿠폰입니다.", "COUPON_EXPIRED");
            }
            throw new BusinessException("사용할 수 없는 쿠폰입니다.", "COUPON_UNAVAILABLE");
        }

        // 주문자와 쿠폰 소유자 일치 확인
        if (!userCoupon.getUser().getId().equals(order.getUser().getId())) {
            throw new BusinessException("본인의 쿠폰만 사용할 수 있습니다.", "COUPON_OWNER_MISMATCH");
        }

        // 쿠폰 사용 처리
        userCoupon.use(order);
        userCouponRepository.save(userCoupon);

        // 쿠폰 사용 수량 증가
        Coupon coupon = userCoupon.getCoupon();
        coupon.setUsedQuantity(coupon.getUsedQuantity() + 1);
        couponRepository.save(coupon);
    }

    /**
     * 쿠폰 사용 취소 (주문 취소 시 호출)
     */
    @Transactional
    public void cancelCouponUsage(Long userCouponId) {
        UserCoupon userCoupon = userCouponRepository.findById(userCouponId)
                .orElseThrow(() -> new BusinessException("사용자 쿠폰을 찾을 수 없습니다: " + userCouponId, "USER_COUPON_NOT_FOUND"));

        if (!userCoupon.isUsed()) {
            return; // 이미 취소되었거나 사용되지 않은 쿠폰
        }

        // 쿠폰 사용 취소
        userCoupon.setUsedAt(null);
        userCoupon.setOrder(null);
        userCouponRepository.save(userCoupon);

        // 쿠폰 사용 수량 감소
        Coupon coupon = userCoupon.getCoupon();
        if (coupon.getUsedQuantity() > 0) {
            coupon.setUsedQuantity(coupon.getUsedQuantity() - 1);
            couponRepository.save(coupon);
        }
    }

    /**
     * UserCoupon ID로 조회 (내부용)
     */
    @Transactional(readOnly = true)
    public UserCoupon getUserCouponById(Long userCouponId) {
        return userCouponRepository.findById(userCouponId)
                .orElseThrow(() -> new BusinessException("사용자 쿠폰을 찾을 수 없습니다: " + userCouponId, "USER_COUPON_NOT_FOUND"));
    }

    /**
     * 사용자와 쿠폰으로 UserCoupon 조회 (내부용)
     */
    @Transactional(readOnly = true)
    public UserCoupon findAvailableUserCoupon(User user, Coupon coupon) {
        return userCouponRepository.findByUserAndCouponAndUsedAtIsNull(user, coupon)
                .orElseThrow(() -> new BusinessException("사용 가능한 쿠폰이 없습니다.", "USER_COUPON_NOT_AVAILABLE"));
    }

    /**
     * 주문에 사용된 UserCoupon 조회 (내부용)
     */
    @Transactional(readOnly = true)
    public UserCoupon findByOrder(Order order) {
        return userCouponRepository.findByOrder(order)
                .orElse(null);
    }
}
