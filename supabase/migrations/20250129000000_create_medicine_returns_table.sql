-- Create medicine_returns table
CREATE TABLE IF NOT EXISTS medicine_returns (
  id BIGSERIAL PRIMARY KEY,
  bill_item_id BIGINT NOT NULL REFERENCES bill_items(id) ON DELETE CASCADE,
  quantity_returned INTEGER NOT NULL CHECK (quantity_returned > 0),
  reason TEXT,
  refund_amount DECIMAL(10,2) NOT NULL CHECK (refund_amount >= 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for medicine_returns
CREATE INDEX IF NOT EXISTS idx_medicine_returns_bill_item_id ON medicine_returns(bill_item_id);
CREATE INDEX IF NOT EXISTS idx_medicine_returns_created_at ON medicine_returns(created_at);

-- Enable RLS for medicine_returns
ALTER TABLE medicine_returns ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for medicine_returns
CREATE POLICY "Users can view their medicine returns" ON medicine_returns
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM bill_items bi
      JOIN bills b ON bi.bill_id = b.id
      WHERE bi.id = medicine_returns.bill_item_id
      AND b.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert medicine returns for their bills" ON medicine_returns
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM bill_items bi
      JOIN bills b ON bi.bill_id = b.id
      WHERE bi.id = medicine_returns.bill_item_id
      AND b.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their medicine returns" ON medicine_returns
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM bill_items bi
      JOIN bills b ON bi.bill_id = b.id
      WHERE bi.id = medicine_returns.bill_item_id
      AND b.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their medicine returns" ON medicine_returns
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM bill_items bi
      JOIN bills b ON bi.bill_id = b.id
      WHERE bi.id = medicine_returns.bill_item_id
      AND b.user_id = auth.uid()
    )
  );

-- Add comments
COMMENT ON TABLE medicine_returns IS 'Tracks medicine returns for bill items';
COMMENT ON COLUMN medicine_returns.bill_item_id IS 'Reference to the bill item being returned';
COMMENT ON COLUMN medicine_returns.quantity_returned IS 'Number of units returned';
COMMENT ON COLUMN medicine_returns.reason IS 'Reason for the return';
COMMENT ON COLUMN medicine_returns.refund_amount IS 'Amount refunded for this return';