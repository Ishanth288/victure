
import { supabase } from "@/integrations/supabase/client";
import { MigrationLog } from "@/types/dataMigration";

/**
 * Logs a migration event
 */
export async function logMigration(log: MigrationLog) {
  try {
    // Use explicit typing to bypass type constraints
    await supabase.from('migration_logs').insert([{
      migration_id: log.migration_id,
      type: log.type,
      timestamp: log.timestamp,
      added_count: log.added_count,
      skipped_count: log.skipped_count,
      issues: log.issues
    }]);
  } catch (err) {
    console.error('Error logging migration:', err);
  }
}

/**
 * Gets the list of recent migrations
 */
export async function getRecentMigrations(): Promise<MigrationLog[]> {
  try {
    const { data, error } = await supabase
      .from('migration_logs')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(10);
      
    if (error) {
      console.error('Failed to fetch migration logs:', error);
      return [];
    }
    
    // Add explicit type assertion to handle the type mismatch
    return (data || []) as MigrationLog[];
  } catch (err) {
    console.error('Error fetching migration logs:', err);
    return [];
  }
}
