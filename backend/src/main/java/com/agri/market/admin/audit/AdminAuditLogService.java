package com.agri.market.admin.audit;

import com.agri.market.user.User;
import com.agri.market.user.UserRepository;
import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.time.LocalDateTime;

/**
 * 관리자 감사 로그 서비스
 * 모든 관리자 작업을 자동으로 기록하고 추적합니다.
 */
@Service
public class AdminAuditLogService {

    private static final Logger logger = LoggerFactory.getLogger(AdminAuditLogService.class);

    private final AdminAuditLogRepository auditLogRepository;
    private final UserRepository userRepository;

    public AdminAuditLogService(AdminAuditLogRepository auditLogRepository, UserRepository userRepository) {
        this.auditLogRepository = auditLogRepository;
        this.userRepository = userRepository;
    }

    /**
     * 감사 로그 기록 (전체 파라미터)
     */
    @Transactional
    public AdminAuditLog log(Long adminUserId, String adminEmail, ActionType actionType,
                             String targetEntityType, Long targetEntityId,
                             String oldValue, String newValue, String reason, String ipAddress) {
        AdminAuditLog log = new AdminAuditLog();
        log.setAdminUserId(adminUserId);
        log.setAdminEmail(adminEmail);
        log.setActionType(actionType);
        log.setTargetEntityType(targetEntityType);
        log.setTargetEntityId(targetEntityId);
        log.setOldValue(oldValue);
        log.setNewValue(newValue);
        log.setReason(reason);
        log.setIpAddress(ipAddress);

        AdminAuditLog saved = auditLogRepository.save(log);
        logger.info("Audit log created: {}", saved.getSummary());
        return saved;
    }

    /**
     * 감사 로그 기록 (간편 버전 - 현재 인증된 사용자 자동 추출)
     */
    @Transactional
    public AdminAuditLog log(ActionType actionType, String targetEntityType, Long targetEntityId,
                             String oldValue, String newValue, String reason) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            logger.warn("Attempted to create audit log without authentication");
            throw new IllegalStateException("Cannot create audit log without authenticated user");
        }

        String adminEmail = authentication.getName();
        User adminUser = userRepository.findByEmail(adminEmail)
                .orElseThrow(() -> new RuntimeException("Admin user not found: " + adminEmail));

        String ipAddress = getClientIpAddress();

        return log(adminUser.getId(), adminEmail, actionType, targetEntityType, targetEntityId,
                oldValue, newValue, reason, ipAddress);
    }

    /**
     * 감사 로그 기록 (사유 없는 간편 버전)
     */
    @Transactional
    public AdminAuditLog log(ActionType actionType, String targetEntityType, Long targetEntityId,
                             String oldValue, String newValue) {
        return log(actionType, targetEntityType, targetEntityId, oldValue, newValue, null);
    }

    /**
     * 클라이언트 IP 주소 추출
     */
    private String getClientIpAddress() {
        try {
            ServletRequestAttributes attributes =
                    (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
            if (attributes == null) {
                return "UNKNOWN";
            }

            HttpServletRequest request = attributes.getRequest();

            // Proxy 헤더 확인 (X-Forwarded-For, X-Real-IP 등)
            String ipAddress = request.getHeader("X-Forwarded-For");
            if (ipAddress == null || ipAddress.isEmpty() || "unknown".equalsIgnoreCase(ipAddress)) {
                ipAddress = request.getHeader("X-Real-IP");
            }
            if (ipAddress == null || ipAddress.isEmpty() || "unknown".equalsIgnoreCase(ipAddress)) {
                ipAddress = request.getHeader("Proxy-Client-IP");
            }
            if (ipAddress == null || ipAddress.isEmpty() || "unknown".equalsIgnoreCase(ipAddress)) {
                ipAddress = request.getHeader("WL-Proxy-Client-IP");
            }
            if (ipAddress == null || ipAddress.isEmpty() || "unknown".equalsIgnoreCase(ipAddress)) {
                ipAddress = request.getRemoteAddr();
            }

            // X-Forwarded-For는 여러 IP를 포함할 수 있음 (첫 번째가 클라이언트 IP)
            if (ipAddress != null && ipAddress.contains(",")) {
                ipAddress = ipAddress.split(",")[0].trim();
            }

            return ipAddress;
        } catch (Exception e) {
            logger.warn("Failed to extract client IP address", e);
            return "UNKNOWN";
        }
    }

    /**
     * 특정 관리자의 로그 조회
     */
    public Page<AdminAuditLog> getLogsByAdminUserId(Long adminUserId, Pageable pageable) {
        return auditLogRepository.findByAdminUserId(adminUserId, pageable);
    }

    /**
     * 특정 작업 유형의 로그 조회
     */
    public Page<AdminAuditLog> getLogsByActionType(ActionType actionType, Pageable pageable) {
        return auditLogRepository.findByActionType(actionType, pageable);
    }

    /**
     * 특정 엔티티에 대한 로그 조회 (히스토리 추적용)
     */
    public Page<AdminAuditLog> getLogsByEntity(String targetEntityType, Long targetEntityId, Pageable pageable) {
        return auditLogRepository.findByTargetEntityTypeAndTargetEntityId(
                targetEntityType, targetEntityId, pageable);
    }

    /**
     * 특정 기간의 로그 조회
     */
    public Page<AdminAuditLog> getLogsByDateRange(LocalDateTime startDate, LocalDateTime endDate, Pageable pageable) {
        return auditLogRepository.findByDateRange(startDate, endDate, pageable);
    }

    /**
     * 고급 검색
     */
    public Page<AdminAuditLog> advancedSearch(Long adminUserId, ActionType actionType,
                                              String targetEntityType, Long targetEntityId,
                                              LocalDateTime startDate, LocalDateTime endDate,
                                              Pageable pageable) {
        return auditLogRepository.advancedSearch(adminUserId, actionType, targetEntityType,
                targetEntityId, startDate, endDate, pageable);
    }

    /**
     * 특정 IP의 최근 활동 조회 (보안 모니터링용)
     */
    public java.util.List<AdminAuditLog> getRecentActivityByIp(String ipAddress) {
        return auditLogRepository.findTop20ByIpAddressOrderByCreatedAtDesc(ipAddress);
    }

    /**
     * 최근 로그 조회
     */
    public java.util.List<AdminAuditLog> getRecentLogs() {
        return auditLogRepository.findTop50ByOrderByCreatedAtDesc();
    }
}
