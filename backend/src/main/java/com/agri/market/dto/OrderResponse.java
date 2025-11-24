package com.agri.market.dto;

import com.agri.market.order.Order;
import com.agri.market.order.OrderItem;
import com.agri.market.order.OrderStatus;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Getter
@Setter
public class OrderResponse {
    private Long id;
    private String orderNumber;
    private OrderStatus orderStatus;
    private BigDecimal totalAmount;
    private BigDecimal finalAmount;
    private BigDecimal shippingFee;
    private BigDecimal couponDiscountAmount;
    private BigDecimal productDiscountAmount;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // Shipping information
    private String recipientName;
    private String recipientPhone;
    private String shippingAddressLine1;
    private String shippingAddressLine2;
    private String shippingPostcode;

    // Sender information
    private String senderName;
    private String senderPhone;

    // Delivery message
    private String deliveryMessage;

    // Cancellation information
    private String cancellationReason;
    private LocalDateTime cancelledAt;
    private String trackingNumber;
    private String courierCompany;

    // Delivery information
    private LocalDateTime shippedAt;
    private LocalDateTime deliveredAt;
    private LocalDateTime confirmedAt;

    // Order items
    private List<OrderItemResponse> orderItems;

    // User information
    private Long userId;
    private String userEmail;
    private String userName;

    // Coupon information
    private Long couponId;
    private String couponName;

    @Getter
    @Setter
    public static class OrderItemResponse {
        private Long id;
        private Integer quantity;
        private BigDecimal price;

        // Product information
        private Long productId;
        private String productName;
        private String productImageUrl;

        // Product option information
        private Long productOptionId;
        private String productOptionName;
        private String optionValue;

        public static OrderItemResponse from(OrderItem item) {
            OrderItemResponse response = new OrderItemResponse();
            response.setId(item.getId());
            response.setQuantity(item.getQuantity());
            response.setPrice(item.getPrice());

            // Product 정보 - 안전하게 처리
            if (item.getProduct() != null) {
                try {
                    response.setProductId(item.getProduct().getId());
                    response.setProductName(item.getProduct().getName());
                    response.setProductImageUrl(item.getProduct().getImageUrl());
                } catch (Exception e) {
                    // LAZY loading 실패 시 기본값 설정
                    response.setProductId(null);
                    response.setProductName("상품 정보 없음");
                    response.setProductImageUrl("/placeholder.svg");
                }
            } else {
                // Product가 null인 경우 기본값 설정
                response.setProductId(null);
                response.setProductName("상품 정보 없음");
                response.setProductImageUrl("/placeholder.svg");
            }

            if (item.getProductOption() != null) {
                response.setProductOptionId(item.getProductOption().getId());
                response.setProductOptionName(item.getProductOption().getName());
                response.setOptionValue(item.getProductOption().getOptionValue());
            }

            return response;
        }
    }

    public static OrderResponse from(Order order) {
        OrderResponse response = new OrderResponse();
        response.setId(order.getId());
        response.setOrderNumber(order.getOrderNumber());
        response.setOrderStatus(order.getOrderStatus());
        response.setTotalAmount(order.getTotalAmount());
        response.setFinalAmount(order.getFinalAmount());
        response.setShippingFee(order.getShippingFee());
        response.setCouponDiscountAmount(order.getCouponDiscountAmount());
        response.setProductDiscountAmount(order.getProductDiscountAmount());
        response.setCreatedAt(order.getCreatedAt());
        response.setUpdatedAt(order.getUpdatedAt());

        response.setRecipientName(order.getRecipientName());
        response.setRecipientPhone(order.getRecipientPhone());
        response.setShippingAddressLine1(order.getShippingAddressLine1());
        response.setShippingAddressLine2(order.getShippingAddressLine2());
        response.setShippingPostcode(order.getShippingPostcode());

        response.setSenderName(order.getSenderName());
        response.setSenderPhone(order.getSenderPhone());
        response.setDeliveryMessage(order.getDeliveryMessage());

        response.setCancellationReason(order.getCancellationReason());
        response.setCancelledAt(order.getCancelledAt());
        response.setTrackingNumber(order.getTrackingNumber());
        response.setCourierCompany(order.getCourierCompany());

        response.setShippedAt(order.getShippedAt());
        response.setDeliveredAt(order.getDeliveredAt());
        response.setConfirmedAt(order.getConfirmedAt());

        if (order.getUser() != null) {
            response.setUserId(order.getUser().getId());
            response.setUserEmail(order.getUser().getEmail());
            response.setUserName(order.getUser().getName());
        }

        if (order.getAppliedCoupon() != null) {
            response.setCouponId(order.getAppliedCoupon().getId());
            response.setCouponName(order.getAppliedCoupon().getName());
        }

        if (order.getOrderItems() != null) {
            response.setOrderItems(
                order.getOrderItems().stream()
                    .map(OrderItemResponse::from)
                    .collect(Collectors.toList())
            );
        }

        return response;
    }
}
