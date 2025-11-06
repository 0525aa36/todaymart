package com.agri.market.notification;

import com.agri.market.user.User;
import com.agri.market.user.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class NotificationService {
    
    private static final Logger logger = LoggerFactory.getLogger(NotificationService.class);
    private static final Long DEFAULT_TIMEOUT = 60L * 1000 * 60; // 60분
    
    private final Map<String, SseEmitter> userEmitters = new ConcurrentHashMap<>();
    private final Map<String, SseEmitter> adminEmitters = new ConcurrentHashMap<>();
    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    public NotificationService(NotificationRepository notificationRepository, UserRepository userRepository) {
        this.notificationRepository = notificationRepository;
        this.userRepository = userRepository;
    }

    public SseEmitter createEmitter(String userEmail, boolean isAdmin) {
        logger.info("Creating SSE emitter for user: {}, isAdmin: {}", userEmail, isAdmin);
        SseEmitter emitter = new SseEmitter(DEFAULT_TIMEOUT);
        
        if (isAdmin) {
            adminEmitters.put(userEmail, emitter);
            logger.info("Added admin emitter. Total admin emitters: {}", adminEmitters.size());
        } else {
            userEmitters.put(userEmail, emitter);
            logger.info("Added user emitter. Total user emitters: {}", userEmitters.size());
        }

        emitter.onCompletion(() -> {
            logger.info("SSE emitter completed for user: {}", userEmail);
            removeEmitter(userEmail, isAdmin);
        });
        emitter.onTimeout(() -> {
            logger.info("SSE emitter timeout for user: {}", userEmail);
            removeEmitter(userEmail, isAdmin);
        });
        emitter.onError((e) -> {
            logger.error("SSE error for user: " + userEmail, e);
            removeEmitter(userEmail, isAdmin);
        });

        // 연결 확인 메시지 전송
        try {
            emitter.send(SseEmitter.event()
                    .name("connected")
                    .data("알림 연결이 설정되었습니다"));
            logger.info("Successfully sent connection message to user: {}", userEmail);
        } catch (IOException e) {
            logger.error("Failed to send connection message", e);
            removeEmitter(userEmail, isAdmin);
        }

        return emitter;
    }

    private void removeEmitter(String userEmail, boolean isAdmin) {
        if (isAdmin) {
            adminEmitters.remove(userEmail);
        } else {
            userEmitters.remove(userEmail);
        }
        logger.info("Removed emitter for user: {}", userEmail);
    }

    public void sendToUser(String userEmail, String title, String message, NotificationType type) {
        // DB에 알림 저장
        User user = userRepository.findByEmail(userEmail).orElse(null);
        if (user != null) {
            Notification notification = new Notification(user, title, message, type);
            notificationRepository.save(notification);
        }

        // 실시간 전송
        SseEmitter emitter = userEmitters.get(userEmail);
        if (emitter != null) {
            try {
                NotificationDto dto = new NotificationDto(title, message, type.name());
                emitter.send(SseEmitter.event()
                        .name("notification")
                        .data(dto));
            } catch (IOException e) {
                logger.error("Failed to send notification to user: " + userEmail, e);
                removeEmitter(userEmail, false);
            }
        }
    }

    /**
     * 모든 관리자에게 알림 전송 (동기)
     */
    public void sendToAllAdmins(String title, String message, NotificationType type) {
        logger.info("Sending notification to all admins: {} - {}", title, message);
        logger.info("Current admin emitters count: {}", adminEmitters.size());

        // DB에 관리자 알림 저장
        Notification notification = new Notification(null, title, message, type);
        notificationRepository.save(notification);

        // 모든 관리자에게 실시간 전송
        NotificationDto dto = new NotificationDto(title, message, type.name());
        adminEmitters.forEach((email, emitter) -> {
            logger.info("Sending notification to admin: {}", email);
            try {
                emitter.send(SseEmitter.event()
                        .name("notification")
                        .data(dto));
                logger.info("Successfully sent notification to admin: {}", email);
            } catch (IOException e) {
                logger.error("Failed to send notification to admin: " + email, e);
                removeEmitter(email, true);
            }
        });

        logger.info("Finished sending notifications to {} admins", adminEmitters.size());
    }

    /**
     * 모든 관리자에게 알림 전송 (비동기)
     * 트랜잭션과 분리하여 성능 향상
     */
    @Async
    public void sendToAllAdminsAsync(String title, String message, NotificationType type) {
        logger.info("[Async] Sending notification to all admins: {} - {}", title, message);
        sendToAllAdmins(title, message, type);
    }

    /**
     * 사용자에게 알림 전송 (비동기)
     * 트랜잭션과 분리하여 성능 향상
     */
    @Async
    public void sendToUserAsync(String userEmail, String title, String message, NotificationType type) {
        logger.info("[Async] Sending notification to user: {} - {}", userEmail, title);
        sendToUser(userEmail, title, message, type);
    }

    // DTO 클래스
    public static class NotificationDto {
        private String title;
        private String message;
        private String type;

        public NotificationDto(String title, String message, String type) {
            this.title = title;
            this.message = message;
            this.type = type;
        }

        // Getters
        public String getTitle() { return title; }
        public String getMessage() { return message; }
        public String getType() { return type; }
    }
}
