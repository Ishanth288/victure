
import { v4 as uuidv4 } from 'uuid';

/**
 * Generates a unique migration ID
 */
export function generateMigrationId(): string {
  return uuidv4();
}
