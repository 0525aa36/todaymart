package com.agri.market.exception;

public class BusinessException extends RuntimeException {
    private final String errorCode;

    public BusinessException(String message) {
        super(message);
        this.errorCode = "BUSINESS_ERROR";
    }

    public BusinessException(String message, String errorCode) {
        super(message);
        this.errorCode = errorCode;
    }

    public String getErrorCode() {
        return errorCode;
    }
}

class ProductNotFoundException extends BusinessException {
    public ProductNotFoundException(Long productId) {
        super("상품을 찾을 수 없습니다: " + productId, "PRODUCT_NOT_FOUND");
    }
}

class InsufficientStockException extends BusinessException {
    public InsufficientStockException(String productName) {
        super("재고가 부족합니다: " + productName, "INSUFFICIENT_STOCK");
    }
}

class UserNotFoundException extends BusinessException {
    public UserNotFoundException(String email) {
        super("사용자를 찾을 수 없습니다: " + email, "USER_NOT_FOUND");
    }
}
