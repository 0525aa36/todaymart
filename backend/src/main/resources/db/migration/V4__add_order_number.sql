-- Add order number field to orders table
ALTER TABLE orders 
ADD COLUMN order_number VARCHAR(50) UNIQUE;

-- Update existing orders with order numbers
UPDATE orders 
SET order_number = CONCAT('ORDER_', id, '_', UNIX_TIMESTAMP(created_at))
WHERE order_number IS NULL;

-- Make order_number NOT NULL after updating existing records
ALTER TABLE orders 
MODIFY COLUMN order_number VARCHAR(50) NOT NULL;
