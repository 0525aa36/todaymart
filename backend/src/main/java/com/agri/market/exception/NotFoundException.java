package com.agri.market.exception;

public class NotFoundException extends BusinessException {
    public NotFoundException(String message) {
        super(message, "NOT_FOUND");
    }
}
