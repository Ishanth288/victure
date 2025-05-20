
import { supabase } from "@/integrations/supabase/client";

/**
 * Rolls back a migration by deleting records with the given migration ID
 */
export async function rollbackMigration(
  migrationId: string, 
  type: 'Inventory' | 'Patients' | 'Prescriptions'
): Promise<boolean> {
  try {
    // Using the type-safe approach for known table names
    if (type === 'Inventory') {
      const { error } = await supabase
        .from('inventory')
        .delete()
        .eq('migration_id', migrationId);
        
      if (error) {
        console.error(`Failed to rollback ${type} migration:`, error);
        return false;
      }
    } else if (type === 'Patients') {
      const { error } = await supabase
        .from('patients')
        .delete()
        .eq('migration_id', migrationId);
        
      if (error) {
        console.error(`Failed to rollback ${type} migration:`, error);
        return false;
      }
    } else if (type === 'Prescriptions') {
      const { error } = await supabase
        .from('prescriptions')
        .delete()
        .eq('migration_id', migrationId);
        
      if (error) {
        console.error(`Failed to rollback ${type} migration:`, error);
        return false;
      }
    }
    
    return true;
  } catch (err) {
    console.error('Rollback error:', err);
    return false;
  }
}
