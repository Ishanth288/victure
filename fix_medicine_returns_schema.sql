-- Fix medicine_returns table schema to match TypeScript types
-- Run this in Supabase SQL Editor if the table doesn't have the correct columns

-- First, check if the table exists and what columns it has
-- If refund_amount column is missing, add it
ALTER TABLE medicine_returns 
ADD COLUMN IF NOT EXISTS refund_amount DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK (refund_amount >= 0);

-- Ensure all other required columns exist
ALTER TABLE medicine_returns 
ADD COLUMN IF NOT EXISTS status VARCHAR(50) NOT NULL DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'cancelled')),
ADD COLUMN IF NOT EXISTS processed_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS return_date TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- If quantity_returned exists, rename it to quantity
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'medicine_returns' 
               AND column_name = 'quantity_returned') THEN
        ALTER TABLE medicine_returns RENAME COLUMN quantity_returned TO quantity;
    END IF;
END $$;

-- Add quantity column if it doesn't exist
ALTER TABLE medicine_returns 
ADD COLUMN IF NOT EXISTS quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0);

-- Update existing records to have proper values
UPDATE medicine_returns 
SET 
  status = COALESCE(status, 'completed'),
  return_date = COALESCE(return_date, NOW()),
  refund_amount = COALESCE(refund_amount, 0)
WHERE status IS NULL OR return_date IS NULL OR refund_amount IS NULL;

-- Add indexes for the new columns if they don't exist
CREATE INDEX IF NOT EXISTS idx_medicine_returns_status ON medicine_returns(status);
CREATE INDEX IF NOT EXISTS idx_medicine_returns_user_id ON medicine_returns(user_id);
CREATE INDEX IF NOT EXISTS idx_medicine_returns_return_date ON medicine_returns(return_date);

-- Update RLS policies to use user_id if they exist
DROP POLICY IF EXISTS "Users can view their medicine returns" ON medicine_returns;
DROP POLICY IF EXISTS "Users can insert medicine returns for their bills" ON medicine_returns;
DROP POLICY IF EXISTS "Users can update their medicine returns" ON medicine_returns;
DROP POLICY IF EXISTS "Users can delete their medicine returns" ON medicine_returns;

-- Create new RLS policies using user_id
CREATE POLICY "Users can view their medicine returns" ON medicine_returns
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert medicine returns for their bills" ON medicine_returns
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their medicine returns" ON medicine_returns
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete their medicine returns" ON medicine_returns
  FOR DELETE USING (user_id = auth.uid());

SELECT 'Medicine returns table schema fixed successfully!' as result;