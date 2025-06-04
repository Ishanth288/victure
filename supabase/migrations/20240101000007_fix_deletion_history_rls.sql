-- Fix RLS policies for deletion_history table

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Users can view their own deletion history" ON deletion_history;

-- Create a more explicit RLS policy
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

-- Create an index for better performance on deletion history queries
CREATE INDEX IF NOT EXISTS idx_deletion_history_deleted_by_date 
ON deletion_history (deleted_by, deleted_at DESC);

-- Create an index for entity type queries
CREATE INDEX IF NOT EXISTS idx_deletion_history_entity_type 
ON deletion_history (entity_type, deleted_at DESC); 