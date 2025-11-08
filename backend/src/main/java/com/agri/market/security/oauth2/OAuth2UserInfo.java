package com.agri.market.security.oauth2;

import java.util.Map;

/**
 * OAuth2 제공자별 사용자 정보를 표준화하는 인터페이스
 */
public interface OAuth2UserInfo {
    /**
     * OAuth2 제공자의 고유 사용자 ID
     */
    String getProviderId();

    /**
     * OAuth2 제공자 (NAVER, KAKAO 등)
     */
    String getProvider();

    /**
     * 사용자 이메일
     */
    String getEmail();

    /**
     * 사용자 이름
     */
    String getName();

    /**
     * 전체 사용자 정보 속성
     */
    Map<String, Object> getAttributes();
}
