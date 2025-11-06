package com.agri.market.exception;

/**
 * 사용자를 찾을 수 없을 때 발생하는 예외
 */
public class UserNotFoundException extends BusinessException {
    public UserNotFoundException(String email) {
        super("사용자를 찾을 수 없습니다: " + email, "USER_NOT_FOUND");
    }
}
