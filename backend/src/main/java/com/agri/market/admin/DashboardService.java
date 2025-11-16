package com.agri.market.admin;

import com.agri.market.dto.DashboardStats;
import com.agri.market.dto.TopProductDTO;
import com.agri.market.order.OrderItemRepository;
import com.agri.market.order.OrderRepository;
import com.agri.market.order.OrderStatus;
import com.agri.market.product.ProductService;
import com.agri.market.user.UserRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

@Service
public class DashboardService {

    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final UserRepository userRepository;
    private final ProductService productService;

    public DashboardService(OrderRepository orderRepository, OrderItemRepository orderItemRepository,
                            UserRepository userRepository, ProductService productService) {
        this.orderRepository = orderRepository;
        this.orderItemRepository = orderItemRepository;
        this.userRepository = userRepository;
        this.productService = productService;
    }

    public DashboardStats getDashboardStats() {
        DashboardStats stats = new DashboardStats();

        // 날짜 범위 설정
        LocalDateTime todayStart = LocalDateTime.of(LocalDate.now(), LocalTime.MIN);
        LocalDateTime todayEnd = LocalDateTime.of(LocalDate.now(), LocalTime.MAX);

        LocalDate now = LocalDate.now();
        LocalDateTime monthStart = LocalDateTime.of(now.withDayOfMonth(1), LocalTime.MIN);
        LocalDateTime monthEnd = LocalDateTime.now();

        // 전월 범위
        LocalDate lastMonth = now.minusMonths(1);
        LocalDateTime lastMonthStart = LocalDateTime.of(lastMonth.withDayOfMonth(1), LocalTime.MIN);
        LocalDateTime lastMonthEnd = LocalDateTime.of(lastMonth.withDayOfMonth(lastMonth.lengthOfMonth()), LocalTime.MAX);

        // 매출 통계 (결제 완료된 주문만)
        stats.setTotalSales(safeSum(orderRepository.sumTotalAmountByOrderStatus(OrderStatus.PAID)));
        stats.setTodaySales(safeSum(orderRepository
                .sumTotalAmountByOrderStatusAndCreatedAtBetween(OrderStatus.PAID, todayStart, todayEnd)));

        BigDecimal currentMonthSales = safeSum(orderRepository
                .sumTotalAmountByOrderStatusAndCreatedAtBetween(OrderStatus.PAID, monthStart, monthEnd));
        stats.setMonthSales(currentMonthSales);

        // 전월 매출
        BigDecimal lastMonthSales = safeSum(orderRepository
                .sumTotalAmountByOrderStatusAndCreatedAtBetween(OrderStatus.PAID, lastMonthStart, lastMonthEnd));
        stats.setSalesGrowthRate(calculateGrowthRate(currentMonthSales, lastMonthSales));

        // 주문 통계
        stats.setTotalOrders(orderRepository.count());
        stats.setTodayOrders(orderRepository.countByCreatedAtBetween(todayStart, todayEnd));

        Long currentMonthOrders = orderRepository.countByCreatedAtBetween(monthStart, monthEnd);
        stats.setMonthOrders(currentMonthOrders);
        stats.setPendingOrders(orderRepository.countByOrderStatus(OrderStatus.PENDING_PAYMENT));

        // 전월 주문 수
        Long lastMonthOrders = orderRepository.countByCreatedAtBetween(lastMonthStart, lastMonthEnd);
        stats.setOrdersGrowthRate(calculateGrowthRate(currentMonthOrders, lastMonthOrders));

        // 사용자 통계
        stats.setTotalUsers(userRepository.count());

        Long currentMonthNewUsers = userRepository.countByCreatedAtBetween(monthStart, monthEnd);
        stats.setTodayNewUsers(userRepository.countByCreatedAtBetween(todayStart, todayEnd));

        // 전월 신규 회원 수
        Long lastMonthNewUsers = userRepository.countByCreatedAtBetween(lastMonthStart, lastMonthEnd);
        stats.setUsersGrowthRate(calculateGrowthRate(currentMonthNewUsers, lastMonthNewUsers));

        // 상품 통계
        stats.setLowStockCount(productService.countLowStockProducts(10));

        // 인기 상품 Top 5 (실제 데이터)
        List<TopProductDTO> topProducts = orderItemRepository.findTopProducts(
                monthStart,
                PageRequest.of(0, 5)
        );
        stats.setTopProducts(topProducts);

        return stats;
    }

    private Double calculateGrowthRate(Number current, Number previous) {
        if (previous == null || previous.doubleValue() == 0) {
            return current != null && current.doubleValue() > 0 ? 100.0 : 0.0;
        }
        if (current == null) {
            return -100.0;
        }

        double currentVal = current.doubleValue();
        double previousVal = previous.doubleValue();
        double growth = ((currentVal - previousVal) / previousVal) * 100;

        return BigDecimal.valueOf(growth)
                .setScale(1, RoundingMode.HALF_UP)
                .doubleValue();
    }

    private BigDecimal safeSum(BigDecimal value) {
        return value != null ? value : BigDecimal.ZERO;
    }
}
