package com.agri.market.auth;

import com.agri.market.coupon.Coupon;
import com.agri.market.coupon.CouponRepository;
import com.agri.market.coupon.UserCoupon;
import com.agri.market.coupon.UserCouponRepository;
import com.agri.market.dto.LoginRequest;
import com.agri.market.dto.RegisterRequest;
import com.agri.market.security.JwtTokenProvider;
import com.agri.market.service.EmailService;
import com.agri.market.user.User;
import com.agri.market.user.UserRepository;
import com.agri.market.user.address.UserAddress;
import com.agri.market.user.address.UserAddressRepository;
import io.github.resilience4j.ratelimiter.annotation.RateLimiter;
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
    private final UserAddressRepository userAddressRepository;
    private final EmailService emailService;

    @Value("${coupon.welcome.code:WELCOME}")
    private String welcomeCouponCode;

    public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder,
                       AuthenticationManager authenticationManager, JwtTokenProvider jwtTokenProvider,
                       CouponRepository couponRepository, UserCouponRepository userCouponRepository,
                       UserAddressRepository userAddressRepository, EmailService emailService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.authenticationManager = authenticationManager;
        this.jwtTokenProvider = jwtTokenProvider;
        this.couponRepository = couponRepository;
        this.userCouponRepository = userCouponRepository;
        this.userAddressRepository = userAddressRepository;
        this.emailService = emailService;
    }

    @RateLimiter(name = "auth")
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

        // 회원가입 시 기본 배송지 자동 등록
        createDefaultAddress(savedUser, request);

        // 회원가입 시 웰컴 쿠폰 자동 발급
        issueWelcomeCoupon(savedUser);
    }

    /**
     * 회원가입 시 기본 배송지 자동 등록
     */
    private void createDefaultAddress(User user, RegisterRequest request) {
        try {
            // 주소 정보가 모두 있는 경우에만 배송지 등록
            if (request.getPostcode() != null && !request.getPostcode().isEmpty() &&
                request.getAddressLine1() != null && !request.getAddressLine1().isEmpty()) {

                UserAddress address = new UserAddress();
                address.setUser(user);
                address.setLabel("기본 배송지");
                address.setRecipient(user.getName());
                address.setPhone(user.getPhone());
                address.setPostcode(request.getPostcode());
                address.setAddressLine1(request.getAddressLine1());
                address.setAddressLine2(request.getAddressLine2());
                address.setDefault(true);

                userAddressRepository.save(address);
                logger.info("사용자 {}({})의 기본 배송지를 등록했습니다.", user.getName(), user.getEmail());
            }
        } catch (Exception e) {
            // 배송지 등록 실패 시 회원가입은 정상적으로 진행되도록 함
            logger.error("기본 배송지 등록 중 오류 발생 (사용자: {}): {}", user.getEmail(), e.getMessage(), e);
        }
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

    @RateLimiter(name = "auth")
    public String authenticateUser(LoginRequest loginRequest) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(loginRequest.getEmail(), loginRequest.getPassword()));

        SecurityContextHolder.getContext().setAuthentication(authentication);

        // 로그인 상태 유지 여부에 따라 JWT 만료 시간 설정
        // rememberMe가 true면 30일, false면 1일
        long expirationMs = Boolean.TRUE.equals(loginRequest.getRememberMe())
                ? 30L * 24 * 60 * 60 * 1000  // 30일
                : 24L * 60 * 60 * 1000;       // 1일

        return jwtTokenProvider.generateJwtToken(authentication, expirationMs);
    }

    public Optional<User> findByEmail(String email) {
        return userRepository.findByEmail(email);
    }

    /**
     * 비밀번호 재설정 요청 처리
     * 임시 비밀번호를 생성하고 사용자 비밀번호를 변경한 후 이메일로 전송합니다.
     */
    public void resetPassword(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("해당 이메일로 가입된 계정이 없습니다."));

        // 임시 비밀번호 생성 (8자리 랜덤)
        String tempPassword = generateTempPassword();

        // 비밀번호 변경
        user.setPasswordHash(passwordEncoder.encode(tempPassword));
        userRepository.save(user);

        logger.info("사용자 {}({})의 비밀번호가 재설정되었습니다.", user.getName(), user.getEmail());

        // 이메일로 임시 비밀번호 전송
        try {
            emailService.sendPasswordResetEmail(user.getEmail(), user.getName(), tempPassword);
            logger.info("임시 비밀번호 이메일 전송 완료: {}", user.getEmail());
        } catch (Exception e) {
            logger.error("임시 비밀번호 이메일 전송 실패: {} - {}", user.getEmail(), e.getMessage(), e);
            throw new RuntimeException("이메일 전송에 실패했습니다. 잠시 후 다시 시도해주세요.");
        }
    }

    /**
     * 임시 비밀번호 생성 (영문 대소문자 + 숫자 조합, 8자리)
     */
    private String generateTempPassword() {
        String chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        StringBuilder sb = new StringBuilder();
        java.util.Random random = new java.util.Random();

        for (int i = 0; i < 8; i++) {
            sb.append(chars.charAt(random.nextInt(chars.length())));
        }

        return sb.toString();
    }
}