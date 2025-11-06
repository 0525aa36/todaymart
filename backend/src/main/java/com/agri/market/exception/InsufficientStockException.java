package com.agri.market.exception;

/**
 * 재고가 부족할 때 발생하는 예외
 */
public class InsufficientStockException extends BusinessException {
    public InsufficientStockException(String productName) {
        super("재고가 부족합니다: " + productName, "INSUFFICIENT_STOCK");
    }
}
