package com.agri.market.notification;

import com.agri.market.security.JwtTokenProvider;
import com.agri.market.security.CustomUserDetailsService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    private static final Logger logger = LoggerFactory.getLogger(NotificationController.class);

    private final NotificationService notificationService;
    private final JwtTokenProvider jwtTokenProvider;
    private final CustomUserDetailsService userDetailsService;

    public NotificationController(NotificationService notificationService, 
                                JwtTokenProvider jwtTokenProvider,
                                CustomUserDetailsService userDetailsService) {
        this.notificationService = notificationService;
        this.jwtTokenProvider = jwtTokenProvider;
        this.userDetailsService = userDetailsService;
    }

    @GetMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter streamNotifications(@RequestParam(required = false) String token) {

        String userEmail = null;
        boolean isAdmin = false;

        // JWT 토큰에서 사용자 정보 추출
        if (token != null && jwtTokenProvider.validateJwtToken(token)) {
            try {
                userEmail = jwtTokenProvider.getUserNameFromJwtToken(token);
                UserDetails userDetails = userDetailsService.loadUserByUsername(userEmail);
                isAdmin = userDetails.getAuthorities().stream()
                        .anyMatch(auth -> auth.getAuthority().equals("ROLE_ADMIN"));

                logger.info("SSE 연결 - User: {}, isAdmin: {}", userEmail, isAdmin);
            } catch (Exception e) {
                logger.error("토큰 파싱 오류: ", e);
                throw new RuntimeException("Invalid authentication token");
            }
        } else {
            throw new RuntimeException("Authentication token is required");
        }

        return notificationService.createEmitter(userEmail, isAdmin);
    }

    @PostMapping("/test")
    public ResponseEntity<String> sendTestNotification(Authentication authentication) {
        UserDetails userDetails = (UserDetails) authentication.getPrincipal();
        String userEmail = userDetails.getUsername();
        
        notificationService.sendToUser(
            userEmail, 
            "테스트 알림", 
            "실시간 알림 시스템이 정상 작동합니다!", 
            NotificationType.SYSTEM
        );
        
        return ResponseEntity.ok("테스트 알림이 전송되었습니다");
    }

    @PostMapping("/test-admin")
    public ResponseEntity<String> sendTestAdminNotification() {
        notificationService.sendToAllAdmins(
            "관리자 테스트 알림", 
            "관리자 실시간 알림 시스템이 정상 작동합니다!", 
            NotificationType.SYSTEM
        );
        
        return ResponseEntity.ok("관리자 테스트 알림이 전송되었습니다");
    }
}
