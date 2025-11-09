package com.agri.market.security.oauth2;

import java.util.Map;

/**
 * 네이버 OAuth2 사용자 정보 구현체
 * 네이버 응답 구조: { "resultcode": "00", "message": "success", "response": { "id": "...", "email": "...", "name": "..." } }
 */
public class NaverOAuth2UserInfo implements OAuth2UserInfo {

    private final Map<String, Object> attributes;
    private final Map<String, Object> responseAttributes;

    @SuppressWarnings("unchecked")
    public NaverOAuth2UserInfo(Map<String, Object> attributes) {
        this.attributes = attributes;
        // 네이버는 사용자 정보를 "response" 키 아래에 담아서 보냄
        this.responseAttributes = (Map<String, Object>) attributes.get("response");
    }

    @Override
    public String getProviderId() {
        if (responseAttributes == null) {
            return null;
        }
        return (String) responseAttributes.get("id");
    }

    @Override
    public String getProvider() {
        return "NAVER";
    }

    @Override
    public String getEmail() {
        if (responseAttributes == null) {
            return null;
        }
        return (String) responseAttributes.get("email");
    }

    @Override
    public String getName() {
        if (responseAttributes == null) {
            return null;
        }
        return (String) responseAttributes.get("name");
    }

    @Override
    public String getPhoneNumber() {
        if (responseAttributes == null) {
            return null;
        }
        return (String) responseAttributes.get("mobile");
    }

    @Override
    public String getBirthDate() {
        if (responseAttributes == null) {
            return null;
        }
        String birthyear = (String) responseAttributes.get("birthyear");
        String birthday = (String) responseAttributes.get("birthday");

        if (birthyear != null && birthday != null) {
            // birthyear: "1990", birthday: "01-15" -> "1990-01-15"
            return birthyear + "-" + birthday;
        }
        return null;
    }

    @Override
    public String getGender() {
        if (responseAttributes == null) {
            return null;
        }
        String gender = (String) responseAttributes.get("gender");
        // 네이버는 "M" 또는 "F" 형식으로 반환
        if ("M".equals(gender)) {
            return "male";
        } else if ("F".equals(gender)) {
            return "female";
        }
        return null;
    }

    @Override
    public Map<String, Object> getAttributes() {
        return attributes;
    }
}
