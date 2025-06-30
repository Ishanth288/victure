-- Create a view to join bills and bill_items for Supabase relationship cache
CREATE OR REPLACE VIEW bills_with_items AS
SELECT 
  b.*, 
  bi.id AS bill_item_id,
  bi.inventory_item_id,
  bi.quantity,
  bi.unit_price,
  bi.total_price,
  bi.return_quantity
FROM bills b
LEFT JOIN bill_items bi ON bi.bill_id = b.id;