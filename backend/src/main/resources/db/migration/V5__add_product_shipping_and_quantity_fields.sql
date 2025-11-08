-- V5: Add shipping, packaging, and quantity fields to products table
-- Using IF NOT EXISTS logic for idempotency

SET @dbname = DATABASE();

-- Add supply_price if not exists
SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
   WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'products' AND COLUMN_NAME = 'supply_price') > 0,
  'SELECT 1',
  'ALTER TABLE products ADD COLUMN supply_price DECIMAL(10,2) COMMENT ''공급가 (도매가)'''
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Add shipping_fee if not exists
SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
   WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'products' AND COLUMN_NAME = 'shipping_fee') > 0,
  'SELECT 1',
  'ALTER TABLE products ADD COLUMN shipping_fee DECIMAL(10,2) NOT NULL DEFAULT 3000 COMMENT ''상품별 배송비'''
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Add can_combine_shipping if not exists
SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
   WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'products' AND COLUMN_NAME = 'can_combine_shipping') > 0,
  'SELECT 1',
  'ALTER TABLE products ADD COLUMN can_combine_shipping BOOLEAN NOT NULL DEFAULT false COMMENT ''합포장 가능 여부'''
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Add combine_shipping_unit if not exists
SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
   WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'products' AND COLUMN_NAME = 'combine_shipping_unit') > 0,
  'SELECT 1',
  'ALTER TABLE products ADD COLUMN combine_shipping_unit INT COMMENT ''합포장 단위 (예: 5개씩 묶음)'''
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Add courier_company if not exists
SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
   WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'products' AND COLUMN_NAME = 'courier_company') > 0,
  'SELECT 1',
  'ALTER TABLE products ADD COLUMN courier_company VARCHAR(50) COMMENT ''택배사'''
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Add min_order_quantity if not exists
SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
   WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'products' AND COLUMN_NAME = 'min_order_quantity') > 0,
  'SELECT 1',
  'ALTER TABLE products ADD COLUMN min_order_quantity INT NOT NULL DEFAULT 1 COMMENT ''최소 주문 수량'''
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Add max_order_quantity if not exists
SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
   WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'products' AND COLUMN_NAME = 'max_order_quantity') > 0,
  'SELECT 1',
  'ALTER TABLE products ADD COLUMN max_order_quantity INT COMMENT ''최대 주문 수량 (NULL이면 제한 없음)'''
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Add index for shipping_fee if not exists
SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
   WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'products' AND INDEX_NAME = 'idx_products_shipping_fee') > 0,
  'SELECT 1',
  'CREATE INDEX idx_products_shipping_fee ON products(shipping_fee)'
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Add index for min/max order quantity if not exists
SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
   WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'products' AND INDEX_NAME = 'idx_products_order_quantity') > 0,
  'SELECT 1',
  'CREATE INDEX idx_products_order_quantity ON products(min_order_quantity, max_order_quantity)'
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;
