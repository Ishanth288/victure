import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://aysdilfgxlyuplikmmdt.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF5c2RpbGZneGx5dXBsaWttbWR0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDAxNjU0NTAsImV4cCI6MjA1NTc0MTQ1MH0.7OLDoAC5i8F6IbORW7kY6at5pWdTZDB44D0g6kPaWpA";

// Enhanced Supabase client with performance optimizations
export const supabase = createClient<Database>(
  SUPABASE_URL, 
  SUPABASE_PUBLISHABLE_KEY,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      storage: localStorage,
      flowType: 'pkce',
      debug: false
    },
    realtime: {
      params: {
        eventsPerSecond: 2
      },
      heartbeatIntervalMs: 30000,
      reconnectAfterMs: (tries) => Math.min(tries * 1000, 30000)
    },
    global: {
      headers: {
        'x-client-info': 'victure-pharmacy-v3'
      }
    },
    db: {
      schema: 'public'
    }
  }
);

// Query timeout wrapper for all database operations
export const withTimeout = <T>(
  promise: Promise<T>, 
  timeoutMs: number = 8000,
  operation: string = 'Database operation'
): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`${operation} timeout after ${timeoutMs}ms`)), timeoutMs)
    )
  ]);
};

// Optimized query builder with automatic retries and caching
export class OptimizedQuery {
  private static cache = new Map<string, { data: any; timestamp: number; ttl: number }>();
  private static pendingQueries = new Map<string, Promise<any>>();

  static async execute<T>(
    queryFn: () => any,
    options: {
      cacheKey?: string;
      cacheTTL?: number;
      retries?: number;
      timeout?: number;
      operation?: string;
    } = {}
  ): Promise<{ data: T | null; error: any }> {
    const {
      cacheKey,
      cacheTTL = 60000, // 1 minute default
      retries = 2,
      timeout = 6000, // 6 seconds default
      operation = 'Query'
    } = options;

    // Check cache first
    if (cacheKey && this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey)!;
      if (Date.now() - cached.timestamp < cached.ttl) {
        console.log(`🎯 Cache hit for ${cacheKey}`);
        return { data: cached.data as T, error: null };
      } else {
        this.cache.delete(cacheKey);
      }
    }

    // Check if the same query is already pending
    if (cacheKey && this.pendingQueries.has(cacheKey)) {
      console.log(`⏳ Reusing pending query for ${cacheKey}`);
      try {
        const result = await this.pendingQueries.get(cacheKey)!;
        return result as { data: T | null; error: any };
      } catch (error) {
        this.pendingQueries.delete(cacheKey);
        return { data: null, error };
      }
    }

    // Create the query promise
    const queryPromise = this.executeWithRetry<T>(queryFn, retries, timeout, operation);

    // Store pending query if we have a cache key
    if (cacheKey) {
      this.pendingQueries.set(cacheKey, queryPromise);
    }

    try {
      const result = await queryPromise;
      
      // Cache successful results
      if (cacheKey && !result.error && result.data) {
        this.cache.set(cacheKey, {
          data: result.data,
          timestamp: Date.now(),
          ttl: cacheTTL
        });
      }

      return result;
    } finally {
      if (cacheKey) {
        this.pendingQueries.delete(cacheKey);
      }
    }
  }

  private static async executeWithRetry<T>(
    queryFn: () => any,
    retries: number,
    timeout: number,
    operation: string
  ): Promise<{ data: T | null; error: any }> {
    let lastError: any = null;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const startTime = Date.now();
        const result = await withTimeout(queryFn(), timeout, operation);
        const duration = Date.now() - startTime;
        
        if (duration > 3000) {
          console.warn(`⚠️ Slow query detected: ${operation} took ${duration}ms`);
        }

        // Ensure we return the expected format
        if (result && typeof result === 'object' && 'data' in result) {
          const supabaseResult = result as { data: any; error: any };
          return { data: supabaseResult.data as T, error: supabaseResult.error || null };
        } else {
          return { data: result as T, error: null };
        }
      } catch (error) {
        lastError = error;
        
        if (attempt === retries) {
          console.error(`❌ ${operation} failed after ${retries + 1} attempts:`, error);
          break;
        }

        // Exponential backoff for retries
        const backoffTime = Math.min(1000 * Math.pow(2, attempt), 5000);
        console.warn(`🔄 ${operation} attempt ${attempt + 1} failed, retrying in ${backoffTime}ms:`, error);
        await new Promise(resolve => setTimeout(resolve, backoffTime));
      }
    }

    return { data: null, error: lastError };
  }

  // Clear cache method
  static clearCache(pattern?: string) {
    if (pattern) {
      const keysToDelete = Array.from(this.cache.keys()).filter(key => key.includes(pattern));
      keysToDelete.forEach(key => this.cache.delete(key));
      console.log(`🧹 Cleared ${keysToDelete.length} cache entries matching "${pattern}"`);
    } else {
      this.cache.clear();
      console.log('🧹 Cleared all cache entries');
    }
  }

  // Get cache stats
  static getCacheStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
      pendingQueries: this.pendingQueries.size
    };
  }
}

