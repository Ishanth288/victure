
// Types for the migration logs table
export interface MigrationLog {
  id: string;
  migration_id: string;
  type: string;
  timestamp: string;
  added_count: number;
  skipped_count: number;
  issues: Array<{
    row: number;
    reason: string;
  }>;
}
