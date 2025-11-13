package com.agri.market.exception;

import com.agri.market.dto.ApiResponse;
import io.github.resilience4j.ratelimiter.RequestNotPermitted;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import jakarta.persistence.EntityNotFoundException;
import java.util.HashMap;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger logger = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(EntityNotFoundException.class)
    public ResponseEntity<ApiResponse<Void>> handleEntityNotFound(EntityNotFoundException e) {
        logger.warn("Entity not found: {}", e.getMessage());
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(ApiResponse.error(e.getMessage(), "ENTITY_NOT_FOUND"));
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ApiResponse<Void>> handleIllegalArgument(IllegalArgumentException e) {
        logger.warn("Illegal argument: {}", e.getMessage());
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.error(e.getMessage(), "INVALID_ARGUMENT"));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<Map<String, String>>> handleValidationErrors(MethodArgumentNotValidException e) {
        Map<String, String> errors = new HashMap<>();
        e.getBindingResult().getAllErrors().forEach((error) -> {
            String fieldName = ((FieldError) error).getField();
            String errorMessage = error.getDefaultMessage();
            errors.put(fieldName, errorMessage);
        });
        
        logger.warn("Validation errors: {}", errors);
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.error("입력값이 올바르지 않습니다", "VALIDATION_ERROR"));
    }

    @ExceptionHandler(AuthenticationException.class)
    public ResponseEntity<ApiResponse<Void>> handleAuthentication(AuthenticationException e) {
        logger.warn("Authentication error: {}", e.getMessage());

        // 로그인 실패 시 더 명확한 메시지 제공
        String message = "이메일 또는 비밀번호가 일치하지 않습니다";
        if (e.getMessage() != null && !e.getMessage().contains("Bad credentials")) {
            message = e.getMessage();
        }

        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(ApiResponse.error(message, "AUTHENTICATION_FAILED"));
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ApiResponse<Void>> handleAccessDenied(AccessDeniedException e) {
        logger.warn("Access denied: {}", e.getMessage());
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(ApiResponse.error("접근 권한이 없습니다", "ACCESS_DENIED"));
    }

    @ExceptionHandler(BusinessException.class)
    public ResponseEntity<ApiResponse<Void>> handleBusinessException(BusinessException e) {
        logger.warn("Business exception: {} (code: {})", e.getMessage(), e.getErrorCode());
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.error(e.getMessage(), e.getErrorCode()));
    }

    @ExceptionHandler(UnauthorizedException.class)
    public ResponseEntity<ApiResponse<Void>> handleUnauthorizedException(UnauthorizedException e) {
        logger.warn("Unauthorized: {}", e.getMessage());
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(ApiResponse.error(e.getMessage(), "UNAUTHORIZED"));
    }

    @ExceptionHandler(ForbiddenException.class)
    public ResponseEntity<ApiResponse<Void>> handleForbiddenException(ForbiddenException e) {
        logger.warn("Forbidden: {}", e.getMessage());
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(ApiResponse.error(e.getMessage(), "FORBIDDEN"));
    }

    @ExceptionHandler(RequestNotPermitted.class)
    public ResponseEntity<ApiResponse<Void>> handleRateLimitExceeded(RequestNotPermitted e) {
        logger.warn("Rate limit exceeded: {}", e.getMessage());
        return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                .body(ApiResponse.error("너무 많은 요청이 발생했습니다. 잠시 후 다시 시도해주세요.", "RATE_LIMIT_EXCEEDED"));
    }

    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<ApiResponse<Void>> handleRuntimeException(RuntimeException e) {
        logger.error("Runtime exception: ", e);
        // Return the actual exception message for better error feedback
        String errorMessage = e.getMessage() != null ? e.getMessage() : "서버 오류가 발생했습니다";
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.error(errorMessage, "INTERNAL_SERVER_ERROR"));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Void>> handleGenericException(Exception e) {
        logger.error("Unexpected exception: ", e);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.error("예상치 못한 오류가 발생했습니다", "UNEXPECTED_ERROR"));
    }
}
