-- SQL Query to understand the relationship between bills, bill_items, and inventory
-- This query shows how medicine names are retrieved for bill items

-- 1. Basic query to see inventory table structure and sample data
SELECT 
    id,
    name,                    -- This is the correct column name (not medicine_name)
    generic_name,
    manufacturer,
    category,
    dosage_form,
    strength,
    quantity,
    selling_price,
    unit_cost,
    status
FROM inventory 
LIMIT 10;

-- 2. Query to see bill_items and their related inventory information
SELECT 
    bi.id as bill_item_id,
    bi.bill_id,
    bi.inventory_item_id,
    bi.quantity,
    bi.unit_price,
    bi.return_quantity,
    inv.name as medicine_name,        -- Correct column name
    inv.generic_name,
    inv.manufacturer,
    inv.category
FROM bill_items bi
JOIN inventory inv ON bi.inventory_item_id = inv.id
LIMIT 10;

-- 3. Query to see the complete relationship for a specific bill
-- Replace 1 with actual bill ID when testing
SELECT 
    b.id as bill_id,
    b.total_amount,
    b.created_at as bill_date,
    bi.id as bill_item_id,
    bi.quantity,
    bi.unit_price,
    bi.return_quantity,
    inv.name as medicine_name,        -- This is what should be used in the component
    inv.generic_name,
    inv.strength,
    inv.dosage_form,
    (bi.quantity - COALESCE(bi.return_quantity, 0)) as available_for_return
FROM bills b
JOIN bill_items bi ON b.id = bi.bill_id
JOIN inventory inv ON bi.inventory_item_id = inv.id
WHERE b.id = 1  -- Replace with actual bill ID
ORDER BY bi.id;

-- 4. Query to check if there are any medicine_name columns in inventory (should return empty)
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'inventory' 
AND table_schema = 'public'
AND column_name LIKE '%medicine%';

-- 5. Query to see all columns in inventory table
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'inventory' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- ACTUAL INVENTORY TABLE SCHEMA (as of current database):
/*
Column Name          | Data Type                    | Nullable
---------------------|------------------------------|----------
id                   | integer                      | NO
name                 | character varying            | NO
ndc                  | character varying            | YES
manufacturer         | character varying            | YES
dosage_form          | character varying            | YES
unit_size            | character varying            | YES
quantity             | integer                      | NO
unit_cost            | numeric                      | YES
expiry_date          | date                         | YES
supplier             | character varying            | YES
status               | character varying            | NO
generic_name         | character varying            | YES
strength             | character varying            | YES
reorder_point        | integer                      | YES
storage_condition    | character varying            | YES
user_id              | uuid                         | YES
selling_price        | numeric                      | YES
migration_id         | uuid                         | YES
category             | text                         | YES
created_at           | timestamp with time zone     | YES
updated_at           | timestamp with time zone     | YES
*/

-- SUMMARY:
-- The correct column name in the inventory table is 'name', not 'medicine_name'
-- In MedicineReturnDialog.tsx, the query should be:
-- .select("medicine_name, name") should be .select("name")
-- And then use: medicine_name: inventoryData?.name || "Unknown"