// Enhanced availability check with connection quality testing
export const checkSupabaseAvailability = async (): Promise<{
  available: boolean;
  connectionSpeed: 'fast' | 'slow' | 'unknown';
  latency: number;
}> => {
  const startTime = Date.now();
  
  try {
    console.log('🔍 Testing Supabase connection quality...');
    
    const result = await withTimeout(
      supabase.auth.getSession(),
      5000,
      'Connection test'
    );

    const latency = Date.now() - startTime;
    const connectionSpeed = latency < 1000 ? 'fast' : 'slow';

    if (result.error) {
      console.error('Supabase session check failed:', result.error);
      return { available: false, connectionSpeed: 'unknown', latency };
    }

    console.log(`✅ Supabase connection established (${latency}ms, ${connectionSpeed})`);
    return { available: true, connectionSpeed, latency };
  } catch (error) {
    const latency = Date.now() - startTime;
    console.error('Supabase connection failed:', error);
    return { available: false, connectionSpeed: 'unknown', latency };
  }
};

// Connection manager for monitoring and auto-recovery
export class SupabaseConnectionManager {
  private static isMonitoring = false;
  private static reconnectAttempts = 0;
  private static maxReconnectAttempts = 5;
  private static healthCheckInterval: NodeJS.Timeout | null = null;

  static startMonitoring() {
    if (this.isMonitoring) return;
    
    this.isMonitoring = true;
    console.log('🔍 Starting Supabase connection monitoring');
    
    // Initial health check
    this.performHealthCheck();
    
    // Set up periodic health checks
    this.healthCheckInterval = setInterval(() => {
      this.performHealthCheck();
    }, 30000); // Check every 30 seconds
  }

  static stopMonitoring() {
    this.isMonitoring = false;
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
    console.log('🛑 Stopped Supabase connection monitoring');
  }

  private static async performHealthCheck() {
    try {
      const { available, connectionSpeed, latency } = await checkSupabaseAvailability();
      
      if (available) {
        this.reconnectAttempts = 0;
        
        // Log performance metrics
        if (connectionSpeed === 'slow') {
          console.warn(`⚠️ Slow connection detected (${latency}ms)`);
        }
      } else {
        this.handleConnectionFailure();
      }
    } catch (error) {
      console.error('Health check failed:', error);
      this.handleConnectionFailure();
    }
  }

  private static async handleConnectionFailure() {
    this.reconnectAttempts++;
    
    if (this.reconnectAttempts <= this.maxReconnectAttempts) {
      console.warn(`🔄 Connection lost, attempting recovery (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      
      try {
        await supabase.auth.refreshSession();
        console.log('✅ Session refreshed successfully');
      } catch (error) {
        console.error('Session refresh failed:', error);
      }
    } else {
      console.error('❌ Max reconnection attempts reached, stopping automatic recovery');
    }
  }

  static getConnectionStats() {
    return {
      isMonitoring: this.isMonitoring,
      reconnectAttempts: this.reconnectAttempts,
      maxReconnectAttempts: this.maxReconnectAttempts
    };
  }
}

// Initialize monitoring when module loads
if (typeof window !== 'undefined') {
  SupabaseConnectionManager.startMonitoring();
}
