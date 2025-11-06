package com.agri.market.admin;

import com.agri.market.dto.DashboardStats;
import com.agri.market.order.OrderRepository;
import com.agri.market.order.OrderStatus;
import com.agri.market.order.PaymentStatus;
import com.agri.market.product.ProductService;
import com.agri.market.user.UserRepository;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class DashboardService {

    private final OrderRepository orderRepository;
    private final UserRepository userRepository;
    private final ProductService productService;

    public DashboardService(OrderRepository orderRepository, UserRepository userRepository, ProductService productService) {
        this.orderRepository = orderRepository;
        this.userRepository = userRepository;
        this.productService = productService;
    }

    public DashboardStats getDashboardStats() {
        DashboardStats stats = new DashboardStats();

        // 날짜 범위 설정
        LocalDateTime todayStart = LocalDateTime.of(LocalDate.now(), LocalTime.MIN);
        LocalDateTime todayEnd = LocalDateTime.of(LocalDate.now(), LocalTime.MAX);
        LocalDateTime monthStart = LocalDateTime.of(LocalDate.now().withDayOfMonth(1), LocalTime.MIN);
        LocalDateTime monthEnd = LocalDateTime.now();

        // 매출 통계 (결제 완료된 주문만)
        stats.setTotalSales(safeSum(orderRepository.sumTotalAmountByPaymentStatus(PaymentStatus.PAID)));
        stats.setTodaySales(safeSum(orderRepository
                .sumTotalAmountByPaymentStatusAndCreatedAtBetween(PaymentStatus.PAID, todayStart, todayEnd)));
        stats.setMonthSales(safeSum(orderRepository
                .sumTotalAmountByPaymentStatusAndCreatedAtBetween(PaymentStatus.PAID, monthStart, monthEnd)));

        // 주문 통계
        stats.setTotalOrders(orderRepository.count());
        stats.setTodayOrders(orderRepository.countByCreatedAtBetween(todayStart, todayEnd));
        stats.setMonthOrders(orderRepository.countByCreatedAtBetween(monthStart, monthEnd));
        stats.setPendingOrders(orderRepository.countByOrderStatus(OrderStatus.PENDING));

        // 사용자 통계
        stats.setTotalUsers(userRepository.count());
        stats.setTodayNewUsers(userRepository.countByCreatedAtBetween(todayStart, todayEnd));

        // 상품 통계
        stats.setLowStockCount(productService.countLowStockProducts(10));

        // 인기 상품 Top 5 (Mock 데이터 - 실제로는 OrderItem을 집계해야 함)
        List<Map<String, Object>> topProducts = new ArrayList<>();
        // 실제 구현 시에는 OrderItem 집계 필요
        stats.setTopProducts(topProducts);

        return stats;
    }

    private BigDecimal safeSum(BigDecimal value) {
        return value != null ? value : BigDecimal.ZERO;
    }
}
