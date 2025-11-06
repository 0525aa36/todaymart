package com.agri.market.exception;

/**
 * 상품을 찾을 수 없을 때 발생하는 예외
 */
public class ProductNotFoundException extends BusinessException {
    public ProductNotFoundException(Long productId) {
        super("상품을 찾을 수 없습니다: " + productId, "PRODUCT_NOT_FOUND");
    }
}
