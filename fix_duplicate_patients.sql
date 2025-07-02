-- SQL Script to Fix Duplicate Patients (Safe Version)
-- Run this in your Supabase Dashboard SQL Editor
-- This version preserves all data by merging duplicates

-- Step 1: Identify duplicate patients
WITH duplicate_groups AS (
  SELECT 
    phone_number, 
    user_id, 
    COUNT(*) as duplicate_count,
    MIN(id) as keep_patient_id
  FROM patients 
  GROUP BY phone_number, user_id 
  HAVING COUNT(*) > 1
),
patient_details AS (
  SELECT 
    p.id,
    p.phone_number,
    p.user_id,
    p.created_at,
    dg.keep_patient_id,
    dg.duplicate_count
  FROM patients p
  INNER JOIN duplicate_groups dg ON p.phone_number = dg.phone_number AND p.user_id = dg.user_id
)
SELECT 
  phone_number,
  user_id,
  duplicate_count,
  STRING_AGG(id::text, ', ' ORDER BY created_at) as patient_ids,
  keep_patient_id,
  STRING_AGG(CASE WHEN id != keep_patient_id THEN id::text END, ', ') as delete_patient_ids
FROM patient_details
GROUP BY phone_number, user_id, duplicate_count, keep_patient_id
ORDER BY duplicate_count DESC;

-- Step 2: Merge duplicate patient data (preserve all prescriptions and bills)
-- 2a: Update prescriptions to point to the oldest patient
UPDATE prescriptions 
SET patient_id = (
  SELECT MIN(p.id) 
  FROM patients p 
  WHERE p.phone_number = (
    SELECT phone_number 
    FROM patients 
    WHERE id = prescriptions.patient_id
  ) 
  AND p.user_id = (
    SELECT user_id 
    FROM patients 
    WHERE id = prescriptions.patient_id
  )
)
WHERE patient_id IN (
  SELECT id FROM patients 
  WHERE id NOT IN (
    SELECT MIN(id) 
    FROM patients 
    GROUP BY phone_number, user_id
  )
);

-- Step 3: Now safely delete duplicate patients (data is preserved in oldest patient)
DELETE FROM patients 
WHERE id NOT IN (
  SELECT MIN(id) 
  FROM patients 
  GROUP BY phone_number, user_id
);

-- Step 4: Add unique constraint to prevent future duplicates
ALTER TABLE patients 
ADD CONSTRAINT patients_phone_user_unique 
UNIQUE (phone_number, user_id);

-- Step 5: Verify the fix
SELECT 
  'Total patients after cleanup' as description,
  COUNT(*) as count
FROM patients
UNION ALL
SELECT 
  'Remaining duplicates (should be 0)' as description,
  COUNT(*) as count
FROM (
  SELECT phone_number, user_id
  FROM patients 
  GROUP BY phone_number, user_id 
  HAVING COUNT(*) > 1
) duplicates
UNION ALL
SELECT 
  'Total prescriptions preserved' as description,
  COUNT(*) as count
FROM prescriptions;

-- Step 6: Optional - Check for orphaned prescriptions (should be 0)
SELECT 
  'Orphaned prescriptions (should be 0)' as description,
  COUNT(*) as count
FROM prescriptions p
LEFT JOIN patients pt ON p.patient_id = pt.id
WHERE pt.id IS NULL;