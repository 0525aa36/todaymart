package com.agri.market.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class DashboardStats {
    // 매출 통계
    private BigDecimal totalSales; // 총 매출
    private BigDecimal todaySales; // 오늘 매출
    private BigDecimal monthSales; // 이번 달 매출
    private Double salesGrowthRate; // 전월 대비 매출 증감률 (%)

    // 주문 통계
    private Long totalOrders; // 총 주문 수
    private Long todayOrders; // 오늘 주문 수
    private Long monthOrders; // 이번 달 주문 수
    private Long pendingOrders; // 대기 중인 주문 수
    private Double ordersGrowthRate; // 전월 대비 주문 증감률 (%)

    // 사용자 통계
    private Long totalUsers; // 총 회원 수
    private Long todayNewUsers; // 오늘 신규 회원 수
    private Double usersGrowthRate; // 전월 대비 신규 회원 증감률 (%)

    // 상품 통계
    private Long lowStockCount; // 재고 부족 상품 수 (재고 <= 10)

    // 인기 상품
    private List<TopProductDTO> topProducts;
}
