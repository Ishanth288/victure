-- SQL Script to Add is_flagged Column to Patients Table
-- Run this in your Supabase Dashboard SQL Editor

-- Step 1: Add the is_flagged column to patients table
ALTER TABLE patients 
ADD COLUMN IF NOT EXISTS is_flagged BOOLEAN DEFAULT FALSE;

-- Step 2: Add a comment to the column for documentation
COMMENT ON COLUMN patients.is_flagged IS 'Flag to mark patients for potential foul play or special attention';

-- Step 3: Create an index for better query performance
CREATE INDEX IF NOT EXISTS idx_patients_is_flagged 
ON patients(is_flagged) 
WHERE is_flagged = TRUE;

-- Step 4: Verify the column was added successfully
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'patients' 
AND column_name = 'is_flagged';

-- Step 5: Check current patients table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'patients'
ORDER BY ordinal_position;

-- Step 6: Test the new column with a sample query
SELECT 
    id,
    name,
    phone_number,
    is_flagged,
    created_at
FROM patients 
LIMIT 5;