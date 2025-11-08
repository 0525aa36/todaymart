-- 웰컴 쿠폰 생성 (회원가입 시 자동 발급)
-- 이미 존재하는 경우 건너뛰기 (멱등성 보장)

INSERT INTO coupons (
    code,
    name,
    description,
    discount_type,
    discount_value,
    min_order_amount,
    max_discount_amount,
    start_date,
    end_date,
    total_quantity,
    used_quantity,
    is_active,
    usage_type,
    applicable_category,
    created_at,
    updated_at
)
SELECT
    'WELCOME',
    '신규 가입 환영 쿠폰',
    '회원가입을 축하합니다! 모든 상품에 사용 가능한 10,000원 할인 쿠폰입니다.',
    'FIXED_AMOUNT',
    10000.00,
    30000.00,
    NULL,
    NOW(),
    DATE_ADD(NOW(), INTERVAL 1 YEAR),  -- 1년 후 만료
    NULL,  -- 무제한 수량
    0,
    TRUE,
    'SINGLE_USE',
    NULL,  -- 모든 카테고리 적용 가능
    NOW(),
    NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM coupons WHERE code = 'WELCOME'
);
