package com.agri.market.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class DashboardStats {
    // 매출 통계
    private BigDecimal totalSales; // 총 매출
    private BigDecimal todaySales; // 오늘 매출
    private BigDecimal monthSales; // 이번 달 매출

    // 주문 통계
    private Long totalOrders; // 총 주문 수
    private Long todayOrders; // 오늘 주문 수
    private Long monthOrders; // 이번 달 주문 수
    private Long pendingOrders; // 대기 중인 주문 수

    // 사용자 통계
    private Long totalUsers; // 총 회원 수
    private Long todayNewUsers; // 오늘 신규 회원 수

    // 상품 통계
    private Long lowStockCount; // 재고 부족 상품 수 (재고 <= 10)

    // 인기 상품 (상품 ID와 판매 수량)
    private List<Map<String, Object>> topProducts;
}
