-- 🚨 COMPREHENSIVE DATABASE CLEANUP - ALL CONTAMINATED RECORDS
-- Based on complete database structure analysis
-- CRITICAL: Deletes in correct dependency order to avoid foreign key violations

-- =================================================================
-- STEP 1: IDENTIFY ALL CONTAMINATED RECORDS
-- =================================================================

-- Show contaminated patients (31+ records)
SELECT 'CONTAMINATED PATIENTS' as record_type, COUNT(*) as count, 
       string_agg(id::text, ', ' ORDER BY id) as ids
FROM patients 
WHERE phone_number = '7982121456' OR name IN ('raju', 'Raju', 'Andrew', 'An', 'a');

-- Show contaminated prescriptions 
SELECT 'CONTAMINATED PRESCRIPTIONS' as record_type, COUNT(*) as count,
       string_agg(id::text, ', ' ORDER BY id) as ids  
FROM prescriptions 
WHERE doctor_name IN ('Dr. Tim George', 'Tim George') OR patient_id IN (
    SELECT id FROM patients WHERE phone_number = '7982121456' OR name IN ('raju', 'Raju', 'Andrew', 'An', 'a')
);

-- =================================================================
-- STEP 2: DELETE IN CORRECT DEPENDENCY ORDER
-- =================================================================

-- 2.1: Delete medicine_returns (references bill_items)
DELETE FROM medicine_returns 
WHERE bill_item_id IN (
    SELECT bi.id FROM bill_items bi
    JOIN bills b ON bi.bill_id = b.id
    JOIN prescriptions p ON b.prescription_id = p.id
    JOIN patients pt ON p.patient_id = pt.id
    WHERE pt.phone_number = '7982121456' 
       OR pt.name IN ('raju', 'Raju', 'Andrew', 'An', 'a')
       OR p.doctor_name IN ('Dr. Tim George', 'Tim George')
);

-- 2.2: Delete bill_items (references bills and inventory)
-- Handle self-references first by setting replaced_item_id to NULL
UPDATE bill_items SET replaced_item_id = NULL 
WHERE bill_id IN (
    SELECT b.id FROM bills b
    JOIN prescriptions p ON b.prescription_id = p.id
    JOIN patients pt ON p.patient_id = pt.id
    WHERE pt.phone_number = '7982121456' 
       OR pt.name IN ('raju', 'Raju', 'Andrew', 'An', 'a')
       OR p.doctor_name IN ('Dr. Tim George', 'Tim George')
);

-- Now delete bill_items
DELETE FROM bill_items 
WHERE bill_id IN (
    SELECT b.id FROM bills b
    JOIN prescriptions p ON b.prescription_id = p.id
    JOIN patients pt ON p.patient_id = pt.id
    WHERE pt.phone_number = '7982121456' 
       OR pt.name IN ('raju', 'Raju', 'Andrew', 'An', 'a')
       OR p.doctor_name IN ('Dr. Tim George', 'Tim George')
);

-- 2.3: Delete bills (references prescriptions)
DELETE FROM bills 
WHERE prescription_id IN (
    SELECT p.id FROM prescriptions p
    JOIN patients pt ON p.patient_id = pt.id
    WHERE pt.phone_number = '7982121456' 
       OR pt.name IN ('raju', 'Raju', 'Andrew', 'An', 'a')
       OR p.doctor_name IN ('Dr. Tim George', 'Tim George')
);

-- 2.4: Delete prescriptions (references patients)  
DELETE FROM prescriptions 
WHERE doctor_name IN ('Dr. Tim George', 'Tim George')
   OR patient_id IN (
       SELECT id FROM patients 
       WHERE phone_number = '7982121456' 
          OR name IN ('raju', 'Raju', 'Andrew', 'An', 'a')
   );

-- 2.5: Delete patients (top of dependency chain)
DELETE FROM patients 
WHERE phone_number = '7982121456' 
   OR name IN ('raju', 'Raju', 'Andrew', 'An', 'a');

-- =================================================================
-- STEP 3: VERIFICATION - CHECK CLEANUP SUCCESS
-- =================================================================

-- Should all return 0 rows
SELECT 'REMAINING CONTAMINATED PATIENTS' as check_type, COUNT(*) as count
FROM patients 
WHERE phone_number = '7982121456' OR name IN ('raju', 'Raju', 'Andrew', 'An', 'a');

SELECT 'REMAINING CONTAMINATED PRESCRIPTIONS' as check_type, COUNT(*) as count
FROM prescriptions 
WHERE doctor_name IN ('Dr. Tim George', 'Tim George');

-- =================================================================
-- STEP 4: SHOW CLEAN DATA SUMMARY  
-- =================================================================

SELECT 'CLEAN PATIENTS' as data_type, COUNT(*) as count FROM patients;
SELECT 'CLEAN PRESCRIPTIONS' as data_type, COUNT(*) as count FROM prescriptions;
SELECT 'CLEAN BILLS' as data_type, COUNT(*) as count FROM bills;
SELECT 'CLEAN BILL_ITEMS' as data_type, COUNT(*) as count FROM bill_items;
SELECT 'CLEAN MEDICINE_RETURNS' as data_type, COUNT(*) as count FROM medicine_returns;

-- =================================================================
-- STEP 5: OPTIONAL - RESET SEQUENCES FOR CLEAN IDS
-- =================================================================

SELECT setval('patients_id_seq', COALESCE((SELECT MAX(id) FROM patients), 1));
SELECT setval('prescriptions_id_seq', COALESCE((SELECT MAX(id) FROM prescriptions), 1));
SELECT setval('bills_id_seq', COALESCE((SELECT MAX(id) FROM bills), 1));
SELECT setval('bill_items_id_seq', COALESCE((SELECT MAX(id) FROM bill_items), 1));
SELECT setval('medicine_returns_id_seq', COALESCE((SELECT MAX(id) FROM medicine_returns), 1));

-- =================================================================
-- ✅ CLEANUP COMPLETE!
-- Your database should now be free of all contaminated records.
-- ================================================================= 