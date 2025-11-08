package com.agri.market.coupon;

import com.agri.market.dto.*;
import com.agri.market.exception.BusinessException;
import com.agri.market.product.Product;
import com.agri.market.product.ProductRepository;
import com.agri.market.user.User;
import com.agri.market.user.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

/**
 * 쿠폰 서비스
 */
@Service
public class CouponService {

    private final CouponRepository couponRepository;
    private final UserCouponRepository userCouponRepository;
    private final CouponProductRepository couponProductRepository;
    private final UserRepository userRepository;
    private final ProductRepository productRepository;

    public CouponService(CouponRepository couponRepository,
                         UserCouponRepository userCouponRepository,
                         CouponProductRepository couponProductRepository,
                         UserRepository userRepository,
                         ProductRepository productRepository) {
        this.couponRepository = couponRepository;
        this.userCouponRepository = userCouponRepository;
        this.couponProductRepository = couponProductRepository;
        this.userRepository = userRepository;
        this.productRepository = productRepository;
    }

    /**
     * 쿠폰 생성
     */
    @Transactional
    public CouponResponse createCoupon(CouponRequest request) {
        // 쿠폰 코드 중복 확인
        if (couponRepository.existsByCode(request.getCode())) {
            throw new BusinessException("이미 존재하는 쿠폰 코드입니다: " + request.getCode(), "COUPON_CODE_DUPLICATED");
        }

        // 시작일/종료일 검증
        if (request.getStartDate().isAfter(request.getEndDate())) {
            throw new BusinessException("시작일이 종료일보다 늦을 수 없습니다", "INVALID_DATE_RANGE");
        }

        // 정률 할인 검증
        if (request.getDiscountType() == DiscountType.PERCENTAGE) {
            if (request.getDiscountValue().compareTo(BigDecimal.ZERO) <= 0 ||
                request.getDiscountValue().compareTo(BigDecimal.valueOf(100)) > 0) {
                throw new BusinessException("할인율은 0%보다 크고 100% 이하여야 합니다", "INVALID_DISCOUNT_PERCENTAGE");
            }
        }

        Coupon coupon = new Coupon();
        coupon.setCode(request.getCode().toUpperCase()); // 대문자로 변환
        coupon.setName(request.getName());
        coupon.setDescription(request.getDescription());
        coupon.setDiscountType(request.getDiscountType());
        coupon.setDiscountValue(request.getDiscountValue());
        coupon.setMinOrderAmount(request.getMinOrderAmount() != null ? request.getMinOrderAmount() : BigDecimal.ZERO);
        coupon.setMaxDiscountAmount(request.getMaxDiscountAmount());
        coupon.setStartDate(request.getStartDate());
        coupon.setEndDate(request.getEndDate());
        coupon.setTotalQuantity(request.getTotalQuantity());
        coupon.setUsedQuantity(0);
        coupon.setIsActive(request.getIsActive() != null ? request.getIsActive() : true);
        coupon.setUsageType(request.getUsageType());
        coupon.setApplicableCategory(request.getApplicableCategory());

        Coupon savedCoupon = couponRepository.save(coupon);

        // 적용 가능한 상품 설정
        if (request.getApplicableProductIds() != null && !request.getApplicableProductIds().isEmpty()) {
            for (Long productId : request.getApplicableProductIds()) {
                Product product = productRepository.findById(productId)
                        .orElseThrow(() -> new BusinessException("상품을 찾을 수 없습니다: " + productId, "PRODUCT_NOT_FOUND"));

                CouponProduct couponProduct = new CouponProduct();
                couponProduct.setCoupon(savedCoupon);
                couponProduct.setProduct(product);
                couponProductRepository.save(couponProduct);
            }
        }

        return new CouponResponse(savedCoupon);
    }

