-- Script to identify and clean up zero-valued bills
-- First, let's see how many zero-valued bills exist
SELECT COUNT(*) as zero_value_bills_count 
FROM bills 
WHERE total_amount <= 0;

-- Show details of zero-valued bills
SELECT 
    id,
    bill_number,
    total_amount,
    date,
    status,
    prescription_id,
    created_at
FROM bills 
WHERE total_amount <= 0
ORDER BY created_at DESC;

-- Check if these bills have associated bill_items
SELECT 
    b.id as bill_id,
    b.bill_number,
    b.total_amount,
    COUNT(bi.id) as item_count
FROM bills b
LEFT JOIN bill_items bi ON b.id = bi.bill_id
WHERE b.total_amount <= 0
GROUP BY b.id, b.bill_number, b.total_amount
ORDER BY b.created_at DESC;

-- CAUTION: Uncomment the following lines ONLY after reviewing the above queries
-- and confirming that these zero-valued bills should be deleted

-- Delete bill_items for zero-valued bills first (to maintain referential integrity)
-- DELETE FROM bill_items 
-- WHERE bill_id IN (
--     SELECT id FROM bills WHERE total_amount <= 0
-- );

-- Delete the zero-valued bills
-- DELETE FROM bills 
-- WHERE total_amount <= 0;

-- Verify cleanup
-- SELECT COUNT(*) as remaining_zero_value_bills 
-- FROM bills 
-- WHERE total_amount <= 0;