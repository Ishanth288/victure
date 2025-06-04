-- Fix RLS policies for deletion_history table

-- Drop ALL existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own deletion history" ON deletion_history;
DROP POLICY IF EXISTS "Users can insert their own deletion history" ON deletion_history;
DROP POLICY IF EXISTS "Users can update their own deletion history" ON deletion_history;
DROP POLICY IF EXISTS "Users can delete their own deletion history" ON deletion_history;

-- Create a more explicit RLS policy for SELECT
CREATE POLICY "Users can view their own deletion history" ON deletion_history
FOR SELECT TO authenticated
USING (deleted_by = auth.uid());

-- Create policy for inserting deletion history
CREATE POLICY "Users can insert their own deletion history" ON deletion_history
FOR INSERT TO authenticated
WITH CHECK (deleted_by = auth.uid());

-- Grant necessary permissions to authenticated users
GRANT SELECT, INSERT ON deletion_history TO authenticated;

-- Ensure RLS is enabled
ALTER TABLE deletion_history ENABLE ROW LEVEL SECURITY;

-- Drop existing indexes if they exist
DROP INDEX IF EXISTS idx_deletion_history_deleted_by_date;
DROP INDEX IF EXISTS idx_deletion_history_entity_type;

-- Create indexes for better performance on deletion history queries
CREATE INDEX idx_deletion_history_deleted_by_date 
ON deletion_history (deleted_by, deleted_at DESC);

-- Create an index for entity type queries
CREATE INDEX idx_deletion_history_entity_type 
ON deletion_history (entity_type, deleted_at DESC); 