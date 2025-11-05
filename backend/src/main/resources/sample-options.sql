-- 상품 옵션 테이블 생성 (이미 존재할 수 있음)
CREATE TABLE IF NOT EXISTS product_options (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    product_id BIGINT NOT NULL,
    name VARCHAR(255) NOT NULL,
    additional_price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    stock INT NOT NULL DEFAULT 0,
    is_required BOOLEAN NOT NULL DEFAULT FALSE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- 샘플 상품 옵션 데이터 추가
INSERT INTO product_options (product_id, name, additional_price, stock, is_required) VALUES
-- 상품 ID 1에 대한 옵션들
(1, '1kg', 0, 50, TRUE),
(1, '2kg', 5000, 30, TRUE),
(1, '3kg', 9000, 20, TRUE),

-- 상품 ID 2에 대한 옵션들 (존재하는 경우)
(2, '소포장 (500g)', 0, 100, TRUE),
(2, '대포장 (1kg)', 3000, 50, TRUE),

-- 상품 ID 3에 대한 옵션들 (존재하는 경우)
(3, '일반 포장', 0, 80, FALSE),
(3, '선물 포장', 2000, 40, FALSE);

-- 기존 상품들에 대해서도 옵션 추가 (상품이 존재하는 경우에만)
INSERT IGNORE INTO product_options (product_id, name, additional_price, stock, is_required)
SELECT p.id, '기본', 0, 100, FALSE
FROM products p 
WHERE p.id NOT IN (SELECT DISTINCT product_id FROM product_options)
LIMIT 10;
