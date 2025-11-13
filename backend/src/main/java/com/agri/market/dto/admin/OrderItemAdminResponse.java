package com.agri.market.dto.admin;

import com.agri.market.order.OrderItem;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

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
    private Integer quantity;
    private BigDecimal price; // 주문 당시 가격
    private Long sellerId;
    private String sellerName;

    /**
     * OrderItem 엔티티로부터 DTO 생성
     */
    public static OrderItemAdminResponse from(OrderItem orderItem) {
        return OrderItemAdminResponse.builder()
                .id(orderItem.getId())
                .productId(orderItem.getProduct().getId())
                .productName(orderItem.getProduct().getName())
                .quantity(orderItem.getQuantity())
                .price(orderItem.getPrice())
                .sellerId(orderItem.getProduct().getSeller() != null ? orderItem.getProduct().getSeller().getId() : null)
                .sellerName(orderItem.getProduct().getSeller() != null ? orderItem.getProduct().getSeller().getName() : null)
                .build();
    }
}
