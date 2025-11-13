package com.agri.market.dto.admin;

import com.agri.market.user.User;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * 관리자용 사용자 목록 응답 DTO
 * PII 필드는 마스킹 처리됨
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserAdminResponse {

    private Long id;
    private String email;
    private String name; // 마스킹: "김철수" -> "김**"
    private String phone; // 마스킹: "010-1234-5678" -> "010-****-5678"
    private String role;
    private Boolean enabled;
    private String provider; // LOCAL, NAVER, KAKAO
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    /**
     * User 엔티티로부터 DTO 생성 (마스킹 적용)
     */
    public static UserAdminResponse from(User user) {
        return UserAdminResponse.builder()
                .id(user.getId())
                .email(user.getEmail())
                .name(MaskingUtils.maskName(user.getName()))
                .phone(MaskingUtils.maskPhone(user.getPhone()))
                .role(user.getRole())
                .enabled(user.getEnabled())
                .provider(user.getProvider())
                .createdAt(user.getCreatedAt())
                .updatedAt(user.getUpdatedAt())
                .build();
    }

    /**
     * passwordHash와 providerId는 절대 노출하지 않음
     * addressLine1, addressLine2, postcode는 목록 조회에서 제외
     * birthDate, gender는 목록 조회에서 제외
     * marketingConsent는 목록 조회에서 제외 (상세 조회에서만 표시)
     */
}
