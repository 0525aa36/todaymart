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
    public Map<String, Object> getAttributes() {
        return attributes;
    }
}
