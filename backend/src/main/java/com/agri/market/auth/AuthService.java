package com.agri.market.auth;

import com.agri.market.dto.LoginRequest;
import com.agri.market.dto.RegisterRequest;
import com.agri.market.exception.InvalidTokenException;
import com.agri.market.security.JwtTokenProvider;
import com.agri.market.service.EmailService;
import com.agri.market.token.RefreshToken;
import com.agri.market.token.RefreshTokenService;
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
    private final RefreshTokenService refreshTokenService;
    private final UserAddressRepository userAddressRepository;
    private final EmailService emailService;

    public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder,
                       AuthenticationManager authenticationManager, JwtTokenProvider jwtTokenProvider,
                       RefreshTokenService refreshTokenService,
                       UserAddressRepository userAddressRepository, EmailService emailService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.authenticationManager = authenticationManager;
        this.jwtTokenProvider = jwtTokenProvider;
        this.refreshTokenService = refreshTokenService;
        this.userAddressRepository = userAddressRepository;
        this.emailService = emailService;
    }

    @RateLimiter(name = "auth")
    public void register(RegisterRequest request) {
        // 이메일 중복 확인
        Optional<User> existingUser = userRepository.findByEmail(request.getEmail());
        if (existingUser.isPresent()) {
            User user = existingUser.get();
            String provider = user.getProvider();

            // 소셜 로그인으로 가입된 계정인지 확인
            if (provider != null && !provider.equals("LOCAL")) {
                String providerName = getProviderDisplayName(provider);
                throw new IllegalArgumentException("이미 " + providerName + " 로그인으로 가입된 이메일입니다. " + providerName + " 로그인을 사용해주세요.");
            } else {
                throw new IllegalArgumentException("이미 가입된 이메일입니다.");
            }
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
    }

    /**
     * provider 코드를 한글 이름으로 변환
     */
    private String getProviderDisplayName(String provider) {
        switch (provider.toUpperCase()) {
            case "NAVER":
                return "네이버";
            case "KAKAO":
                return "카카오";
            case "GOOGLE":
                return "구글";
            default:
                return provider;
        }
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

    /**
     * 리프레시 토큰을 포함한 인증 처리 (새 버전)
     * 액세스 토큰과 리프레시 토큰을 함께 생성합니다
     */
    @RateLimiter(name = "auth")
    public AuthTokens authenticateWithRefreshToken(LoginRequest loginRequest) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(loginRequest.getEmail(), loginRequest.getPassword()));

        SecurityContextHolder.getContext().setAuthentication(authentication);

        // 액세스 토큰 생성 (1시간)
        String accessToken = jwtTokenProvider.generateAccessToken(authentication);

        // 사용자 정보 가져오기
        User user = findByEmail(loginRequest.getEmail())
                .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));

        // 리프레시 토큰 생성 및 DB 저장 (30일)
        RefreshToken refreshToken = refreshTokenService.createRefreshToken(user);

        return new AuthTokens(accessToken, refreshToken.getToken(),
                jwtTokenProvider.getAccessTokenExpirationMs(),
                jwtTokenProvider.getRefreshTokenExpirationMs());
    }

    /**
     * 리프레시 토큰으로 새로운 액세스 토큰 발급
     */
    public String refreshAccessToken(String refreshTokenStr) {
        // 리프레시 토큰 검증
        RefreshToken refreshToken = refreshTokenService.validateRefreshToken(refreshTokenStr);

        // 새로운 액세스 토큰 생성
        String newAccessToken = jwtTokenProvider.generateAccessToken(refreshToken.getUser().getEmail());

        logger.info("액세스 토큰 갱신 성공: 사용자 {}", refreshToken.getUser().getEmail());

        return newAccessToken;
    }

    /**
     * 로그아웃 처리 - 리프레시 토큰 삭제
     */
    public void logout(User user) {
        refreshTokenService.revokeRefreshToken(user);
        logger.info("로그아웃 완료: 사용자 {}", user.getEmail());
    }

    /**
     * 로그아웃 처리 - 리프레시 토큰 문자열로 삭제
     */
    public void logoutByToken(String refreshToken) {
        refreshTokenService.revokeRefreshToken(refreshToken);
        logger.info("로그아웃 완료: 리프레시 토큰");
    }

    /**
     * 액세스 토큰과 리프레시 토큰을 함께 담는 내부 클래스
     */
    public static class AuthTokens {
        public final String accessToken;
        public final String refreshToken;
        public final long accessTokenExpiresIn;
        public final long refreshTokenExpiresIn;

        public AuthTokens(String accessToken, String refreshToken,
                          long accessTokenExpiresIn, long refreshTokenExpiresIn) {
            this.accessToken = accessToken;
            this.refreshToken = refreshToken;
            this.accessTokenExpiresIn = accessTokenExpiresIn;
            this.refreshTokenExpiresIn = refreshTokenExpiresIn;
        }
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