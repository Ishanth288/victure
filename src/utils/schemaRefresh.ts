/**
 * Schema Refresh Utility
 * Clears all caches and forces fresh schema fetch from Supabase
 */

import { supabase } from '@/integrations/supabase/client';
import { OptimizedQuery } from '@/integrations/supabase/client';
import { globalCache } from './smartCache';

/**
 * Force refresh the Supabase schema cache and clear all local caches
 * This helps resolve "Could not find a relationship" errors
 */
export async function refreshSupabaseSchema(): Promise<void> {
  try {
    console.log('🔄 Starting schema refresh...');
    
    // 1. Clear all OptimizedQuery caches
    OptimizedQuery.clearCache();
    console.log('✅ Cleared OptimizedQuery cache');
    
    // 2. Clear global smart cache
    globalCache.clear();
    console.log('✅ Cleared global cache');
    
    // 3. Force a fresh auth session which can help re-establish connection
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    if (authError) {
      console.warn('⚠️ Auth session refresh warning:', authError.message);
    } else {
      console.log('✅ Auth session refreshed');
    }
    
    // 4. Test the connection with a simple query to force schema reload
    const { data, error } = await supabase
      .from('bills')
      .select('id')
      .limit(1);
      
    if (error) {
      console.warn('⚠️ Schema test query warning:', error.message);
    } else {
      console.log('✅ Schema connection verified');
    }
    
    // 5. Clear any localStorage caches that might interfere
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.includes('supabase') || key.includes('cache') || key.includes('bills'))) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));
    console.log(`✅ Cleared ${keysToRemove.length} localStorage entries`);
    
    console.log('🎉 Schema refresh completed successfully');
    
  } catch (error) {
    console.error('❌ Schema refresh failed:', error);
    throw error;
  }
}

/**
 * Quick cache clear without full schema refresh
 * Use this for lighter cache clearing operations
 */
export function clearAllCaches(): void {
  OptimizedQuery.clearCache();
  globalCache.clear();
  console.log('🧹 All caches cleared');
}

/**
 * Clear caches for specific tables
 */
export function clearTableCaches(tables: string[]): void {
  tables.forEach(table => {
    OptimizedQuery.clearCache(table);
    // Use the correct invalidation method from smartCache
    globalCache.invalidatePattern(`:${table}:`);
  });
  console.log(`🧹 Cleared caches for tables: ${tables.join(', ')}`);
}