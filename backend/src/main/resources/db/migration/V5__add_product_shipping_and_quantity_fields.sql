-- V5: Add shipping, packaging, and quantity fields to products table

-- Add new columns for product shipping and quantity management
ALTER TABLE products
ADD COLUMN supply_price DECIMAL(10,2) COMMENT '공급가 (도매가)',
ADD COLUMN shipping_fee DECIMAL(10,2) NOT NULL DEFAULT 3000 COMMENT '상품별 배송비',
ADD COLUMN can_combine_shipping BOOLEAN NOT NULL DEFAULT false COMMENT '합포장 가능 여부',
ADD COLUMN combine_shipping_unit INT COMMENT '합포장 단위 (예: 5개씩 묶음)',
ADD COLUMN courier_company VARCHAR(50) COMMENT '택배사',
ADD COLUMN min_order_quantity INT NOT NULL DEFAULT 1 COMMENT '최소 주문 수량',
ADD COLUMN max_order_quantity INT COMMENT '최대 주문 수량 (NULL이면 제한 없음)';

-- Add index for shipping_fee for potential queries
CREATE INDEX idx_products_shipping_fee ON products(shipping_fee);

-- Add index for min/max order quantity
CREATE INDEX idx_products_order_quantity ON products(min_order_quantity, max_order_quantity);
