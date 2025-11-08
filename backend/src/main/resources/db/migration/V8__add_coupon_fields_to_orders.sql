-- V8: Add coupon-related fields to orders table
-- Adds: coupon_id, coupon_discount_amount, product_discount_amount, shipping_fee, final_amount

SET @dbname = DATABASE();

-- ================================================
-- 1. coupon_id 필드 추가 (쿠폰 참조)
-- ================================================
SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
   WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'orders' AND COLUMN_NAME = 'coupon_id') = 0,
  'ALTER TABLE orders ADD COLUMN coupon_id BIGINT COMMENT ''적용된 쿠폰 ID''',
  'SELECT 1'
));
PREPARE stmt FROM @preparedStatement;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ================================================
-- 2. coupon_discount_amount 필드 추가 (쿠폰 할인 금액)
-- ================================================
SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
   WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'orders' AND COLUMN_NAME = 'coupon_discount_amount') = 0,
  'ALTER TABLE orders ADD COLUMN coupon_discount_amount DECIMAL(10,2) DEFAULT 0 COMMENT ''쿠폰 할인 금액''',
  'SELECT 1'
));
PREPARE stmt FROM @preparedStatement;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ================================================
-- 3. product_discount_amount 필드 추가 (상품 할인 금액)
-- ================================================
SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
   WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'orders' AND COLUMN_NAME = 'product_discount_amount') = 0,
  'ALTER TABLE orders ADD COLUMN product_discount_amount DECIMAL(10,2) DEFAULT 0 COMMENT ''상품 할인 금액 (할인율 적용)''',
  'SELECT 1'
));
PREPARE stmt FROM @preparedStatement;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ================================================
-- 4. shipping_fee 필드 추가 (배송비)
-- ================================================
SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
   WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'orders' AND COLUMN_NAME = 'shipping_fee') = 0,
  'ALTER TABLE orders ADD COLUMN shipping_fee DECIMAL(10,2) DEFAULT 0 COMMENT ''배송비''',
  'SELECT 1'
));
PREPARE stmt FROM @preparedStatement;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ================================================
-- 5. final_amount 필드 추가 (최종 결제 금액)
-- ================================================
SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
   WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'orders' AND COLUMN_NAME = 'final_amount') = 0,
  'ALTER TABLE orders ADD COLUMN final_amount DECIMAL(10,2) COMMENT ''최종 결제 금액 (totalAmount - couponDiscount + shippingFee)''',
  'SELECT 1'
));
PREPARE stmt FROM @preparedStatement;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ================================================
-- 6. Foreign Key 추가 (coupon_id -> coupons)
-- ================================================
SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
   WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'orders' AND CONSTRAINT_NAME = 'fk_orders_coupon') = 0
  AND (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
   WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'orders' AND COLUMN_NAME = 'coupon_id') > 0,
  'ALTER TABLE orders ADD CONSTRAINT fk_orders_coupon FOREIGN KEY (coupon_id) REFERENCES coupons(id) ON DELETE SET NULL',
  'SELECT 1'
));
PREPARE stmt FROM @preparedStatement;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ================================================
-- 7. Index 추가 (coupon_id)
-- ================================================
SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
   WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'orders' AND INDEX_NAME = 'idx_orders_coupon') = 0,
  'CREATE INDEX idx_orders_coupon ON orders(coupon_id)',
  'SELECT 1'
));
PREPARE stmt FROM @preparedStatement;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ================================================
-- 8. final_amount 초기값 설정 (기존 데이터)
-- ================================================
UPDATE orders
SET final_amount = total_amount
WHERE final_amount IS NULL;
