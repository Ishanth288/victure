-- Create return_analytics view for easier querying of return data
CREATE OR REPLACE VIEW return_analytics AS
SELECT 
  mr.id,
  mr.bill_item_id,
  mr.quantity_returned,
  mr.refund_amount as return_value,
  mr.reason,
  mr.created_at as return_date,
  bi.bill_id,
  bi.inventory_item_id,
  bi.quantity as original_quantity,
  bi.unit_price,
  i.name as medicine_name,
  b.user_id
FROM medicine_returns mr
JOIN bill_items bi ON mr.bill_item_id = bi.id
JOIN bills b ON bi.bill_id = b.id
JOIN inventory i ON bi.inventory_item_id = i.id;

-- Grant access to the view
GRANT SELECT ON return_analytics TO authenticated;

-- Add RLS policy for the view
CREATE POLICY "Users can view their return analytics" ON return_analytics
  FOR SELECT USING (user_id = auth.uid());

-- Add comment
COMMENT ON VIEW return_analytics IS 'Aggregated view of medicine returns with related bill and inventory information';