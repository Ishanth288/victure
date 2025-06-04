-- Create deletion_history table to track all deletions/returns
CREATE TABLE IF NOT EXISTS deletion_history (
    id SERIAL PRIMARY KEY,
    
    -- What was deleted
    entity_type VARCHAR(50) NOT NULL, -- 'bill_item', 'prescription', 'patient', 'medicine_return'
    entity_id INTEGER NOT NULL,
    entity_data JSONB NOT NULL, -- Store the full data that was deleted
    
    -- Deletion context
    deletion_reason TEXT,
    deletion_type VARCHAR(30) DEFAULT 'manual', -- 'manual', 'return', 'replacement', 'cleanup'
    
    -- Related entities (for context)
    patient_id INTEGER,
    prescription_id INTEGER,
    bill_id INTEGER,
    medicine_name VARCHAR(255),
    
    -- Metadata
    deleted_by UUID NOT NULL REFERENCES auth.users(id),
    deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Financial impact
    amount_affected DECIMAL(10,2),
    quantity_affected INTEGER,
    
    -- Additional context
    notes TEXT,
    is_reversible BOOLEAN DEFAULT false,
    reversal_deadline TIMESTAMP WITH TIME ZONE,
    
    -- Indexes for performance
    CONSTRAINT deletion_history_entity_check CHECK (entity_type IN ('bill_item', 'prescription', 'patient', 'medicine_return', 'inventory_adjustment'))
);

-- Create indexes for fast searching
CREATE INDEX idx_deletion_history_entity ON deletion_history(entity_type, entity_id);
CREATE INDEX idx_deletion_history_patient ON deletion_history(patient_id);
CREATE INDEX idx_deletion_history_date ON deletion_history(deleted_at);
CREATE INDEX idx_deletion_history_user ON deletion_history(deleted_by);
CREATE INDEX idx_deletion_history_medicine ON deletion_history(medicine_name);
CREATE INDEX idx_deletion_history_search ON deletion_history USING gin(entity_data);

-- Create RLS policies
ALTER TABLE deletion_history ENABLE ROW LEVEL SECURITY;

-- Users can only see deletion history for their own organization
CREATE POLICY "Users can view their deletion history" ON deletion_history
    FOR SELECT USING (
        deleted_by IN (
            SELECT id FROM auth.users 
            WHERE auth.uid() = id
        )
    );

-- Users can insert deletion history
CREATE POLICY "Users can create deletion history" ON deletion_history
    FOR INSERT WITH CHECK (deleted_by = auth.uid());

-- Add comments for documentation
COMMENT ON TABLE deletion_history IS 'Tracks all deletions and returns in the system for audit and recovery purposes';
COMMENT ON COLUMN deletion_history.entity_data IS 'Complete JSON snapshot of the deleted entity for potential recovery';
COMMENT ON COLUMN deletion_history.deletion_type IS 'manual: user deleted, return: customer return, replacement: medicine replacement, cleanup: system cleanup';
COMMENT ON COLUMN deletion_history.is_reversible IS 'Whether this deletion can be undone within the reversal deadline'; 