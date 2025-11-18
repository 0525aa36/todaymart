package com.agri.market.admin;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.transaction.Transactional;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/temp")
public class TempDataClearController {

    @PersistenceContext
    private EntityManager entityManager;

    @DeleteMapping("/clear-all-data")
    @PreAuthorize("hasRole('ADMIN')")
    @Transactional
    public ResponseEntity<String> clearAllData() {
        try {
            // 외래 키 체크 비활성화
            entityManager.createNativeQuery("SET FOREIGN_KEY_CHECKS = 0").executeUpdate();

            // 모든 테이블 데이터 삭제 (DELETE 사용)
            entityManager.createNativeQuery("DELETE FROM return_items").executeUpdate();
            entityManager.createNativeQuery("DELETE FROM return_requests").executeUpdate();
            entityManager.createNativeQuery("DELETE FROM payments").executeUpdate();
            entityManager.createNativeQuery("DELETE FROM order_items").executeUpdate();
            entityManager.createNativeQuery("DELETE FROM orders").executeUpdate();
            entityManager.createNativeQuery("DELETE FROM guest_order_items").executeUpdate();
            entityManager.createNativeQuery("DELETE FROM guest_orders").executeUpdate();
            entityManager.createNativeQuery("DELETE FROM pending_orders").executeUpdate();
            entityManager.createNativeQuery("DELETE FROM notifications").executeUpdate();
            entityManager.createNativeQuery("DELETE FROM cart_items").executeUpdate();
            entityManager.createNativeQuery("DELETE FROM carts").executeUpdate();
            entityManager.createNativeQuery("DELETE FROM wishlist_items").executeUpdate();
            entityManager.createNativeQuery("DELETE FROM reviews").executeUpdate();
            entityManager.createNativeQuery("DELETE FROM user_addresses").executeUpdate();
            entityManager.createNativeQuery("DELETE FROM user_coupons").executeUpdate();
            entityManager.createNativeQuery("DELETE FROM refresh_tokens").executeUpdate();
            entityManager.createNativeQuery("DELETE FROM inquiries").executeUpdate();
            entityManager.createNativeQuery("DELETE FROM users").executeUpdate();
            entityManager.createNativeQuery("DELETE FROM coupon_products").executeUpdate();
            entityManager.createNativeQuery("DELETE FROM coupons").executeUpdate();
            entityManager.createNativeQuery("DELETE FROM special_deal_products").executeUpdate();
            entityManager.createNativeQuery("DELETE FROM special_deals").executeUpdate();
            entityManager.createNativeQuery("DELETE FROM product_images").executeUpdate();
            entityManager.createNativeQuery("DELETE FROM product_options").executeUpdate();
            entityManager.createNativeQuery("DELETE FROM product_notices").executeUpdate();
            entityManager.createNativeQuery("DELETE FROM products").executeUpdate();
            entityManager.createNativeQuery("DELETE FROM categories").executeUpdate();
            entityManager.createNativeQuery("DELETE FROM banners").executeUpdate();
            entityManager.createNativeQuery("DELETE FROM home_sections").executeUpdate();
            entityManager.createNativeQuery("DELETE FROM notices").executeUpdate();
            entityManager.createNativeQuery("DELETE FROM faqs").executeUpdate();
            entityManager.createNativeQuery("DELETE FROM sellers").executeUpdate();
            entityManager.createNativeQuery("DELETE FROM settlements").executeUpdate();
            entityManager.createNativeQuery("DELETE FROM admin_audit_logs").executeUpdate();
            entityManager.createNativeQuery("DELETE FROM google_sheets_sync_log").executeUpdate();

            // 외래 키 체크 재활성화
            entityManager.createNativeQuery("SET FOREIGN_KEY_CHECKS = 1").executeUpdate();

            // AUTO_INCREMENT 초기화
            entityManager.createNativeQuery("ALTER TABLE users AUTO_INCREMENT = 1").executeUpdate();
            entityManager.createNativeQuery("ALTER TABLE products AUTO_INCREMENT = 1").executeUpdate();
            entityManager.createNativeQuery("ALTER TABLE orders AUTO_INCREMENT = 1").executeUpdate();

            return ResponseEntity.ok("All database data has been cleared successfully");
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body("Error clearing data: " + e.getMessage());
        }
    }
}
