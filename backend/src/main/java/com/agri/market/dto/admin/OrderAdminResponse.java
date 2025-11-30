package com.agri.market.dto.admin;

import com.agri.market.order.Order;
import com.agri.market.order.OrderStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

/**
 * 관리자용 주문 응답 DTO
 * 고객 PII는 마스킹 처리됨
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderAdminResponse {

    private Long orderId;
    private String orderNumber;

    // 고객 정보 (마스킹 처리됨)
    private CustomerInfoResponse customer;

    // 주문 항목
    private List<OrderItemAdminResponse> orderItems;

    // 금액 정보
    private BigDecimal totalAmount;
    private BigDecimal couponDiscountAmount;
    private BigDecimal productDiscountAmount;
    private BigDecimal shippingFee;
    private BigDecimal finalAmount;

    // 주문 상태
    private OrderStatus orderStatus;

    // 배송 정보 (마스킹 처리됨)
    private String recipientName; // 마스킹
    private String recipientPhone; // 마스킹
    private String shippingAddressLine1; // 마스킹
    private String shippingAddressLine2;
    private String shippingPostcode; // 마스킹
    private String trackingNumber; // 마스킹 안 함
    private String courierCode; // 택배사 코드 (스마트택배 API용)
    private String courierCompany; // 택배사 이름

    // 보내는 사람 정보 (마스킹 처리됨)
    private String senderName; // 마스킹
    private String senderPhone; // 마스킹

    // 배송 메시지
    private String deliveryMessage;

    // 취소 정보
    private String cancellationReason;
    private LocalDateTime cancelledAt;

    // 날짜 정보
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDateTime shippedAt;
    private LocalDateTime deliveredAt;
    private LocalDateTime confirmedAt;

    /**
     * Order 엔티티로부터 DTO 생성 (마스킹 적용)
     */
    public static OrderAdminResponse from(Order order) {
        return OrderAdminResponse.builder()
                .orderId(order.getId())
                .orderNumber(order.getOrderNumber())
                .customer(CustomerInfoResponse.from(order.getUser()))
                .orderItems(order.getOrderItems().stream()
                        .map(OrderItemAdminResponse::from)
                        .collect(Collectors.toList()))
                .totalAmount(order.getTotalAmount())
                .couponDiscountAmount(order.getCouponDiscountAmount())
                .productDiscountAmount(order.getProductDiscountAmount())
                .shippingFee(order.getShippingFee())
                .finalAmount(order.getFinalAmount())
                .orderStatus(order.getOrderStatus())
                // 배송 정보 마스킹
                .recipientName(MaskingUtils.maskName(order.getRecipientName()))
                .recipientPhone(MaskingUtils.maskPhone(order.getRecipientPhone()))
                .shippingAddressLine1(MaskingUtils.maskAddress(order.getShippingAddressLine1()))
                .shippingAddressLine2(order.getShippingAddressLine2())
                .shippingPostcode(MaskingUtils.maskPostcode(order.getShippingPostcode()))
                .trackingNumber(order.getTrackingNumber()) // 송장번호는 마스킹 안 함
                .courierCode(order.getCourierCode()) // 택배사 코드
                .courierCompany(order.getCourierCompany()) // 택배사 이름
                // 보내는 사람 정보 마스킹
                .senderName(order.getSenderName() != null ? MaskingUtils.maskName(order.getSenderName()) : null)
                .senderPhone(order.getSenderPhone() != null ? MaskingUtils.maskPhone(order.getSenderPhone()) : null)
                .deliveryMessage(order.getDeliveryMessage())
                .cancellationReason(order.getCancellationReason())
                .cancelledAt(order.getCancelledAt())
                .createdAt(order.getCreatedAt())
                .updatedAt(order.getUpdatedAt())
                .shippedAt(order.getShippedAt())
                .deliveredAt(order.getDeliveredAt())
                .confirmedAt(order.getConfirmedAt())
                .build();
    }
}
