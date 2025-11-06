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

/**
 * 상품을 찾을 수 없을 때 발생하는 예외
 */
public class ProductNotFoundException extends BusinessException {
    public ProductNotFoundException(Long productId) {
        super("상품을 찾을 수 없습니다: " + productId, "PRODUCT_NOT_FOUND");
    }
}

/**
 * 재고가 부족할 때 발생하는 예외
 */
public class InsufficientStockException extends BusinessException {
    public InsufficientStockException(String productName) {
        super("재고가 부족합니다: " + productName, "INSUFFICIENT_STOCK");
    }
}

/**
 * 사용자를 찾을 수 없을 때 발생하는 예외
 */
public class UserNotFoundException extends BusinessException {
    public UserNotFoundException(String email) {
        super("사용자를 찾을 수 없습니다: " + email, "USER_NOT_FOUND");
    }
}
