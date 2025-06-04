-- 🚨 EMERGENCY DATABASE CLEANUP - FIXED ORDER
-- Run these commands in your Supabase SQL Editor to remove contaminated data
-- CRITICAL: Must delete in correct order to avoid foreign key violations

-- Step 1: Find IDs of contaminated records first
-- This helps us identify what needs to be deleted

-- Find contaminated patient IDs
SELECT id, name, phone_number FROM patients 
WHERE name IN ('raju', 'Raju') OR phone_number = '7982121456';

-- Find contaminated prescription IDs  
SELECT id, prescription_number, doctor_name, patient_id FROM prescriptions 
WHERE doctor_name IN ('Dr. Tim George', 'Tim George');

-- Step 2: Delete in correct order (bottom-up in dependency chain)

-- 2a. First delete medicine_returns (references bill_items)
DELETE FROM medicine_returns 
WHERE bill_item_id IN (
  SELECT bill_items.id FROM bill_items 
  JOIN bills ON bill_items.bill_id = bills.id
  JOIN prescriptions ON bills.prescription_id = prescriptions.id
  WHERE prescriptions.doctor_name IN ('Dr. Tim George', 'Tim George')
);

-- 2b. Then delete bill_items (references bills)
DELETE FROM bill_items 
WHERE bill_id IN (
  SELECT bills.id FROM bills 
  JOIN prescriptions ON bills.prescription_id = prescriptions.id
  WHERE prescriptions.doctor_name IN ('Dr. Tim George', 'Tim George')
);

-- 2c. Then delete bills (references prescriptions)
DELETE FROM bills 
WHERE prescription_id IN (
  SELECT id FROM prescriptions 
  WHERE doctor_name IN ('Dr. Tim George', 'Tim George')
);

-- 2d. Then delete prescriptions (references patients)
DELETE FROM prescriptions 
WHERE doctor_name IN ('Dr. Tim George', 'Tim George');

-- 2e. Finally delete patients (top of dependency chain)
DELETE FROM patients 
WHERE name IN ('raju', 'Raju') OR phone_number = '7982121456';

-- Step 3: Also clean up any remaining references to contaminated patients
-- Delete medicine_returns for contaminated patients (if any remain)
DELETE FROM medicine_returns 
WHERE bill_item_id IN (
  SELECT bill_items.id FROM bill_items 
  JOIN bills ON bill_items.bill_id = bills.id
  JOIN prescriptions ON bills.prescription_id = prescriptions.id
  JOIN patients ON prescriptions.patient_id = patients.id
  WHERE patients.name IN ('raju', 'Raju') OR patients.phone_number = '7982121456'
);

-- Delete bill_items for contaminated patients (if any remain)
DELETE FROM bill_items 
WHERE bill_id IN (
  SELECT bills.id FROM bills 
  JOIN prescriptions ON bills.prescription_id = prescriptions.id
  JOIN patients ON prescriptions.patient_id = patients.id
  WHERE patients.name IN ('raju', 'Raju') OR patients.phone_number = '7982121456'
);

-- Delete bills for contaminated patients (if any remain)
DELETE FROM bills 
WHERE prescription_id IN (
  SELECT prescriptions.id FROM prescriptions 
  JOIN patients ON prescriptions.patient_id = patients.id
  WHERE patients.name IN ('raju', 'Raju') OR patients.phone_number = '7982121456'
);

-- Step 4: Verify cleanup - these should return 0 rows
SELECT 'CONTAMINATED PATIENTS:' AS check_type, COUNT(*) as remaining_count 
FROM patients WHERE name IN ('raju', 'Raju') OR phone_number = '7982121456';

SELECT 'CONTAMINATED PRESCRIPTIONS:' AS check_type, COUNT(*) as remaining_count 
FROM prescriptions WHERE doctor_name IN ('Dr. Tim George', 'Tim George');

-- Step 5: Show remaining clean data (should only show your real data)
SELECT 'CLEAN PATIENTS:' AS data_type, COUNT(*) as count FROM patients;
SELECT 'CLEAN PRESCRIPTIONS:' AS data_type, COUNT(*) as count FROM prescriptions;
SELECT 'CLEAN BILLS:' AS data_type, COUNT(*) as count FROM bills;

-- Step 6: Optional - Reset sequences for clean IDs
SELECT setval('patients_id_seq', COALESCE((SELECT MAX(id) FROM patients), 1));
SELECT setval('prescriptions_id_seq', COALESCE((SELECT MAX(id) FROM prescriptions), 1)); 
SELECT setval('bills_id_seq', COALESCE((SELECT MAX(id) FROM bills), 1)); 