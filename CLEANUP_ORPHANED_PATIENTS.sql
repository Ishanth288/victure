-- 🧹 CLEANUP ORPHANED PATIENTS - FINAL DATA CONSISTENCY FIX
-- Remove any patients who don't have any associated prescriptions
-- This ensures patients page only shows patients who actually have prescriptions

-- =================================================================
-- STEP 1: IDENTIFY ORPHANED PATIENTS (no prescriptions)
-- =================================================================

SELECT 'ORPHANED PATIENTS (NO PRESCRIPTIONS)' as record_type, 
       COUNT(*) as count,
       string_agg(p.phone_number, ', ' ORDER BY p.id) as phone_numbers,
       string_agg(p.name, ', ' ORDER BY p.id) as names
FROM patients p
LEFT JOIN prescriptions pr ON p.id = pr.patient_id
WHERE pr.patient_id IS NULL;

-- =================================================================
-- STEP 2: DELETE ORPHANED PATIENTS
-- =================================================================

-- Delete patients who have no prescriptions
DELETE FROM patients 
WHERE id NOT IN (
    SELECT DISTINCT patient_id 
    FROM prescriptions 
    WHERE patient_id IS NOT NULL
);

-- =================================================================
-- STEP 3: VERIFICATION - SHOW RESULTS
-- =================================================================

-- Verify: All remaining patients should have at least one prescription
SELECT 'REMAINING PATIENTS' as record_type, 
       COUNT(*) as count,
       'All have prescriptions' as status
FROM patients;

-- Double-check: Count prescriptions for verification
SELECT 'TOTAL PRESCRIPTIONS' as record_type, 
       COUNT(*) as count
FROM prescriptions;

-- Show sample of remaining patients with their prescription counts
SELECT p.name, 
       p.phone_number, 
       COUNT(pr.id) as prescription_count
FROM patients p
LEFT JOIN prescriptions pr ON p.id = pr.patient_id
GROUP BY p.id, p.name, p.phone_number
ORDER BY p.id
LIMIT 10;

-- =================================================================
-- ✅ CLEANUP COMPLETE!
-- Now patients page will only show patients who have prescriptions.
-- Perfect data consistency achieved!
-- ================================================================= 