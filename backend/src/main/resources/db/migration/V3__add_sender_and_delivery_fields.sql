-- Add sender information and delivery message fields to orders table
ALTER TABLE orders 
ADD COLUMN sender_name VARCHAR(100),
ADD COLUMN sender_phone VARCHAR(20),
ADD COLUMN delivery_message TEXT;
