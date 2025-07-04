-- Fix bills table date column to store timestamp with timezone
-- This resolves the issue where all bills show 5:30 time

ALTER TABLE bills 
ALTER COLUMN date TYPE TIMESTAMP WITH TIME ZONE 
USING date::timestamp + INTERVAL '0 hours';

-- Set default to current timestamp instead of just current date
ALTER TABLE bills 
ALTER COLUMN date SET DEFAULT NOW();

-- Update existing bills to have proper timestamps
-- This will set the time to current timestamp for existing date-only records
UPDATE bills 
SET date = CURRENT_TIMESTAMP 
WHERE EXTRACT(hour FROM date) = 0 AND EXTRACT(minute FROM date) = 0 AND EXTRACT(second FROM date) = 0;