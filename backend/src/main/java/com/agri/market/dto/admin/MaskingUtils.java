package com.agri.market.dto.admin;

/**
 * PII 데이터 마스킹 유틸리티
 */
public class MaskingUtils {

    /**
     * 이름 마스킹: "김철수" -> "김**"
     */
    public static String maskName(String name) {
        if (name == null || name.length() < 2) {
            return "**";
        }
        return name.charAt(0) + "*".repeat(name.length() - 1);
    }

    /**
     * 전화번호 마스킹: "010-1234-5678" -> "010-****-5678"
     */
    public static String maskPhone(String phone) {
        if (phone == null || phone.length() < 4) {
            return "****";
        }

        // 하이픈 포함 여부 확인
        if (phone.contains("-")) {
            String[] parts = phone.split("-");
            if (parts.length == 3) {
                return parts[0] + "-****-" + parts[2];
            }
        }

        // 하이픈 없는 경우: "01012345678" -> "010****5678"
        if (phone.length() >= 8) {
            return phone.substring(0, 3) + "****" + phone.substring(phone.length() - 4);
        }

        return "****";
    }

    /**
     * 이메일 마스킹: "user@example.com" -> "us**@example.com"
     */
    public static String maskEmail(String email) {
        if (email == null || !email.contains("@")) {
            return "****@****.com";
        }

        String[] parts = email.split("@");
        String username = parts[0];
        String domain = parts[1];

        if (username.length() <= 2) {
            return "*".repeat(username.length()) + "@" + domain;
        }

        return username.substring(0, 2) + "*".repeat(username.length() - 2) + "@" + domain;
    }

    /**
     * 주소 마스킹: "서울시 강남구 테헤란로 123" -> "서울시 강남구 ******"
     */
    public static String maskAddress(String address) {
        if (address == null || address.length() < 10) {
            return "******";
        }

        // 시/도와 구/군까지만 표시
        String[] parts = address.split(" ");
        if (parts.length >= 2) {
            return parts[0] + " " + parts[1] + " ******";
        }

        return address.substring(0, Math.min(6, address.length())) + "******";
    }

    /**
     * 우편번호 부분 마스킹: "12345" -> "123**"
     */
    public static String maskPostcode(String postcode) {
        if (postcode == null || postcode.length() < 3) {
            return "***";
        }
        return postcode.substring(0, 3) + "*".repeat(postcode.length() - 3);
    }

    /**
     * 카드번호 마스킹: "1234-5678-9012-3456" -> "1234-****-****-3456"
     */
    public static String maskCardNumber(String cardNumber) {
        if (cardNumber == null || cardNumber.length() < 4) {
            return "****-****-****-****";
        }

        if (cardNumber.contains("-")) {
            String[] parts = cardNumber.split("-");
            if (parts.length == 4) {
                return parts[0] + "-****-****-" + parts[3];
            }
        }

        // 하이픈 없는 경우
        if (cardNumber.length() >= 8) {
            return cardNumber.substring(0, 4) + "****" + "****" + cardNumber.substring(cardNumber.length() - 4);
        }

        return "****-****-****-****";
    }
}
