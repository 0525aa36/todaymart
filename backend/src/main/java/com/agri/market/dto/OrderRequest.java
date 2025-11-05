package com.agri.market.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class OrderRequest {
    @NotBlank(message = "수령인 이름은 필수입니다.")
    private String recipientName;
    @NotBlank(message = "수령인 전화번호는 필수입니다.")
    private String recipientPhone;
    @NotBlank(message = "배송 주소는 필수입니다.")
    private String shippingAddressLine1;
    private String shippingAddressLine2;
    @NotBlank(message = "우편번호는 필수입니다.")
    private String shippingPostcode;
    
    // 송하인 정보 (선택사항, 기본값은 주문자와 동일)
    private String senderName;
    private String senderPhone;
    
    // 배송 메시지
    private String deliveryMessage;

    @NotNull(message = "주문 상품 목록은 필수입니다.")
    private List<OrderItemRequest> items;

    @Getter
    @Setter
    public static class OrderItemRequest {
        @NotNull(message = "상품 ID는 필수입니다.")
        private Long productId;
        @Min(value = 1, message = "수량은 최소 1개 이상이어야 합니다.")
        private Integer quantity;
    }
}