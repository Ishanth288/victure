-- Priority 2 Security Implementation: Row Level Security (RLS) Policies
-- This migration implements comprehensive RLS policies for all tables

-- Enable RLS on all core tables
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE bill_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE medicine_returns ENABLE ROW LEVEL SECURITY;
ALTER TABLE deletion_history ENABLE ROW LEVEL SECURITY;

-- Patients table RLS policies
CREATE POLICY "Users can only see their own patients" ON patients
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can only insert patients for themselves" ON patients
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can only update their own patients" ON patients
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can only delete their own patients" ON patients
  FOR DELETE USING (auth.uid() = user_id);

-- Prescriptions table RLS policies
CREATE POLICY "Users can only see their own prescriptions" ON prescriptions
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can only insert prescriptions for themselves" ON prescriptions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can only update their own prescriptions" ON prescriptions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can only delete their own prescriptions" ON prescriptions
  FOR DELETE USING (auth.uid() = user_id);

-- Bills table RLS policies
CREATE POLICY "Users can only see their own bills" ON bills
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can only insert bills for themselves" ON bills
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can only update their own bills" ON bills
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can only delete their own bills" ON bills
  FOR DELETE USING (auth.uid() = user_id);

-- Bill items table RLS policies
CREATE POLICY "Users can only see their own bill items" ON bill_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM bills 
      WHERE bills.id = bill_items.bill_id 
      AND bills.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can only insert bill items for their own bills" ON bill_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM bills 
      WHERE bills.id = bill_items.bill_id 
      AND bills.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can only update their own bill items" ON bill_items
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM bills 
      WHERE bills.id = bill_items.bill_id 
      AND bills.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can only delete their own bill items" ON bill_items
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM bills 
      WHERE bills.id = bill_items.bill_id 
      AND bills.user_id = auth.uid()
    )
  );

-- Inventory table RLS policies
CREATE POLICY "Users can only see their own inventory" ON inventory
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can only insert inventory for themselves" ON inventory
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can only update their own inventory" ON inventory
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can only delete their own inventory" ON inventory
  FOR DELETE USING (auth.uid() = user_id);

-- Purchases table RLS policies
CREATE POLICY "Users can only see their own purchases" ON purchases
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can only insert purchases for themselves" ON purchases
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can only update their own purchases" ON purchases
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can only delete their own purchases" ON purchases
  FOR DELETE USING (auth.uid() = user_id);

-- Purchase items table RLS policies
CREATE POLICY "Users can only see their own purchase items" ON purchase_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM purchases 
      WHERE purchases.id = purchase_items.purchase_id 
      AND purchases.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can only insert purchase items for their own purchases" ON purchase_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM purchases 
      WHERE purchases.id = purchase_items.purchase_id 
      AND purchases.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can only update their own purchase items" ON purchase_items
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM purchases 
      WHERE purchases.id = purchase_items.purchase_id 
      AND purchases.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can only delete their own purchase items" ON purchase_items
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM purchases 
      WHERE purchases.id = purchase_items.purchase_id 
      AND purchases.user_id = auth.uid()
    )
  );

-- Medicine returns table RLS policies
CREATE POLICY "Users can only see their own medicine returns" ON medicine_returns
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can only insert medicine returns for themselves" ON medicine_returns
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can only update their own medicine returns" ON medicine_returns
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can only delete their own medicine returns" ON medicine_returns
  FOR DELETE USING (auth.uid() = user_id);

-- Deletion history table RLS policies
CREATE POLICY "Users can only see their own deletion history" ON deletion_history
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can only insert deletion history for themselves" ON deletion_history
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create security monitoring function
CREATE OR REPLACE FUNCTION log_security_event(
  event_type TEXT,
  table_name TEXT,
  record_id UUID DEFAULT NULL,
  details JSONB DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO deletion_history (
    user_id,
    table_name,
    record_id,
    deleted_data,
    deleted_at
  ) VALUES (
    auth.uid(),
    CONCAT('SECURITY_', event_type, '_', table_name),
    record_id,
    COALESCE(details, '{}'::jsonb),
    NOW()
  );
END;
$$;

-- Create function to check for suspicious activity
CREATE OR REPLACE FUNCTION check_suspicious_activity()
RETURNS TABLE(
  user_id UUID,
  suspicious_events INTEGER,
  last_event TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    dh.user_id,
    COUNT(*)::INTEGER as suspicious_events,
    MAX(dh.deleted_at) as last_event
  FROM deletion_history dh
  WHERE dh.table_name LIKE 'SECURITY_%'
    AND dh.deleted_at > NOW() - INTERVAL '1 hour'
  GROUP BY dh.user_id
  HAVING COUNT(*) > 10;
END;
$$;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION log_security_event TO authenticated;
GRANT EXECUTE ON FUNCTION check_suspicious_activity TO authenticated;

-- Add comments for documentation
COMMENT ON FUNCTION log_security_event IS 'Logs security events for monitoring and auditing purposes';
COMMENT ON FUNCTION check_suspicious_activity IS 'Identifies users with suspicious activity patterns';

-- Create indexes for better performance on RLS policies
CREATE INDEX IF NOT EXISTS idx_patients_user_id ON patients(user_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_user_id ON prescriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_bills_user_id ON bills(user_id);
CREATE INDEX IF NOT EXISTS idx_inventory_user_id ON inventory(user_id);
CREATE INDEX IF NOT EXISTS idx_purchases_user_id ON purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_medicine_returns_user_id ON medicine_returns(user_id);
CREATE INDEX IF NOT EXISTS idx_deletion_history_user_id ON deletion_history(user_id);
CREATE INDEX IF NOT EXISTS idx_deletion_history_table_name ON deletion_history(table_name);
CREATE INDEX IF NOT EXISTS idx_deletion_history_deleted_at ON deletion_history(deleted_at);