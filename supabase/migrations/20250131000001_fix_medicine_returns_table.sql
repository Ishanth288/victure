-- Fix medicine_returns table to match the expected schema
-- Add missing fields that the application code expects

ALTER TABLE medicine_returns 
ADD COLUMN IF NOT EXISTS status VARCHAR(50) NOT NULL DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'cancelled')),
ADD COLUMN IF NOT EXISTS processed_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS return_date TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Rename quantity_returned to quantity to match the expected schema
ALTER TABLE medicine_returns 
RENAME COLUMN quantity_returned TO quantity;

-- Update existing records to have proper values
UPDATE medicine_returns 
SET 
  status = 'completed',
  return_date = created_at
WHERE status IS NULL OR return_date IS NULL;

-- Add indexes for the new columns
CREATE INDEX IF NOT EXISTS idx_medicine_returns_status ON medicine_returns(status);
CREATE INDEX IF NOT EXISTS idx_medicine_returns_processed_by ON medicine_returns(processed_by);
CREATE INDEX IF NOT EXISTS idx_medicine_returns_user_id ON medicine_returns(user_id);
CREATE INDEX IF NOT EXISTS idx_medicine_returns_return_date ON medicine_returns(return_date);

-- Update RLS policies to use user_id field
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

-- Update comments
COMMENT ON COLUMN medicine_returns.status IS 'Status of the return: pending, completed, or cancelled';
COMMENT ON COLUMN medicine_returns.processed_by IS 'User who processed the return';
COMMENT ON COLUMN medicine_returns.user_id IS 'User who owns this return record';
COMMENT ON COLUMN medicine_returns.return_date IS 'Date when the return was processed';
COMMENT ON COLUMN medicine_returns.quantity IS 'Number of units returned';