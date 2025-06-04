-- MANUAL DATABASE UPDATES FOR REPLACEMENT SYSTEM AND OPTIONAL DOCTOR NAME
-- Run these commands in your Supabase SQL Editor

-- 1. Add replacement tracking columns to bill_items table
ALTER TABLE bill_items 
ADD COLUMN IF NOT EXISTS replacement_item_id bigint REFERENCES inventory(id),
ADD COLUMN IF NOT EXISTS replacement_quantity integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS replacement_reason text,
ADD COLUMN IF NOT EXISTS is_replacement boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS replaced_item_id bigint REFERENCES bill_items(id);

-- 2. Add comments to explain the replacement system
COMMENT ON COLUMN bill_items.replacement_item_id IS 'ID of the inventory item used as replacement';
COMMENT ON COLUMN bill_items.replacement_quantity IS 'Quantity of items that were replaced';
COMMENT ON COLUMN bill_items.replacement_reason IS 'Reason for replacement';
COMMENT ON COLUMN bill_items.is_replacement IS 'Whether this bill item is a replacement item';
COMMENT ON COLUMN bill_items.replaced_item_id IS 'ID of the original bill item that was replaced';

-- 3. Make doctor_name optional in prescriptions table
ALTER TABLE prescriptions 
ALTER COLUMN doctor_name DROP NOT NULL;

-- 4. Add default value for doctor_name
ALTER TABLE prescriptions 
ALTER COLUMN doctor_name SET DEFAULT 'Not Specified';

-- 5. Add comment to explain the change
COMMENT ON COLUMN prescriptions.doctor_name IS 'Name of the prescribing doctor (optional)';

-- 6. Update existing records with NULL doctor_name to have default value
UPDATE prescriptions 
SET doctor_name = 'Not Specified' 
WHERE doctor_name IS NULL; 