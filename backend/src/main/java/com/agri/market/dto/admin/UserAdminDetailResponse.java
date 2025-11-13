package com.agri.market.dto.admin;

import com.agri.market.user.User;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * 관리자용 사용자 상세 응답 DTO
 * 목록 조회보다 더 많은 정보를 포함하지만, 여전히 일부 PII는 마스킹 처리됨
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserAdminDetailResponse {

    private Long id;
    private String email;
    private String name; // 마스킹: "김철수" -> "김**"
    private String phone; // 부분 마스킹
    private String addressLine1; // 부분 마스킹
    private String addressLine2;
    private String postcode; // 부분 마스킹: "12345" -> "123**"
    private LocalDate birthDate;
    private String gender;
    private String role;
    private Boolean enabled;
    private String provider;
    private Boolean marketingConsent;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDateTime lastLoginAt; // 추후 User 엔티티에 추가 예정

    /**
     * User 엔티티로부터 DTO 생성 (부분 마스킹 적용)
     */
    public static UserAdminDetailResponse from(User user) {
        return UserAdminDetailResponse.builder()
                .id(user.getId())
                .email(user.getEmail())
                .name(MaskingUtils.maskName(user.getName()))
                .phone(MaskingUtils.maskPhone(user.getPhone()))
                .addressLine1(MaskingUtils.maskAddress(user.getAddressLine1()))
                .addressLine2(user.getAddressLine2()) // 상세 주소는 마스킹 안 함
                .postcode(MaskingUtils.maskPostcode(user.getPostcode()))
                .birthDate(user.getBirthDate())
                .gender(user.getGender())
                .role(user.getRole())
                .enabled(user.getEnabled())
                .provider(user.getProvider())
                .marketingConsent(user.getMarketingConsent())
                .createdAt(user.getCreatedAt())
                .updatedAt(user.getUpdatedAt())
                // .lastLoginAt(user.getLastLoginAt()) // 추후 User 엔티티에 필드 추가 후 활성화
                .build();
    }

    /**
     * passwordHash와 providerId는 상세 조회에서도 절대 노출하지 않음
     */
}
