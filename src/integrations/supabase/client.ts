
import { createClient } from '@supabase/supabase-js'
import type { Database } from './types'

const supabaseUrl = "https://aysdilfgxlyuplikmmdt.supabase.co"
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF5c2RpbGZneGx5dXBsaWttbWR0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDAxNjU0NTAsImV4cCI6MjA1NTc0MTQ1MH0.7OLDoAC5i8F6IbORW7kY6at5pWdTZDB44D0g6kPaWpA"

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
  },
  global: {
    headers: {
      'apikey': supabaseAnonKey,
    },
  },
  db: {
    schema: 'public',
  },
  realtime: {
    params: {
      eventsPerSecond: 2,
    },
  },
})

// Add connection health check
export const checkConnection = async (): Promise<boolean> => {
  try {
    const { error } = await supabase.from('profiles').select('count', { count: 'exact', head: true });
    return !error;
  } catch (error) {
    console.warn('Supabase connection check failed:', error);
    return false;
  }
};

// Add checkSupabaseAvailability export
export const checkSupabaseAvailability = async (): Promise<boolean> => {
  try {
    const { error } = await supabase.from('profiles').select('count', { count: 'exact', head: true });
    return !error;
  } catch (error) {
    console.warn('Supabase availability check failed:', error);
    return false;
  }
};

// Add OptimizedQuery class for caching
export class OptimizedQuery {
  private static cache = new Map<string, { data: any; timestamp: number; ttl: number }>();

  static async execute<T>(
    queryFn: () => Promise<{ data: T | null; error: any }>,
    options: {
      cacheKey: string;
      cacheTTL: number;
      timeout?: number;
      operation?: string;
    }
  ): Promise<{ data: T | null; error: any }> {
    const { cacheKey, cacheTTL, timeout = 5000, operation = 'Query' } = options;
    
    // Check cache first
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      console.log(`✅ ${operation}: Using cached data for ${cacheKey}`);
      return { data: cached.data, error: null };
    }

    try {
      console.log(`🔄 ${operation}: Executing for ${cacheKey}`);
      
      // Execute with timeout
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error(`${operation} timeout after ${timeout}ms`)), timeout)
      );
      
      const result = await Promise.race([queryFn(), timeoutPromise]) as { data: T | null; error: any };
      
      if (result.error) {
        console.error(`❌ ${operation} error:`, result.error);
        return result;
      }

      // Cache successful result
      this.cache.set(cacheKey, {
        data: result.data,
        timestamp: Date.now(),
        ttl: cacheTTL
      });

      console.log(`✅ ${operation}: Success for ${cacheKey}`);
      return result;
    } catch (error) {
      console.error(`❌ ${operation} failed:`, error);
      return { data: null, error };
    }
  }

  static clearCache(keyPrefix?: string): void {
    if (keyPrefix) {
      for (const key of this.cache.keys()) {
        if (key.startsWith(keyPrefix)) {
          this.cache.delete(key);
        }
      }
    } else {
      this.cache.clear();
    }
  }

  static getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}
