package com.agri.market.exception;

public class BadRequestException extends BusinessException {
    public BadRequestException(String message) {
        super(message, "BAD_REQUEST");
    }
}
