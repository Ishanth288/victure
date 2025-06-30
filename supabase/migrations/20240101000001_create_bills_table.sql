-- Drop existing bills table if it exists to recreate with proper structure
DROP TABLE IF EXISTS bills CASCADE;

-- Create bills table with complete structure
CREATE TABLE IF NOT EXISTS bills (
  id BIGSERIAL PRIMARY KEY,
  prescription_id BIGINT REFERENCES prescriptions(id) ON DELETE SET NULL,
  user_id UUID REFERENCES auth.users(id),
  bill_number TEXT NOT NULL,
  subtotal NUMERIC(10,2) NOT NULL,
  gst_amount NUMERIC(10,2) NOT NULL,
  gst_percentage NUMERIC(5,2) NOT NULL,
  discount_amount NUMERIC(10,2),
  total_amount NUMERIC(10,2) NOT NULL,
  status TEXT DEFAULT 'completed',
  date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_bills_prescription_id ON bills(prescription_id);
CREATE INDEX IF NOT EXISTS idx_bills_user_id ON bills(user_id);
CREATE INDEX IF NOT EXISTS idx_bills_date ON bills(date);
CREATE INDEX IF NOT EXISTS idx_bills_created_at ON bills(created_at);

-- Enable RLS
ALTER TABLE bills ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for bills (only if they don't exist)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'bills' AND policyname = 'Users can view their own bills') THEN
    CREATE POLICY "Users can view their own bills" ON bills
      FOR SELECT USING (auth.uid() = user_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'bills' AND policyname = 'Users can insert their own bills') THEN
    CREATE POLICY "Users can insert their own bills" ON bills
      FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'bills' AND policyname = 'Users can update their own bills') THEN
    CREATE POLICY "Users can update their own bills" ON bills
      FOR UPDATE USING (auth.uid() = user_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'bills' AND policyname = 'Users can delete their own bills') THEN
    CREATE POLICY "Users can delete their own bills" ON bills
      FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;

-- Create bill_items table if it doesn't exist
CREATE TABLE IF NOT EXISTS bill_items (
  id BIGSERIAL PRIMARY KEY,
  bill_id BIGINT NOT NULL REFERENCES bills(id) ON DELETE CASCADE,
  inventory_item_id BIGINT NOT NULL REFERENCES inventory(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL,
  unit_price NUMERIC(10,2) NOT NULL,
  total_price NUMERIC(10,2) NOT NULL,
  return_quantity INTEGER DEFAULT 0,
  is_replacement BOOLEAN DEFAULT FALSE,
  replaced_item_id BIGINT REFERENCES bill_items(id) ON DELETE SET NULL,
  replacement_item_id BIGINT REFERENCES inventory(id) ON DELETE SET NULL,
  replacement_quantity INTEGER,
  replacement_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for bill_items
CREATE INDEX IF NOT EXISTS idx_bill_items_bill_id ON bill_items(bill_id);
CREATE INDEX IF NOT EXISTS idx_bill_items_inventory_item_id ON bill_items(inventory_item_id);
CREATE INDEX IF NOT EXISTS idx_bill_items_replaced_item_id ON bill_items(replaced_item_id);
CREATE INDEX IF NOT EXISTS idx_bill_items_replacement_item_id ON bill_items(replacement_item_id);

-- Enable RLS for bill_items
ALTER TABLE bill_items ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for bill_items (only if they don't exist)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'bill_items' AND policyname = 'Users can view their own bill items') THEN
    CREATE POLICY "Users can view their own bill items" ON bill_items
      FOR SELECT USING (
        EXISTS (
          SELECT 1 FROM bills 
          WHERE bills.id = bill_items.bill_id 
          AND bills.user_id = auth.uid()
        )
      );
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'bill_items' AND policyname = 'Users can insert their own bill items') THEN
    CREATE POLICY "Users can insert their own bill items" ON bill_items
      FOR INSERT WITH CHECK (
        EXISTS (
          SELECT 1 FROM bills 
          WHERE bills.id = bill_items.bill_id 
          AND bills.user_id = auth.uid()
        )
      );
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'bill_items' AND policyname = 'Users can update their own bill items') THEN
    CREATE POLICY "Users can update their own bill items" ON bill_items
      FOR UPDATE USING (
        EXISTS (
          SELECT 1 FROM bills 
          WHERE bills.id = bill_items.bill_id 
          AND bills.user_id = auth.uid()
        )
      );
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'bill_items' AND policyname = 'Users can delete their own bill items') THEN
    CREATE POLICY "Users can delete their own bill items" ON bill_items
      FOR DELETE USING (
        EXISTS (
          SELECT 1 FROM bills 
          WHERE bills.id = bill_items.bill_id 
          AND bills.user_id = auth.uid()
        )
      );
  END IF;
END $$;