-- =====================================================
-- COMPREHENSIVE DATABASE RECOVERY SCRIPT
-- Based on actual database structure analysis
-- =====================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- PRESCRIPTIONS TABLE UPDATES
-- =====================================================

-- Add missing timestamp columns to prescriptions
ALTER TABLE public.prescriptions 
ADD COLUMN IF NOT EXISTS created_at timestamp with time zone DEFAULT timezone('utc'::text, now());

ALTER TABLE public.prescriptions 
ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT timezone('utc'::text, now());

-- =====================================================
-- INVENTORY TABLE UPDATES  
-- =====================================================

-- Add missing timestamp columns to inventory
ALTER TABLE public.inventory 
ADD COLUMN IF NOT EXISTS created_at timestamp with time zone DEFAULT now();

ALTER TABLE public.inventory 
ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now();

-- =====================================================
-- TRIGGER FUNCTION FOR UPDATED_AT
-- =====================================================

-- Create or replace the trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- =====================================================
-- APPLY TRIGGERS TO TABLES
-- =====================================================

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS update_prescriptions_updated_at ON public.prescriptions;
DROP TRIGGER IF EXISTS update_inventory_updated_at ON public.inventory;
DROP TRIGGER IF EXISTS update_bills_updated_at ON public.bills;

-- Create triggers for updated_at columns
CREATE TRIGGER update_prescriptions_updated_at
    BEFORE UPDATE ON public.prescriptions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_inventory_updated_at
    BEFORE UPDATE ON public.inventory
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bills_updated_at
    BEFORE UPDATE ON public.bills
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- BILLS TABLE ENHANCEMENTS
-- =====================================================

-- Ensure bills table has unique constraint on bill_number
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'bills_bill_number_unique'
    ) THEN
        ALTER TABLE public.bills 
        ADD CONSTRAINT bills_bill_number_unique UNIQUE (bill_number);
    END IF;
END $$;

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_prescriptions_user_id ON public.prescriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_patient_id ON public.prescriptions(patient_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_date ON public.prescriptions(date);
CREATE INDEX IF NOT EXISTS idx_prescriptions_status ON public.prescriptions(status);

CREATE INDEX IF NOT EXISTS idx_bills_user_id ON public.bills(user_id);
CREATE INDEX IF NOT EXISTS idx_bills_prescription_id ON public.bills(prescription_id);
CREATE INDEX IF NOT EXISTS idx_bills_date ON public.bills(date);
CREATE INDEX IF NOT EXISTS idx_bills_status ON public.bills(status);

CREATE INDEX IF NOT EXISTS idx_bill_items_bill_id ON public.bill_items(bill_id);
CREATE INDEX IF NOT EXISTS idx_bill_items_inventory_item_id ON public.bill_items(inventory_item_id);

CREATE INDEX IF NOT EXISTS idx_inventory_user_id ON public.inventory(user_id);
CREATE INDEX IF NOT EXISTS idx_inventory_name ON public.inventory(name);
CREATE INDEX IF NOT EXISTS idx_inventory_status ON public.inventory(status);

CREATE INDEX IF NOT EXISTS idx_patients_user_id ON public.patients(user_id);
CREATE INDEX IF NOT EXISTS idx_patients_phone_number ON public.patients(phone_number);

-- =====================================================
-- ROW LEVEL SECURITY (RLS) SETUP
-- =====================================================

-- Enable RLS on all user-specific tables
ALTER TABLE public.prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bill_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- RLS POLICIES FOR PRESCRIPTIONS
-- =====================================================

-- Drop existing policies
DROP POLICY IF EXISTS prescriptions_user_policy ON public.prescriptions;
DROP POLICY IF EXISTS prescriptions_insert_policy ON public.prescriptions;
DROP POLICY IF EXISTS prescriptions_update_policy ON public.prescriptions;
DROP POLICY IF EXISTS prescriptions_delete_policy ON public.prescriptions;

-- Create comprehensive RLS policies for prescriptions
CREATE POLICY prescriptions_user_policy ON public.prescriptions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY prescriptions_insert_policy ON public.prescriptions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY prescriptions_update_policy ON public.prescriptions
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY prescriptions_delete_policy ON public.prescriptions
    FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- RLS POLICIES FOR BILLS
-- =====================================================

-- Drop existing policies
DROP POLICY IF EXISTS bills_user_policy ON public.bills;
DROP POLICY IF EXISTS bills_insert_policy ON public.bills;
DROP POLICY IF EXISTS bills_update_policy ON public.bills;
DROP POLICY IF EXISTS bills_delete_policy ON public.bills;

-- Create comprehensive RLS policies for bills
CREATE POLICY bills_user_policy ON public.bills
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY bills_insert_policy ON public.bills
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY bills_update_policy ON public.bills
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY bills_delete_policy ON public.bills
    FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- RLS POLICIES FOR BILL_ITEMS
-- =====================================================

-- Drop existing policies
DROP POLICY IF EXISTS bill_items_user_policy ON public.bill_items;
DROP POLICY IF EXISTS bill_items_insert_policy ON public.bill_items;
DROP POLICY IF EXISTS bill_items_update_policy ON public.bill_items;
DROP POLICY IF EXISTS bill_items_delete_policy ON public.bill_items;

-- Create comprehensive RLS policies for bill_items
CREATE POLICY bill_items_user_policy ON public.bill_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.bills 
            WHERE bills.id = bill_items.bill_id 
            AND bills.user_id = auth.uid()
        )
    );

