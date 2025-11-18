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

            // 모든 테이블 데이터 삭제
            entityManager.createNativeQuery("TRUNCATE TABLE admin_audit_logs").executeUpdate();
            entityManager.createNativeQuery("TRUNCATE TABLE banners").executeUpdate();
            entityManager.createNativeQuery("TRUNCATE TABLE cart_items").executeUpdate();
            entityManager.createNativeQuery("TRUNCATE TABLE carts").executeUpdate();
            entityManager.createNativeQuery("TRUNCATE TABLE categories").executeUpdate();
            entityManager.createNativeQuery("TRUNCATE TABLE coupon_products").executeUpdate();
            entityManager.createNativeQuery("TRUNCATE TABLE coupons").executeUpdate();
            entityManager.createNativeQuery("TRUNCATE TABLE faqs").executeUpdate();
            entityManager.createNativeQuery("TRUNCATE TABLE google_sheets_sync_log").executeUpdate();
            entityManager.createNativeQuery("TRUNCATE TABLE guest_order_items").executeUpdate();
            entityManager.createNativeQuery("TRUNCATE TABLE guest_orders").executeUpdate();
            entityManager.createNativeQuery("TRUNCATE TABLE home_sections").executeUpdate();
            entityManager.createNativeQuery("TRUNCATE TABLE inquiries").executeUpdate();
            entityManager.createNativeQuery("TRUNCATE TABLE notices").executeUpdate();
            entityManager.createNativeQuery("TRUNCATE TABLE notifications").executeUpdate();
            entityManager.createNativeQuery("TRUNCATE TABLE payments").executeUpdate();
            entityManager.createNativeQuery("TRUNCATE TABLE order_items").executeUpdate();
            entityManager.createNativeQuery("TRUNCATE TABLE orders").executeUpdate();
            entityManager.createNativeQuery("TRUNCATE TABLE pending_orders").executeUpdate();
            entityManager.createNativeQuery("TRUNCATE TABLE product_images").executeUpdate();
            entityManager.createNativeQuery("TRUNCATE TABLE product_notices").executeUpdate();
            entityManager.createNativeQuery("TRUNCATE TABLE product_options").executeUpdate();
            entityManager.createNativeQuery("TRUNCATE TABLE products").executeUpdate();
            entityManager.createNativeQuery("TRUNCATE TABLE refresh_tokens").executeUpdate();
            entityManager.createNativeQuery("TRUNCATE TABLE return_items").executeUpdate();
            entityManager.createNativeQuery("TRUNCATE TABLE return_requests").executeUpdate();
            entityManager.createNativeQuery("TRUNCATE TABLE reviews").executeUpdate();
            entityManager.createNativeQuery("TRUNCATE TABLE sellers").executeUpdate();
            entityManager.createNativeQuery("TRUNCATE TABLE settlements").executeUpdate();
            entityManager.createNativeQuery("TRUNCATE TABLE special_deal_products").executeUpdate();
            entityManager.createNativeQuery("TRUNCATE TABLE special_deals").executeUpdate();
            entityManager.createNativeQuery("TRUNCATE TABLE user_addresses").executeUpdate();
            entityManager.createNativeQuery("TRUNCATE TABLE user_coupons").executeUpdate();
            entityManager.createNativeQuery("TRUNCATE TABLE users").executeUpdate();
            entityManager.createNativeQuery("TRUNCATE TABLE wishlist_items").executeUpdate();

            // 외래 키 체크 재활성화
            entityManager.createNativeQuery("SET FOREIGN_KEY_CHECKS = 1").executeUpdate();

            return ResponseEntity.ok("All database data has been cleared successfully");
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body("Error clearing data: " + e.getMessage());
        }
    }
}
