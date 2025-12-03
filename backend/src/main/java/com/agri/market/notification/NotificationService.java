package com.agri.market.notification;

import com.agri.market.user.User;
import com.agri.market.user.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

@Service
public class NotificationService {

    private static final Logger logger = LoggerFactory.getLogger(NotificationService.class);

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    public NotificationService(NotificationRepository notificationRepository, UserRepository userRepository) {
        this.notificationRepository = notificationRepository;
        this.userRepository = userRepository;
    }

    /**
     * 사용자에게 알림 저장 (DB only)
     */
    public void saveNotificationForUser(String userEmail, String title, String message, NotificationType type) {
        User user = userRepository.findByEmail(userEmail).orElse(null);
        if (user != null) {
            Notification notification = new Notification(user, title, message, type);
            notificationRepository.save(notification);
            logger.info("Saved notification to DB for user: {} - {}", userEmail, title);
        }
    }

    /**
     * 관리자 알림 저장 (DB only)
     */
    public void saveNotificationForAdmins(String title, String message, NotificationType type) {
        Notification notification = new Notification(null, title, message, type);
        notificationRepository.save(notification);
        logger.info("Saved admin notification to DB: {} - {}", title, message);
    }
}
