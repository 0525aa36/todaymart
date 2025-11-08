-- Add order number field to orders table
-- Using IF NOT EXISTS logic for idempotency

SET @dbname = DATABASE();

-- Add order_number if not exists
SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
   WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'orders' AND COLUMN_NAME = 'order_number') > 0,
  'SELECT 1',
  'ALTER TABLE orders ADD COLUMN order_number VARCHAR(50) UNIQUE'
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Update existing orders with order numbers
UPDATE orders
SET order_number = CONCAT('ORDER_', id, '_', UNIX_TIMESTAMP(created_at))
WHERE order_number IS NULL;

-- Make order_number NOT NULL after updating existing records
-- Only if column exists and is nullable
SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
   WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'orders'
   AND COLUMN_NAME = 'order_number' AND IS_NULLABLE = 'YES') > 0,
  'ALTER TABLE orders MODIFY COLUMN order_number VARCHAR(50) NOT NULL',
  'SELECT 1'
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;
