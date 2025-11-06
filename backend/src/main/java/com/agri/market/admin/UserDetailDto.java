package com.agri.market.admin;

import com.agri.market.order.Order;
import com.agri.market.user.User;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

/**
 * 사용자 상세 정보 DTO
 */
@Getter
@Setter
public class UserDetailDto {
    private Long id;
    private String name;
    private String email;
    private String phone;
    private String role;
    private boolean enabled;
    private LocalDateTime createdAt;

    // 통계
    private Long orderCount;
    private BigDecimal totalSpent;

    // 주문 이력
    private List<OrderSummary> recentOrders;

    public UserDetailDto(User user, List<Order> orders, Long orderCount, BigDecimal totalSpent) {
        this.id = user.getId();
        this.name = user.getName();
        this.email = user.getEmail();
        this.phone = user.getPhone();
        this.role = user.getRole();
        this.enabled = user.getEnabled();
        this.createdAt = user.getCreatedAt();
        this.orderCount = orderCount;
        this.totalSpent = totalSpent;

        // 최근 10개 주문만 포함
        this.recentOrders = orders.stream()
                .limit(10)
                .map(OrderSummary::new)
                .collect(Collectors.toList());
    }

    @Getter
    @Setter
    public static class OrderSummary {
        private Long id;
        private String orderNumber;
        private BigDecimal totalAmount;
        private String orderStatus;
        private String paymentStatus;
        private LocalDateTime createdAt;

        public OrderSummary(Order order) {
            this.id = order.getId();
            this.orderNumber = order.getOrderNumber();
            this.totalAmount = order.getTotalAmount();
            this.orderStatus = order.getOrderStatus().name();
            this.paymentStatus = order.getPaymentStatus().name();
            this.createdAt = order.getCreatedAt();
        }
    }
}
