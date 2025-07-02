-- Add unique constraint to prevent duplicate patients
-- This ensures one patient per phone number per user

-- First, let's identify and remove any existing duplicates
-- Keep the oldest record for each phone_number + user_id combination
DELETE FROM patients 
WHERE id NOT IN (
  SELECT MIN(id) 
  FROM patients 
  GROUP BY phone_number, user_id
);

-- Add unique constraint to prevent future duplicates
ALTER TABLE patients 
ADD CONSTRAINT patients_phone_user_unique 
UNIQUE (phone_number, user_id);

-- Add comment for documentation
COMMENT ON CONSTRAINT patients_phone_user_unique ON patients IS 
'Ensures each phone number is unique per user to prevent duplicate patient records';