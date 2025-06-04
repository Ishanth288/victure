-- Add payment_method column to bills table
ALTER TABLE bills ADD COLUMN payment_method VARCHAR(50) DEFAULT 'cash';

-- Add index for better performance
CREATE INDEX idx_bills_payment_method ON bills(payment_method);

-- Update existing bills to have default payment method
UPDATE bills SET payment_method = 'cash' WHERE payment_method IS NULL; 