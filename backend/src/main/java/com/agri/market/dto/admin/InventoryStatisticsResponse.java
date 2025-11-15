package com.agri.market.dto.admin;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class InventoryStatisticsResponse {
    // Product statistics
    private Long totalProducts;
    private Long soldOutProducts;
    private Long lowStockProducts;
    private Long inStockProducts;
    private BigDecimal totalProductStockValue;

    // ProductOption statistics
    private Long totalOptions;
    private Long soldOutOptions;
    private Long lowStockOptions;
    private Long inStockOptions;
    private BigDecimal totalOptionStockValue;

    // Combined statistics
    private Long totalItems; // products + options
    private Long totalSoldOut; // sold out products + options
    private Long totalLowStock; // low stock products + options
    private Long totalInStock; // in stock products + options
    private BigDecimal totalStockValue; // total value of all inventory
}
