package com.agri.market.dto.admin;

import com.agri.market.user.User;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * 관리자용 고객 정보 DTO (마스킹 처리됨)
 * 주문 조회 시 고객 정보를 안전하게 표시하기 위한 DTO
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CustomerInfoResponse {

    private Long userId;
    private String email;
    private String name; // 마스킹: "김철수" -> "김**"
    private String phone; // 마스킹: "010-1234-5678" -> "010-****-5678"

    /**
     * User 엔티티로부터 DTO 생성 (마스킹 적용)
     */
    public static CustomerInfoResponse from(User user) {
        return CustomerInfoResponse.builder()
                .userId(user.getId())
                .email(user.getEmail())
                .name(MaskingUtils.maskName(user.getName()))
                .phone(MaskingUtils.maskPhone(user.getPhone()))
                .build();
    }
}
