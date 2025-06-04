-- Get complete database structure and foreign key relationships
-- Run this in Supabase SQL Editor to understand all table dependencies

-- 1. Get all tables and their columns
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
ORDER BY table_name, ordinal_position;

-- 2. Get all foreign key constraints
SELECT 
    tc.table_name as table_name,
    kcu.column_name as column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    tc.constraint_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_schema = 'public'
ORDER BY tc.table_name, kcu.column_name;

-- 3. Get table dependencies (what references what)
SELECT DISTINCT
    kcu1.table_name as child_table,
    kcu2.table_name as parent_table,
    kcu1.column_name as child_column,
    kcu2.column_name as parent_column
FROM information_schema.referential_constraints AS rc
JOIN information_schema.key_column_usage AS kcu1
    ON kcu1.constraint_name = rc.constraint_name
JOIN information_schema.key_column_usage AS kcu2
    ON kcu2.constraint_name = rc.unique_constraint_name
WHERE kcu1.table_schema = 'public'
ORDER BY parent_table, child_table;

-- 4. Quick check - show actual contaminated data
SELECT 'PATIENTS' as table_name, id::text, name, phone_number 
FROM patients 
WHERE name IN ('raju', 'Raju') OR phone_number = '7982121456'
UNION ALL
SELECT 'PRESCRIPTIONS' as table_name, id::text, doctor_name, patient_id::text 
FROM prescriptions 
WHERE doctor_name IN ('Dr. Tim George', 'Tim George') OR patient_id IN (
    SELECT id FROM patients WHERE name IN ('raju', 'Raju') OR phone_number = '7982121456'
); 