-- Add performance indexes for frequently queried columns
-- Migration V12: Performance optimization indexes

-- Users table indexes
-- email is used for authentication on every request
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Products table indexes
-- name is used for product search
CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);

-- category_id is used for filtering products by category
CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);

-- seller_id is used for filtering products by seller
CREATE INDEX IF NOT EXISTS idx_products_seller_id ON products(seller_id);

-- Compound index for product search with filters
CREATE INDEX IF NOT EXISTS idx_products_category_name ON products(category_id, name);

-- Orders table indexes
-- user_id is used for order history queries
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);

-- order_status is used for filtering orders by status
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(order_status);

-- order_number is used for order lookup (already might exist, but ensuring)
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number);

-- Compound index for user orders with status filter
CREATE INDEX IF NOT EXISTS idx_orders_user_status ON orders(user_id, order_status);

-- Reviews table indexes
-- product_id is used for fetching product reviews and calculating ratings
CREATE INDEX IF NOT EXISTS idx_reviews_product_id ON reviews(product_id);

-- user_id is used for user review history
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON reviews(user_id);

-- Cart items table indexes
-- cart_id is used for fetching cart items
CREATE INDEX IF NOT EXISTS idx_cart_items_cart_id ON cart_items(cart_id);

-- Carts table indexes
-- user_id is used for fetching user's cart
CREATE INDEX IF NOT EXISTS idx_carts_user_id ON carts(user_id);

-- Wishlist table indexes
-- user_id is used for fetching user's wishlist
CREATE INDEX IF NOT EXISTS idx_wishlist_user_id ON wishlist(user_id);

-- product_id is used for checking if product is in wishlist
CREATE INDEX IF NOT EXISTS idx_wishlist_product_id ON wishlist(product_id);

-- Compound index for wishlist user-product lookup
CREATE INDEX IF NOT EXISTS idx_wishlist_user_product ON wishlist(user_id, product_id);

-- Payments table indexes
-- order_id is used for payment lookup by order
CREATE INDEX IF NOT EXISTS idx_payments_order_id ON payments(order_id);

-- user_id is used for payment history
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);

-- Order items table indexes
-- order_id is used for fetching order items
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);

-- product_id is used for order analytics
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);

-- product_option_id is used for stock management
CREATE INDEX IF NOT EXISTS idx_order_items_product_option_id ON order_items(product_option_id);

-- Product options table indexes
-- product_id is used for fetching product options
CREATE INDEX IF NOT EXISTS idx_product_options_product_id ON product_options(product_id);

-- Product images table indexes (if exists)
-- product_id is used for fetching product images
CREATE INDEX IF NOT EXISTS idx_product_images_product_id ON product_images(product_id);

-- Coupons table indexes
-- code is used for coupon validation
CREATE INDEX IF NOT EXISTS idx_coupons_code ON coupons(code);

-- valid_from and valid_until for filtering active coupons
CREATE INDEX IF NOT EXISTS idx_coupons_validity ON coupons(valid_from, valid_until);

-- User coupons table indexes (if exists)
-- user_id for user's coupon list
CREATE INDEX IF NOT EXISTS idx_user_coupons_user_id ON user_coupons(user_id);

-- coupon_id for coupon usage tracking
CREATE INDEX IF NOT EXISTS idx_user_coupons_coupon_id ON user_coupons(coupon_id);

-- Compound index for user coupon lookup
CREATE INDEX IF NOT EXISTS idx_user_coupons_user_coupon ON user_coupons(user_id, coupon_id);
