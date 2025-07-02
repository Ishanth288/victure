-- Add flag functionality to patients table
-- This allows marking patients for potential foul play

ALTER TABLE patients 
ADD COLUMN is_flagged BOOLEAN DEFAULT FALSE;

-- Add index for flagged patients for better performance
CREATE INDEX IF NOT EXISTS idx_patients_flagged ON patients(is_flagged) WHERE is_flagged = TRUE;

-- Add comment to document the purpose
COMMENT ON COLUMN patients.is_flagged IS 'Flag to mark patients for potential foul play or suspicious activity';