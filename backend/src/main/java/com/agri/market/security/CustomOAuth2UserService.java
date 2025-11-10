package com.agri.market.security;

import com.agri.market.coupon.Coupon;
import com.agri.market.coupon.CouponRepository;
import com.agri.market.coupon.UserCoupon;
import com.agri.market.coupon.UserCouponRepository;
import com.agri.market.security.oauth2.KakaoOAuth2UserInfo;
import com.agri.market.security.oauth2.NaverOAuth2UserInfo;
import com.agri.market.security.oauth2.OAuth2UserInfo;
import com.agri.market.user.User;
import com.agri.market.user.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;
import java.util.UUID;

/**
 * OAuth2 로그인 시 사용자 정보를 처리하는 서비스
 */
@Service
public class CustomOAuth2UserService extends DefaultOAuth2UserService {

    /**
     * 전화번호를 하이픈 포함 형식으로 변환 (010-1234-5678)
     */
    private String formatPhoneNumber(String phone) {
        if (phone == null || phone.isEmpty()) {
            return phone;
        }

        // 숫자만 추출
        String numbers = phone.replaceAll("[^0-9]", "");

        // 11자리 휴대폰 번호 포맷팅
        if (numbers.length() == 11) {
            return numbers.substring(0, 3) + "-" + numbers.substring(3, 7) + "-" + numbers.substring(7);
        }
        // 10자리 전화번호 포맷팅
        else if (numbers.length() == 10) {
            return numbers.substring(0, 3) + "-" + numbers.substring(3, 6) + "-" + numbers.substring(6);
        }

        // 포맷팅할 수 없으면 원본 반환
        return phone;
    }

    private static final Logger logger = LoggerFactory.getLogger(CustomOAuth2UserService.class);

    private final UserRepository userRepository;
    private final CouponRepository couponRepository;
    private final UserCouponRepository userCouponRepository;

    @Value("${coupon.welcome.code:WELCOME}")
    private String welcomeCouponCode;

    public CustomOAuth2UserService(UserRepository userRepository,
                                   CouponRepository couponRepository,
                                   UserCouponRepository userCouponRepository) {
        this.userRepository = userRepository;
        this.couponRepository = couponRepository;
        this.userCouponRepository = userCouponRepository;
    }

