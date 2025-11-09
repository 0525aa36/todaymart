package com.agri.market.security.oauth2;

import java.util.Map;

/**
 * 카카오 OAuth2 사용자 정보 구현체
 * 카카오 응답 구조: { "id": 123456, "kakao_account": { "email": "...", "profile": { "nickname": "..." } } }
 */
public class KakaoOAuth2UserInfo implements OAuth2UserInfo {

    private final Map<String, Object> attributes;
    private final Map<String, Object> kakaoAccount;
    private final Map<String, Object> profile;

    @SuppressWarnings("unchecked")
    public KakaoOAuth2UserInfo(Map<String, Object> attributes) {
        this.attributes = attributes;
        // 카카오는 사용자 계정 정보를 "kakao_account" 키 아래에 담아서 보냄
        this.kakaoAccount = (Map<String, Object>) attributes.get("kakao_account");
        // 프로필 정보는 kakao_account 안의 "profile"에 있음
        this.profile = kakaoAccount != null ? (Map<String, Object>) kakaoAccount.get("profile") : null;
    }

    @Override
    public String getProviderId() {
        Object id = attributes.get("id");
        return id != null ? id.toString() : null;
    }

    @Override
    public String getProvider() {
        return "KAKAO";
    }

    @Override
    public String getEmail() {
        if (kakaoAccount == null) {
            return null;
        }
        return (String) kakaoAccount.get("email");
    }

    @Override
    public String getName() {
        if (profile == null) {
            return null;
        }
        return (String) profile.get("nickname");
    }

    @Override
    public String getPhoneNumber() {
        // 카카오는 전화번호를 기본 제공하지 않음
        if (kakaoAccount == null) {
            return null;
        }
        return (String) kakaoAccount.get("phone_number");
    }

    @Override
    public String getBirthDate() {
        // 카카오는 생년월일을 기본 제공하지 않음
        if (kakaoAccount == null) {
            return null;
        }
        String birthyear = (String) kakaoAccount.get("birthyear");
        String birthday = (String) kakaoAccount.get("birthday");

        if (birthyear != null && birthday != null) {
            // birthyear: "1990", birthday: "0115" -> "1990-01-15"
            if (birthday.length() == 4) {
                String month = birthday.substring(0, 2);
                String day = birthday.substring(2, 4);
                return birthyear + "-" + month + "-" + day;
            }
        }
        return null;
    }

    @Override
    public String getGender() {
        // 카카오는 성별을 기본 제공하지 않음
        if (kakaoAccount == null) {
            return null;
        }
        String gender = (String) kakaoAccount.get("gender");
        // 카카오는 "male" 또는 "female" 형식으로 반환
        return gender;
    }

    @Override
    public Map<String, Object> getAttributes() {
        return attributes;
    }
}
