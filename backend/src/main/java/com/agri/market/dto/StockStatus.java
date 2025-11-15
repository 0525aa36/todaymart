package com.agri.market.dto;

public enum StockStatus {
    SOLD_OUT,    // 품절 (재고 0)
    LOW_STOCK,   // 품절 임박 (재고가 임계값 이하)
    IN_STOCK     // 재고 충분
}
