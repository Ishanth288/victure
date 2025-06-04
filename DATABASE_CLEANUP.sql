-- 🚨 EMERGENCY DATABASE CLEANUP - HARDCODED VALUES
-- Run these commands in your Supabase SQL Editor to remove contaminated data

-- 1. Find and delete all prescriptions with hardcoded doctor name
DELETE FROM prescriptions 
WHERE doctor_name = 'Dr. Tim George' 
OR doctor_name = 'Tim George';

-- 2. Find and delete all patients with hardcoded data
DELETE FROM patients 
WHERE name = 'raju' 
OR name = 'Raju' 
OR phone_number = '7982121456';

-- 3. Clean up any bills associated with these patients/prescriptions
DELETE FROM bills 
WHERE prescription_id IN (
  SELECT id FROM prescriptions 
  WHERE doctor_name IN ('Dr. Tim George', 'Tim George')
);

-- 4. Clean up bill_items for deleted bills
DELETE FROM bill_items 
WHERE bill_id IN (
  SELECT id FROM bills 
  WHERE prescription_id IN (
    SELECT id FROM prescriptions 
    WHERE doctor_name IN ('Dr. Tim George', 'Tim George')
  )
);

-- 5. Verify cleanup - these should return 0 rows
SELECT * FROM patients WHERE name IN ('raju', 'Raju') OR phone_number = '7982121456';
SELECT * FROM prescriptions WHERE doctor_name IN ('Dr. Tim George', 'Tim George');

-- 6. Optional: Reset auto-increment sequences (if needed)
-- This ensures new records start with clean IDs
SELECT setval('patients_id_seq', COALESCE((SELECT MAX(id) FROM patients), 1));
SELECT setval('prescriptions_id_seq', COALESCE((SELECT MAX(id) FROM prescriptions), 1));
SELECT setval('bills_id_seq', COALESCE((SELECT MAX(id) FROM bills), 1)); 