package com.agri.market.dto.admin;

import com.agri.market.order.OrderItem;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 관리자용 주문 항목 응답 DTO
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderItemAdminResponse {

    private Long id;
    private Long productId;
    private String productName;
    private String optionName; // 상품 옵션명
    private Integer quantity;
    private BigDecimal price; // 주문 당시 가격
    private Long sellerId;
    private String sellerName;

    // 송장 정보
    private String trackingNumber;
    private String courierCompany;
    private String courierCode;
    private LocalDateTime shippedAt;

    // 상품 기본 택배사 (송장 등록 시 기본값으로 사용)
    private String productCourierCompany;
    private String productCourierCode;

    /**
     * OrderItem 엔티티로부터 DTO 생성
     */
    public static OrderItemAdminResponse from(OrderItem orderItem) {
        return OrderItemAdminResponse.builder()
                .id(orderItem.getId())
                .productId(orderItem.getProduct().getId())
                .productName(orderItem.getProduct().getName())
                .optionName(orderItem.getProductOption() != null ? orderItem.getProductOption().getOptionName() : null)
                .quantity(orderItem.getQuantity())
                .price(orderItem.getPrice())
                .sellerId(orderItem.getProduct().getSeller() != null ? orderItem.getProduct().getSeller().getId() : null)
                .sellerName(orderItem.getProduct().getSeller() != null ? orderItem.getProduct().getSeller().getName() : null)
                // 송장 정보
                .trackingNumber(orderItem.getTrackingNumber())
                .courierCompany(orderItem.getCourierCompany())
                .courierCode(orderItem.getCourierCode())
                .shippedAt(orderItem.getShippedAt())
                // 상품 기본 택배사
                .productCourierCompany(orderItem.getProduct().getCourierCompany())
                .productCourierCode(orderItem.getProduct().getCourierCode())
                .build();
    }
}
