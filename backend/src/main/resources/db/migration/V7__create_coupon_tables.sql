-- V7: Create coupon tables for coupon system
-- Creates: coupons, user_coupons tables with indexes

SET @dbname = DATABASE();

-- ================================================
-- 1. coupons 테이블 생성 (쿠폰 기본 정보)
-- ================================================
CREATE TABLE IF NOT EXISTS coupons (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL COMMENT '쿠폰 코드 (고유값)',
    name VARCHAR(100) NOT NULL COMMENT '쿠폰 이름',
    description TEXT COMMENT '쿠폰 설명',
    discount_type VARCHAR(20) NOT NULL COMMENT '할인 타입 (FIXED_AMOUNT, PERCENTAGE)',
    discount_value DECIMAL(10,2) NOT NULL COMMENT '할인값 (정액: 원, 정률: %)',
    min_order_amount DECIMAL(10,2) DEFAULT 0 COMMENT '최소 주문 금액',
    max_discount_amount DECIMAL(10,2) COMMENT '최대 할인 금액 (정률 할인용)',
    start_date DATETIME NOT NULL COMMENT '시작일',
    end_date DATETIME NOT NULL COMMENT '종료일',
    total_quantity INT COMMENT '총 발급 수량 (NULL = 무제한)',
    used_quantity INT DEFAULT 0 COMMENT '사용된 수량',
    is_active BOOLEAN DEFAULT TRUE COMMENT '활성화 여부',
    usage_type VARCHAR(20) NOT NULL DEFAULT 'SINGLE_USE' COMMENT '사용 타입 (SINGLE_USE, MULTI_USE)',
    applicable_category VARCHAR(100) COMMENT '적용 가능한 카테고리 (NULL = 전체)',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_code (code),
    INDEX idx_active_dates (is_active, start_date, end_date),
    INDEX idx_category (applicable_category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='쿠폰 기본 정보';

-- ================================================
-- 2. user_coupons 테이블 생성 (사용자별 쿠폰 보유)
-- ================================================
CREATE TABLE IF NOT EXISTS user_coupons (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    coupon_id BIGINT NOT NULL,
    issued_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '발급일',
    used_at DATETIME COMMENT '사용일 (NULL = 미사용)',
    order_id BIGINT COMMENT '사용된 주문 ID',
    expires_at DATETIME NOT NULL COMMENT '만료일',

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (coupon_id) REFERENCES coupons(id) ON DELETE CASCADE,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL,

    INDEX idx_user_unused (user_id, used_at),
    INDEX idx_coupon (coupon_id),
    INDEX idx_expires (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='사용자별 쿠폰 보유 내역';

-- ================================================
-- 3. coupon_products 테이블 생성 (특정 상품 쿠폰용)
-- ================================================
CREATE TABLE IF NOT EXISTS coupon_products (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    coupon_id BIGINT NOT NULL,
    product_id BIGINT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (coupon_id) REFERENCES coupons(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,

    UNIQUE KEY uk_coupon_product (coupon_id, product_id),
    INDEX idx_coupon (coupon_id),
    INDEX idx_product (product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='쿠폰 적용 가능 상품 (NULL이면 전체 상품 적용)';