    /**
     * 쿠폰 수정
     */
    @Transactional
    public CouponResponse updateCoupon(Long id, CouponRequest request) {
        Coupon coupon = couponRepository.findById(id)
                .orElseThrow(() -> new BusinessException("쿠폰을 찾을 수 없습니다: " + id, "COUPON_NOT_FOUND"));

        // 쿠폰 코드 중복 확인 (다른 쿠폰과 중복되는지)
        if (!coupon.getCode().equals(request.getCode()) && couponRepository.existsByCode(request.getCode())) {
            throw new BusinessException("이미 존재하는 쿠폰 코드입니다: " + request.getCode(), "COUPON_CODE_DUPLICATED");
        }

        // 시작일/종료일 검증
        if (request.getStartDate().isAfter(request.getEndDate())) {
            throw new BusinessException("시작일이 종료일보다 늦을 수 없습니다", "INVALID_DATE_RANGE");
        }

        coupon.setCode(request.getCode().toUpperCase());
        coupon.setName(request.getName());
        coupon.setDescription(request.getDescription());
        coupon.setDiscountType(request.getDiscountType());
        coupon.setDiscountValue(request.getDiscountValue());
        coupon.setMinOrderAmount(request.getMinOrderAmount() != null ? request.getMinOrderAmount() : BigDecimal.ZERO);
        coupon.setMaxDiscountAmount(request.getMaxDiscountAmount());
        coupon.setStartDate(request.getStartDate());
        coupon.setEndDate(request.getEndDate());
        coupon.setTotalQuantity(request.getTotalQuantity());
        coupon.setIsActive(request.getIsActive() != null ? request.getIsActive() : true);
        coupon.setUsageType(request.getUsageType());
        coupon.setApplicableCategory(request.getApplicableCategory());

        // 기존 상품 연결 삭제 후 재생성
        couponProductRepository.deleteByCoupon(coupon);
        if (request.getApplicableProductIds() != null && !request.getApplicableProductIds().isEmpty()) {
            for (Long productId : request.getApplicableProductIds()) {
                Product product = productRepository.findById(productId)
                        .orElseThrow(() -> new BusinessException("상품을 찾을 수 없습니다: " + productId, "PRODUCT_NOT_FOUND"));

                CouponProduct couponProduct = new CouponProduct();
                couponProduct.setCoupon(coupon);
                couponProduct.setProduct(product);
                couponProductRepository.save(couponProduct);
            }
        }

        Coupon updatedCoupon = couponRepository.save(coupon);
        return new CouponResponse(updatedCoupon);
    }

    /**
     * 쿠폰 삭제
     */
    @Transactional
    public void deleteCoupon(Long id) {
        Coupon coupon = couponRepository.findById(id)
                .orElseThrow(() -> new BusinessException("쿠폰을 찾을 수 없습니다: " + id, "COUPON_NOT_FOUND"));

        // 사용된 쿠폰이 있는지 확인
        if (coupon.getUsedQuantity() > 0) {
            throw new BusinessException(
                    "사용된 이력이 있는 쿠폰은 삭제할 수 없습니다. 비활성화를 권장합니다.",
                    "COUPON_HAS_USAGE_HISTORY");
        }

        couponRepository.delete(coupon);
    }

    /**
     * 쿠폰 조회 (ID)
     */
    @Transactional(readOnly = true)
    public CouponResponse getCoupon(Long id) {
        Coupon coupon = couponRepository.findById(id)
                .orElseThrow(() -> new BusinessException("쿠폰을 찾을 수 없습니다: " + id, "COUPON_NOT_FOUND"));
        return new CouponResponse(coupon);
    }

    /**
     * 쿠폰 조회 (코드)
     */
    @Transactional(readOnly = true)
    public CouponResponse getCouponByCode(String code) {
        Coupon coupon = couponRepository.findByCode(code.toUpperCase())
                .orElseThrow(() -> new BusinessException("쿠폰을 찾을 수 없습니다: " + code, "COUPON_NOT_FOUND"));
        return new CouponResponse(coupon);
    }

    /**
     * 활성화된 쿠폰 목록 조회
     */
    @Transactional(readOnly = true)
    public List<CouponResponse> getActiveCoupons() {
        LocalDateTime now = LocalDateTime.now();
        List<Coupon> coupons = couponRepository.findActiveCoupons(now);
        return coupons.stream()
                .map(CouponResponse::new)
                .collect(Collectors.toList());
    }

    /**
     * 모든 쿠폰 조회 (페이징, 관리자용)
     */
    @Transactional(readOnly = true)
    public Page<CouponResponse> getAllCoupons(Pageable pageable) {
        Page<Coupon> coupons = couponRepository.findAllByOrderByCreatedAtDesc(pageable);
        return coupons.map(CouponResponse::new);
    }

