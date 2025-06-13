import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Validate and sanitize Supabase configuration
const getSupabaseConfig = () => {
  const url = "https://aysdilfgxlyuplikmmdt.supabase.co";
  const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF5c2RpbGZneGx5dXBsaWttbWR0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDAxNjU0NTAsImV4cCI6MjA1NTc0MTQ1MH0.7OLDoAC5i8F6IbORW7kY6at5pWdTZDB44D0g6kPaWpA";
  
  // Validate URL format
  try {
    new URL(url);
  } catch (error) {
    console.error('❌ Invalid Supabase URL:', url);
    throw new Error(`Invalid Supabase URL: ${url}. Please check your environment variables.`);
  }
  
  if (!key || key.length < 50) {
    console.error('❌ Invalid Supabase API key');
    throw new Error('Invalid Supabase API key. Please check your environment variables.');
  }
  
  console.log('✅ Supabase configuration validated:', { 
    url: url.substring(0, 30) + '...', 
    keyLength: key.length 
  });
  
  return { url, key };
};

const { url: SUPABASE_URL, key: SUPABASE_PUBLISHABLE_KEY } = getSupabaseConfig();

// Enhanced Supabase client with reduced timeouts and better error handling
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
      debug: false // Reduced debug logging
    },
    realtime: {
      params: {
        eventsPerSecond: 2
      },
      heartbeatIntervalMs: 15000, // Reduced from 30s
      reconnectAfterMs: (tries: number) => Math.min(tries * 500, 5000) // Faster reconnect
    },
    global: {
      headers: {
        'x-client-info': 'victure-pharmacy-v3'
      },
      fetch: (url, options = {}) => {
        // Add timeout to all requests
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
        
        return fetch(url, {
          ...options,
          signal: controller.signal,
        }).finally(() => {
          clearTimeout(timeoutId);
        });
      }
    },
    db: {
      schema: 'public'
    }
  }
);

// Simplified query timeout wrapper
export const withTimeout = <T>(
  promise: Promise<T>, 
  timeoutMs: number = 3000, // Reduced from 8s to 3s
  operation: string = 'Database operation'
): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`${operation} timeout after ${timeoutMs}ms`)), timeoutMs)
    )
  ]);
};

interface CachedResult<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

interface QueryOptions {
  cacheKey?: string;
  cacheTTL?: number;
  retries?: number;
  timeout?: number;
  operation?: string;
}

interface QueryResult<T> {
  data: T | null;
  error: Error | null;
}

// Optimized query builder with automatic retries and caching
export class OptimizedQuery {
  private static cache = new Map<string, CachedResult<unknown>>();
  private static pendingQueries = new Map<string, Promise<QueryResult<unknown>>>();

  static async execute<T>(
    queryFn: () => Promise<{ data: T | null; error: Error | null }>,
    options: QueryOptions = {}
  ): Promise<QueryResult<T>> {
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
        return result as QueryResult<T>;
      } catch (error) {
        this.pendingQueries.delete(cacheKey);
        return { data: null, error: error as Error };
      }
    }

    // Create the query promise
    const queryPromise = this.executeWithRetry<T>(queryFn, retries, timeout, operation);

    // Store pending query if we have a cache key
    if (cacheKey) {
      this.pendingQueries.set(cacheKey, queryPromise as Promise<QueryResult<unknown>>);
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
    queryFn: () => Promise<{ data: T | null; error: Error | null }>,
    retries: number,
    timeout: number,
    operation: string
  ): Promise<QueryResult<T>> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const startTime = Date.now();
        const result = await withTimeout(queryFn(), timeout, operation);
        const duration = Date.now() - startTime;
        
        if (duration > 3000) {
          console.warn(`⚠️ Slow query detected: ${operation} took ${duration}ms`);
        }

        return { data: result.data, error: result.error };
      } catch (error) {
        lastError = error as Error;
        
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
  static clearCache(pattern?: string): void {
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
  static getCacheStats(): {
    size: number;
    keys: string[];
    pendingQueries: number;
  } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
      pendingQueries: this.pendingQueries.size
    };
  }
}

