-- V6: Unify order_status and payment_status into single order_status column

-- Step 1: Temporarily add new_order_status column with new enum values
ALTER TABLE orders
ADD COLUMN new_order_status VARCHAR(50) COMMENT '통합된 주문 상태';

-- Step 2: Migrate existing data to new status format
-- Map (order_status, payment_status) combinations to new unified status
UPDATE orders
SET new_order_status = CASE
    -- 결제 실패
    WHEN payment_status = 'FAILED' THEN 'PAYMENT_FAILED'
    -- 결제 대기
    WHEN order_status = 'PENDING' AND payment_status = 'PENDING' THEN 'PENDING_PAYMENT'
    -- 결제 완료
    WHEN order_status = 'PAID' AND payment_status = 'PAID' THEN 'PAID'
    -- 배송중
    WHEN order_status = 'SHIPPED' THEN 'SHIPPED'
    -- 배송 완료
    WHEN order_status = 'DELIVERED' THEN 'DELIVERED'
    -- 취소
    WHEN order_status = 'CANCELLED' THEN 'CANCELLED'
    -- Default fallback to PENDING_PAYMENT
    ELSE 'PENDING_PAYMENT'
END;

-- Step 3: Drop old payment_status column
ALTER TABLE orders
DROP COLUMN payment_status;

-- Step 4: Drop old order_status column
ALTER TABLE orders
DROP COLUMN order_status;

-- Step 5: Rename new_order_status to order_status
ALTER TABLE orders
CHANGE COLUMN new_order_status order_status VARCHAR(50) NOT NULL COMMENT '주문 상태 (PENDING_PAYMENT, PAYMENT_FAILED, PAID, PREPARING, SHIPPED, DELIVERED, CANCELLED)';

-- Add index on order_status for better query performance
CREATE INDEX idx_orders_order_status ON orders(order_status);
