package com.agri.market.auth;

import com.agri.market.coupon.Coupon;
import com.agri.market.coupon.CouponRepository;
import com.agri.market.coupon.UserCoupon;
import com.agri.market.coupon.UserCouponRepository;
import com.agri.market.dto.LoginRequest;
import com.agri.market.dto.RegisterRequest;
import com.agri.market.security.JwtTokenProvider;
import com.agri.market.user.User;
import com.agri.market.user.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.Optional;

@Service
public class AuthService {

    private static final Logger logger = LoggerFactory.getLogger(AuthService.class);

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider jwtTokenProvider;
    private final CouponRepository couponRepository;
    private final UserCouponRepository userCouponRepository;

    @Value("${coupon.welcome.code:WELCOME}")
    private String welcomeCouponCode;

    public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder,
                       AuthenticationManager authenticationManager, JwtTokenProvider jwtTokenProvider,
                       CouponRepository couponRepository, UserCouponRepository userCouponRepository) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.authenticationManager = authenticationManager;
        this.jwtTokenProvider = jwtTokenProvider;
        this.couponRepository = couponRepository;
        this.userCouponRepository = userCouponRepository;
    }

    public void register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Error: Email is already in use!");
        }

        User user = new User();
        user.setEmail(request.getEmail());
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        user.setName(request.getName());
        user.setPhone(request.getPhone());
        user.setAddressLine1(request.getAddressLine1());
        user.setAddressLine2(request.getAddressLine2());
        user.setPostcode(request.getPostcode());
        user.setBirthDate(request.getBirthDate());
        user.setGender(request.getGender());
        user.setRole("USER"); // Default role
        user.setMarketingConsent(request.getMarketingConsent() != null ? request.getMarketingConsent() : false);

        User savedUser = userRepository.save(user);

        // 회원가입 시 웰컴 쿠폰 자동 발급
        issueWelcomeCoupon(savedUser);
    }

    /**
     * 신규 가입 사용자에게 웰컴 쿠폰 자동 발급
     */
    private void issueWelcomeCoupon(User user) {
        try {
            Optional<Coupon> welcomeCouponOpt = couponRepository.findByCode(welcomeCouponCode);

            if (welcomeCouponOpt.isEmpty()) {
                logger.info("웰컴 쿠폰(code: {})이 존재하지 않아 자동 발급을 건너뜁니다.", welcomeCouponCode);
                return;
            }

            Coupon welcomeCoupon = welcomeCouponOpt.get();

            // 쿠폰 유효성 확인
            if (!welcomeCoupon.isValid()) {
                logger.warn("웰컴 쿠폰(code: {})이 유효하지 않아 발급할 수 없습니다. (active: {}, expired: {}, hasStock: {})",
                        welcomeCouponCode, welcomeCoupon.getIsActive(), welcomeCoupon.isExpired(), welcomeCoupon.hasStock());
                return;
            }

            // UserCoupon 생성 및 저장
            UserCoupon userCoupon = new UserCoupon();
            userCoupon.setUser(user);
            userCoupon.setCoupon(welcomeCoupon);
            userCoupon.setExpiresAt(welcomeCoupon.getEndDate());

            userCouponRepository.save(userCoupon);
            logger.info("사용자 {}({})에게 웰컴 쿠폰(code: {})을 발급했습니다.",
                    user.getName(), user.getEmail(), welcomeCouponCode);

        } catch (Exception e) {
            // 웰컴 쿠폰 발급 실패 시 회원가입은 정상적으로 진행되도록 함
            logger.error("웰컴 쿠폰 발급 중 오류 발생 (사용자: {}): {}", user.getEmail(), e.getMessage(), e);
        }
    }

    public String authenticateUser(LoginRequest loginRequest) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(loginRequest.getEmail(), loginRequest.getPassword()));

        SecurityContextHolder.getContext().setAuthentication(authentication);
        return jwtTokenProvider.generateJwtToken(authentication);
    }

    public Optional<User> findByEmail(String email) {
        return userRepository.findByEmail(email);
    }
}