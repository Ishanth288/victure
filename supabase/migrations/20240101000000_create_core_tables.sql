-- Create core tables that are referenced by other tables
-- This migration must run before the bills table migration

-- Create inventory table
CREATE TABLE IF NOT EXISTS inventory (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT,
  dosage_form TEXT,
  expiry_date DATE,
  generic_name TEXT,
  manufacturer TEXT,
  migration_id TEXT,
  ndc TEXT,
  quantity INTEGER DEFAULT 0,
  reorder_point INTEGER,
  selling_price DECIMAL(10,2),
  status TEXT DEFAULT 'active',
  storage_condition TEXT,
  strength TEXT,
  supplier TEXT,
  unit_cost DECIMAL(10,2),
  unit_size TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create patients table
CREATE TABLE IF NOT EXISTS patients (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  patient_type TEXT,
  status TEXT DEFAULT 'active',
  migration_id TEXT,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create prescriptions table
CREATE TABLE IF NOT EXISTS prescriptions (
  id BIGSERIAL PRIMARY KEY,
  prescription_number TEXT NOT NULL,
  patient_id BIGINT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  doctor_name TEXT,
  date DATE DEFAULT CURRENT_DATE,
  prescription_type TEXT,
  polytherapy BOOLEAN DEFAULT FALSE,
  status TEXT DEFAULT 'active',
  migration_id TEXT,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_inventory_user_id ON inventory(user_id);
CREATE INDEX IF NOT EXISTS idx_inventory_name ON inventory(name);
CREATE INDEX IF NOT EXISTS idx_inventory_category ON inventory(category);
CREATE INDEX IF NOT EXISTS idx_inventory_status ON inventory(status);

CREATE INDEX IF NOT EXISTS idx_patients_user_id ON patients(user_id);
CREATE INDEX IF NOT EXISTS idx_patients_name ON patients(name);
CREATE INDEX IF NOT EXISTS idx_patients_phone ON patients(phone_number);

CREATE INDEX IF NOT EXISTS idx_prescriptions_user_id ON prescriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_patient_id ON prescriptions(patient_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_date ON prescriptions(date);
CREATE INDEX IF NOT EXISTS idx_prescriptions_number ON prescriptions(prescription_number);

-- Enable Row Level Security
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE prescriptions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for inventory (only if they don't exist)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'inventory' AND policyname = 'Users can view their own inventory') THEN
    CREATE POLICY "Users can view their own inventory" ON inventory
      FOR SELECT USING (auth.uid() = user_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'inventory' AND policyname = 'Users can insert their own inventory') THEN
    CREATE POLICY "Users can insert their own inventory" ON inventory
      FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'inventory' AND policyname = 'Users can update their own inventory') THEN
    CREATE POLICY "Users can update their own inventory" ON inventory
      FOR UPDATE USING (auth.uid() = user_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'inventory' AND policyname = 'Users can delete their own inventory') THEN
    CREATE POLICY "Users can delete their own inventory" ON inventory
      FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;

-- Create RLS policies for patients (only if they don't exist)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'patients' AND policyname = 'Users can view their own patients') THEN
    CREATE POLICY "Users can view their own patients" ON patients
      FOR SELECT USING (auth.uid() = user_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'patients' AND policyname = 'Users can insert their own patients') THEN
    CREATE POLICY "Users can insert their own patients" ON patients
      FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'patients' AND policyname = 'Users can update their own patients') THEN
    CREATE POLICY "Users can update their own patients" ON patients
      FOR UPDATE USING (auth.uid() = user_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'patients' AND policyname = 'Users can delete their own patients') THEN
    CREATE POLICY "Users can delete their own patients" ON patients
      FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;

-- Create RLS policies for prescriptions (only if they don't exist)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'prescriptions' AND policyname = 'Users can view their own prescriptions') THEN
    CREATE POLICY "Users can view their own prescriptions" ON prescriptions
      FOR SELECT USING (auth.uid() = user_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'prescriptions' AND policyname = 'Users can insert their own prescriptions') THEN
    CREATE POLICY "Users can insert their own prescriptions" ON prescriptions
      FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'prescriptions' AND policyname = 'Users can update their own prescriptions') THEN
    CREATE POLICY "Users can update their own prescriptions" ON prescriptions
      FOR UPDATE USING (auth.uid() = user_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'prescriptions' AND policyname = 'Users can delete their own prescriptions') THEN
    CREATE POLICY "Users can delete their own prescriptions" ON prescriptions
      FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;

-- Create price_history table
CREATE TABLE IF NOT EXISTS price_history (
  id BIGSERIAL PRIMARY KEY,
  inventory_item_id BIGINT NOT NULL REFERENCES inventory(id) ON DELETE CASCADE,
  previous_cost DECIMAL(10,2) NOT NULL,
  new_cost DECIMAL(10,2) NOT NULL,
  previous_selling_price DECIMAL(10,2),
  new_selling_price DECIMAL(10,2),
  updated_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for price_history
CREATE INDEX IF NOT EXISTS idx_price_history_inventory_item_id ON price_history(inventory_item_id);
CREATE INDEX IF NOT EXISTS idx_price_history_updated_at ON price_history(updated_at);

-- Enable RLS for price_history
ALTER TABLE price_history ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for price_history (only if they don't exist)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'price_history' AND policyname = 'Users can view price history for their inventory') THEN
    CREATE POLICY "Users can view price history for their inventory" ON price_history
      FOR SELECT USING (
        EXISTS (
          SELECT 1 FROM inventory 
          WHERE inventory.id = price_history.inventory_item_id 
          AND inventory.user_id = auth.uid()
        )
      );
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'price_history' AND policyname = 'Users can insert price history for their inventory') THEN
    CREATE POLICY "Users can insert price history for their inventory" ON price_history
      FOR INSERT WITH CHECK (
        EXISTS (
          SELECT 1 FROM inventory 
          WHERE inventory.id = price_history.inventory_item_id 
          AND inventory.user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- Create updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers only if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_inventory_updated_at') THEN
    CREATE TRIGGER update_inventory_updated_at
      BEFORE UPDATE ON inventory
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_prescriptions_updated_at') THEN
    CREATE TRIGGER update_prescriptions_updated_at
      BEFORE UPDATE ON prescriptions
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;