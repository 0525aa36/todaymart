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
    public Map<String, Object> getAttributes() {
        return attributes;
    }
}