    /**
     * 쿠폰 유효성 검증
     */
    @Transactional(readOnly = true)
    public CouponValidationResponse validateCoupon(CouponValidationRequest request) {
        // 쿠폰 조회
        Coupon coupon = couponRepository.findByCode(request.getCouponCode().toUpperCase())
                .orElse(null);

        if (coupon == null) {
            return CouponValidationResponse.failure("존재하지 않는 쿠폰 코드입니다.");
        }

        // 유효성 검증
        if (!coupon.isValid()) {
            if (!coupon.getIsActive()) {
                return CouponValidationResponse.failure("비활성화된 쿠폰입니다.");
            }
            if (coupon.isExpired()) {
                return CouponValidationResponse.failure("만료된 쿠폰입니다.");
            }
            if (!coupon.hasStock()) {
                return CouponValidationResponse.failure("쿠폰 수량이 모두 소진되었습니다.");
            }
            return CouponValidationResponse.failure("유효하지 않은 쿠폰입니다.");
        }

        // 최소 주문 금액 확인
        if (!coupon.meetsMinOrderAmount(request.getOrderAmount())) {
            return CouponValidationResponse.failure(
                    String.format("최소 주문 금액 %,d원 이상부터 사용 가능합니다.", coupon.getMinOrderAmount().intValue()));
        }

        // 카테고리 확인
        if (request.getCategory() != null && !coupon.isApplicableToCategory(request.getCategory())) {
            return CouponValidationResponse.failure("해당 카테고리에는 적용할 수 없는 쿠폰입니다.");
        }

        // 상품 확인
        if (request.getProductId() != null && !coupon.isApplicableToProduct(request.getProductId())) {
            return CouponValidationResponse.failure("해당 상품에는 적용할 수 없는 쿠폰입니다.");
        }

        // 할인 금액 계산
        BigDecimal discountAmount = coupon.calculateDiscount(request.getOrderAmount());
        BigDecimal finalAmount = request.getOrderAmount().subtract(discountAmount);

        return CouponValidationResponse.success(discountAmount, finalAmount);
    }

    /**
     * 특정 사용자에게 쿠폰 발급
     */
    @Transactional
    public UserCouponResponse issueCouponToUser(Long couponId, String userEmail) {
        Coupon coupon = couponRepository.findById(couponId)
                .orElseThrow(() -> new BusinessException("쿠폰을 찾을 수 없습니다: " + couponId, "COUPON_NOT_FOUND"));

        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new BusinessException("사용자를 찾을 수 없습니다: " + userEmail, "USER_NOT_FOUND"));

        // 재고 확인
        if (!coupon.hasStock()) {
            throw new BusinessException("쿠폰 수량이 모두 소진되었습니다.", "COUPON_OUT_OF_STOCK");
        }

        // 이미 발급받은 쿠폰인지 확인 (단일 사용 쿠폰만)
        if (coupon.getUsageType() == CouponUsageType.SINGLE_USE) {
            if (userCouponRepository.existsByUserAndCoupon(user, coupon)) {
                throw new BusinessException("이미 발급받은 쿠폰입니다.", "COUPON_ALREADY_ISSUED");
            }
        }

        // UserCoupon 생성
        UserCoupon userCoupon = new UserCoupon();
        userCoupon.setUser(user);
        userCoupon.setCoupon(coupon);
        userCoupon.setExpiresAt(coupon.getEndDate()); // 쿠폰 종료일을 만료일로 설정

        UserCoupon savedUserCoupon = userCouponRepository.save(userCoupon);

        return new UserCouponResponse(savedUserCoupon);
    }

    /**
     * 모든 사용자에게 쿠폰 발급
     */
    @Transactional
    public int issueCouponToAllUsers(Long couponId) {
        Coupon coupon = couponRepository.findById(couponId)
                .orElseThrow(() -> new BusinessException("쿠폰을 찾을 수 없습니다: " + couponId, "COUPON_NOT_FOUND"));

        List<User> allUsers = userRepository.findAll();
        int issuedCount = 0;

        for (User user : allUsers) {
            // 이미 발급받은 사용자는 제외 (단일 사용 쿠폰만)
            if (coupon.getUsageType() == CouponUsageType.SINGLE_USE) {
                if (userCouponRepository.existsByUserAndCoupon(user, coupon)) {
                    continue;
                }
            }

            UserCoupon userCoupon = new UserCoupon();
            userCoupon.setUser(user);
            userCoupon.setCoupon(coupon);
            userCoupon.setExpiresAt(coupon.getEndDate());

            userCouponRepository.save(userCoupon);
            issuedCount++;
        }

        return issuedCount;
    }

    /**
     * 할인 금액 계산
     */
    @Transactional(readOnly = true)
    public BigDecimal calculateDiscount(Long couponId, BigDecimal orderAmount) {
        Coupon coupon = couponRepository.findById(couponId)
                .orElseThrow(() -> new BusinessException("쿠폰을 찾을 수 없습니다: " + couponId, "COUPON_NOT_FOUND"));

        return coupon.calculateDiscount(orderAmount);
    }
}