    @Override
    @Transactional
    public OAuth2User loadUser(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {
        OAuth2User oauth2User = super.loadUser(userRequest);

        String registrationId = userRequest.getClientRegistration().getRegistrationId();
        OAuth2UserInfo oauth2UserInfo = getOAuth2UserInfo(registrationId, oauth2User.getAttributes());

        if (oauth2UserInfo == null) {
            throw new OAuth2AuthenticationException("지원하지 않는 OAuth2 제공자입니다: " + registrationId);
        }

        String provider = oauth2UserInfo.getProvider();
        String providerId = oauth2UserInfo.getProviderId();
        String email = oauth2UserInfo.getEmail();
        String name = oauth2UserInfo.getName();
        String phoneNumber = oauth2UserInfo.getPhoneNumber();
        String birthDateStr = oauth2UserInfo.getBirthDate();
        String gender = oauth2UserInfo.getGender();

        if (email == null || email.isEmpty()) {
            // 이메일이 없는 경우 provider와 providerId로 고유한 이메일 생성
            email = provider.toLowerCase() + "_" + providerId + "@oauth2.local";
        }

        // 기존 사용자 조회 (provider + providerId로 먼저 확인)
        Optional<User> existingUser = userRepository.findByProviderAndProviderId(provider, providerId);

        User user;
        if (existingUser.isPresent()) {
            // 기존 소셜 로그인 사용자 업데이트
            user = existingUser.get();
            user.setName(name);
            user.setEmail(email);

            // 전화번호, 생년월일, 성별 업데이트
            if (phoneNumber != null && !phoneNumber.isEmpty()) {
                user.setPhone(formatPhoneNumber(phoneNumber));
            }
            if (birthDateStr != null && !birthDateStr.isEmpty()) {
                try {
                    user.setBirthDate(java.time.LocalDate.parse(birthDateStr));
                } catch (Exception e) {
                    logger.warn("생년월일 파싱 실패: {}", birthDateStr);
                }
            }
            if (gender != null && !gender.isEmpty()) {
                user.setGender(gender);
            }

            user = userRepository.save(user);
            logger.info("기존 OAuth2 사용자 업데이트: {} ({})", email, provider);
        } else {
            // 같은 이메일로 일반 회원가입한 계정이 있는지 확인
            Optional<User> existingEmailUser = userRepository.findByEmail(email);
            if (existingEmailUser.isPresent() && "LOCAL".equals(existingEmailUser.get().getProvider())) {
                // 일반 회원가입 계정을 소셜 로그인 계정으로 전환
                user = existingEmailUser.get();
                user.setProvider(provider);
                user.setProviderId(providerId);
                user.setName(name);
                user = userRepository.save(user);
                logger.info("일반 회원 계정을 OAuth2 계정으로 전환: {} ({})", email, provider);
                return new CustomOAuth2User(user, oauth2User.getAttributes());
            }
            // 신규 사용자 생성
            user = new User();
            user.setEmail(email);
            user.setName(name);
            user.setProvider(provider);
            user.setProviderId(providerId);
            user.setPasswordHash(UUID.randomUUID().toString()); // 소셜 로그인 사용자는 랜덤 비밀번호
            user.setRole("USER");
            user.setEnabled(true);

            // OAuth2에서 가져온 정보 설정
            if (phoneNumber != null && !phoneNumber.isEmpty()) {
                user.setPhone(formatPhoneNumber(phoneNumber));
            } else {
                user.setPhone("010-0000-0000"); // 기본값
            }

            if (birthDateStr != null && !birthDateStr.isEmpty()) {
                try {
                    user.setBirthDate(java.time.LocalDate.parse(birthDateStr));
                } catch (Exception e) {
                    logger.warn("생년월일 파싱 실패: {}, null로 설정 (나중에 입력 가능)", birthDateStr);
                    user.setBirthDate(null);
                }
            } else {
                // 카카오는 birthyear를 제공하지 않을 수 있으므로 null 허용
                logger.info("생년월일 정보 없음, 나중에 계정 설정에서 입력 가능");
                user.setBirthDate(null);
            }

            if (gender != null && !gender.isEmpty()) {
                user.setGender(gender);
            }

            // 주소는 나중에 입력받도록 기본값 설정
            user.setAddressLine1("주소 미입력");
            user.setPostcode("00000");

            logger.info("신규 OAuth2 사용자 생성: {} ({})", email, provider);

            // User를 먼저 저장
            user = userRepository.save(user);

            // 저장된 User로 웰컴 쿠폰 발급
            issueWelcomeCoupon(user);
        }

        return new CustomOAuth2User(user, oauth2User.getAttributes());
    }

    /**
     * OAuth2 제공자별 사용자 정보 추출
     */
    private OAuth2UserInfo getOAuth2UserInfo(String registrationId, java.util.Map<String, Object> attributes) {
        if ("naver".equalsIgnoreCase(registrationId)) {
            return new NaverOAuth2UserInfo(attributes);
        } else if ("kakao".equalsIgnoreCase(registrationId)) {
            return new KakaoOAuth2UserInfo(attributes);
        }
        return null;
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

            if (!welcomeCoupon.isValid()) {
                logger.warn("웰컴 쿠폰(code: {})이 유효하지 않아 발급할 수 없습니다.", welcomeCouponCode);
                return;
            }

            UserCoupon userCoupon = new UserCoupon();
            userCoupon.setUser(user);
            userCoupon.setCoupon(welcomeCoupon);
            userCoupon.setExpiresAt(welcomeCoupon.getEndDate());

            userCouponRepository.save(userCoupon);
            logger.info("사용자 {}({})에게 웰컴 쿠폰(code: {})을 발급했습니다.",
                    user.getName(), user.getEmail(), welcomeCouponCode);

        } catch (Exception e) {
            logger.error("웰컴 쿠폰 발급 중 오류 발생 (사용자: {}): {}", user.getEmail(), e.getMessage(), e);
        }
    }
}
