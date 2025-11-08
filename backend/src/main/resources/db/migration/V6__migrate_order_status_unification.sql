-- V6: Unify order_status and payment_status into single order_status column
-- Using IF NOT EXISTS logic for idempotency

SET @dbname = DATABASE();

-- Check if we need to run this migration (if payment_status still exists)
SET @payment_status_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'orders' AND COLUMN_NAME = 'payment_status');

-- Step 1: Add new_order_status column if needed and migration not yet run
SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
   WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'orders' AND COLUMN_NAME = 'new_order_status') = 0
  AND @payment_status_exists > 0,
  'ALTER TABLE orders ADD COLUMN new_order_status VARCHAR(50) COMMENT ''통합된 주문 상태''',
  'SELECT 1'
));
PREPARE stmt FROM @preparedStatement;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Step 2: Migrate existing data if migration needed
SET @preparedStatement = (SELECT IF(@payment_status_exists > 0,
  'UPDATE orders SET new_order_status = CASE
    WHEN payment_status = ''FAILED'' THEN ''PAYMENT_FAILED''
    WHEN order_status = ''PENDING'' AND payment_status = ''PENDING'' THEN ''PENDING_PAYMENT''
    WHEN order_status = ''PAID'' AND payment_status = ''PAID'' THEN ''PAID''
    WHEN order_status = ''SHIPPED'' THEN ''SHIPPED''
    WHEN order_status = ''DELIVERED'' THEN ''DELIVERED''
    WHEN order_status = ''CANCELLED'' THEN ''CANCELLED''
    ELSE ''PENDING_PAYMENT''
  END
  WHERE new_order_status IS NULL',
  'SELECT 1'
));
PREPARE stmt FROM @preparedStatement;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Step 3: Drop payment_status if it exists
SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
   WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'orders' AND COLUMN_NAME = 'payment_status') > 0,
  'ALTER TABLE orders DROP COLUMN payment_status',
  'SELECT 1'
));
PREPARE stmt FROM @preparedStatement;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Step 4: Drop old order_status if new_order_status exists
SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
   WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'orders' AND COLUMN_NAME = 'new_order_status') > 0
  AND (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
   WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'orders' AND COLUMN_NAME = 'order_status') > 0,
  'ALTER TABLE orders DROP COLUMN order_status',
  'SELECT 1'
));
PREPARE stmt FROM @preparedStatement;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Step 5: Rename new_order_status to order_status if new_order_status exists
SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
   WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'orders' AND COLUMN_NAME = 'new_order_status') > 0,
  'ALTER TABLE orders CHANGE COLUMN new_order_status order_status VARCHAR(50) NOT NULL COMMENT ''주문 상태 (PENDING_PAYMENT, PAYMENT_FAILED, PAID, PREPARING, SHIPPED, DELIVERED, CANCELLED)''',
  'SELECT 1'
));
PREPARE stmt FROM @preparedStatement;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Step 6: Add index if not exists
SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
   WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'orders' AND INDEX_NAME = 'idx_orders_order_status') > 0,
  'SELECT 1',
  'CREATE INDEX idx_orders_order_status ON orders(order_status)'
));
PREPARE stmt FROM @preparedStatement;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