CREATE POLICY bill_items_insert_policy ON public.bill_items
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.bills 
            WHERE bills.id = bill_items.bill_id 
            AND bills.user_id = auth.uid()
        )
    );

CREATE POLICY bill_items_update_policy ON public.bill_items
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.bills 
            WHERE bills.id = bill_items.bill_id 
            AND bills.user_id = auth.uid()
        )
    );

CREATE POLICY bill_items_delete_policy ON public.bill_items
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.bills 
            WHERE bills.id = bill_items.bill_id 
            AND bills.user_id = auth.uid()
        )
    );

-- =====================================================
-- RLS POLICIES FOR INVENTORY
-- =====================================================

-- Drop existing policies
DROP POLICY IF EXISTS inventory_user_policy ON public.inventory;
DROP POLICY IF EXISTS inventory_insert_policy ON public.inventory;
DROP POLICY IF EXISTS inventory_update_policy ON public.inventory;
DROP POLICY IF EXISTS inventory_delete_policy ON public.inventory;

-- Create comprehensive RLS policies for inventory
CREATE POLICY inventory_user_policy ON public.inventory
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY inventory_insert_policy ON public.inventory
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY inventory_update_policy ON public.inventory
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY inventory_delete_policy ON public.inventory
    FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- RLS POLICIES FOR PATIENTS
-- =====================================================

-- Drop existing policies
DROP POLICY IF EXISTS patients_user_policy ON public.patients;
DROP POLICY IF EXISTS patients_insert_policy ON public.patients;
DROP POLICY IF EXISTS patients_update_policy ON public.patients;
DROP POLICY IF EXISTS patients_delete_policy ON public.patients;

-- Create comprehensive RLS policies for patients
CREATE POLICY patients_user_policy ON public.patients
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY patients_insert_policy ON public.patients
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY patients_update_policy ON public.patients
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY patients_delete_policy ON public.patients
    FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- DATA INTEGRITY CHECKS
-- =====================================================

-- Update existing records to have proper timestamps
UPDATE public.prescriptions 
SET created_at = COALESCE(created_at, date, now()),
    updated_at = COALESCE(updated_at, date, now())
WHERE created_at IS NULL OR updated_at IS NULL;

UPDATE public.inventory 
SET created_at = COALESCE(created_at, now()),
    updated_at = COALESCE(updated_at, now())
WHERE created_at IS NULL OR updated_at IS NULL;

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Verify table structures
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name IN ('prescriptions', 'bills', 'bill_items', 'inventory', 'patients')
ORDER BY table_name, ordinal_position;

-- Verify RLS policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE schemaname = 'public'
AND tablename IN ('prescriptions', 'bills', 'bill_items', 'inventory', 'patients')
ORDER BY tablename, policyname;

-- Verify indexes
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE schemaname = 'public'
AND tablename IN ('prescriptions', 'bills', 'bill_items', 'inventory', 'patients')
ORDER BY tablename, indexname;

-- =====================================================
-- COMPLETION MESSAGE
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE 'Database recovery script completed successfully!';
    RAISE NOTICE 'All tables updated with proper timestamps, indexes, and RLS policies.';
    RAISE NOTICE 'Please verify the results using the queries above.';
END $$;