package com.agri.market.notification;

import com.agri.market.user.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface NotificationRepository extends JpaRepository<Notification, Long> {
    
    // 사용자별 알림 조회
    Page<Notification> findByUserOrderByCreatedAtDesc(User user, Pageable pageable);
    
    // 관리자 알림 조회 (user가 null인 경우)
    @Query("SELECT n FROM Notification n WHERE n.user IS NULL ORDER BY n.createdAt DESC")
    Page<Notification> findAdminNotifications(Pageable pageable);
    
    // 읽지 않은 알림 개수
    long countByUserAndIsReadFalse(User user);
    
    // 읽지 않은 관리자 알림 개수
    @Query("SELECT COUNT(n) FROM Notification n WHERE n.user IS NULL AND n.isRead = false")
    long countUnreadAdminNotifications();
    
    // 사용자의 읽지 않은 알림 목록
    List<Notification> findByUserAndIsReadFalseOrderByCreatedAtDesc(User user);
}