interface ConnectionStatus {
  available: boolean;
  connectionSpeed: 'fast' | 'slow' | 'unknown';
  latency: number;
}

// Enhanced availability check with connection quality testing
export const checkSupabaseAvailability = async (): Promise<ConnectionStatus> => {
  const startTime = Date.now();
  
  try {
    console.log('🔍 Testing Supabase connection quality...');
    
    const result = await OptimizedQuery.execute(
      async () => {
        const { data, error } = await supabase.from('bills').select('count').limit(1);
        return { data, error };
      },
      {
        timeout: 5000,
        retries: 1,
        operation: 'Connection test'
      }
    );
    
    const latency = Date.now() - startTime;
    
    if (result.error) {
      console.warn('⚠️ Supabase connection test failed:', result.error.message);
      return {
        available: false,
        connectionSpeed: 'unknown',
        latency: latency
      };
    }
    
    const connectionSpeed: 'fast' | 'slow' | 'unknown' = latency < 1000 ? 'fast' : latency < 3000 ? 'slow' : 'unknown';
    
    console.log(`✅ Supabase connection test successful - ${connectionSpeed} (${latency}ms)`);
    
    return {
      available: true,
      connectionSpeed,
      latency
    };
  } catch (error) {
    const latency = Date.now() - startTime;
    console.error('❌ Supabase connection test failed:', error);
    
    return {
      available: false,
      connectionSpeed: 'unknown',
      latency: latency
    };
  }
};

// Connection monitoring and management
export class SupabaseConnectionManager {
  private static isMonitoring = false;
  private static reconnectAttempts = 0;
  private static maxReconnectAttempts = 5;
  private static healthCheckInterval: NodeJS.Timeout | null = null;

  static startMonitoring(): void {
    if (this.isMonitoring) return;
    
    this.isMonitoring = true;
    console.log('🔄 Starting Supabase connection monitoring...');
    
    // Initial health check
    this.performHealthCheck();
    
    // Schedule periodic health checks every 5 minutes
    this.healthCheckInterval = setInterval(() => {
      this.performHealthCheck();
    }, 5 * 60 * 1000);
  }

  static stopMonitoring(): void {
    if (!this.isMonitoring) return;
    
    this.isMonitoring = false;
    
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
    
    console.log('🛑 Stopped Supabase connection monitoring');
  }

  private static async performHealthCheck(): Promise<void> {
    try {
      const status = await checkSupabaseAvailability();
      
      if (status.available) {
        this.reconnectAttempts = 0; // Reset on successful connection
        console.log(`✅ Health check passed - ${status.connectionSpeed} connection (${status.latency}ms)`);
      } else {
        console.warn('⚠️ Health check failed, attempting recovery...');
        await this.handleConnectionFailure();
      }
    } catch (error) {
      console.error('❌ Health check error:', error);
      await this.handleConnectionFailure();
    }
  }

  private static async handleConnectionFailure(): Promise<void> {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('❌ Max reconnection attempts reached. Manual intervention required.');
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
    
    console.log(`🔄 Attempting reconnection ${this.reconnectAttempts}/${this.maxReconnectAttempts} in ${delay}ms...`);
    
    setTimeout(async () => {
      // Clear cache to force fresh connections
      OptimizedQuery.clearCache();
      
      // Test connection again
      const status = await checkSupabaseAvailability();
      if (!status.available) {
        await this.handleConnectionFailure();
      }
    }, delay);
  }

  static getConnectionStats(): {
    isMonitoring: boolean;
    reconnectAttempts: number;
    maxReconnectAttempts: number;
  } {
    return {
      isMonitoring: this.isMonitoring,
      reconnectAttempts: this.reconnectAttempts,
      maxReconnectAttempts: this.maxReconnectAttempts
    };
  }
}

// Auto-start monitoring in production
if (typeof window !== 'undefined' && import.meta.env.PROD) {
  SupabaseConnectionManager.startMonitoring();
}
