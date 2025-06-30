-- This migration is no longer needed as bills table is created with all columns in 20240101000001_create_bills_table.sql
-- Keeping file for migration history but removing redundant operations

-- Note: Bills table now created with all necessary columns including:
-- user_id, date, bill_number, gst_amount, gst_percentage, discount_amount, status, created_at, updated_at