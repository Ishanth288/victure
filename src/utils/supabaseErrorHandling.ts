import { supabase } from '@/integrations/supabase/client';
import { supabaseCircuitBreaker } from './circuitBreaker';
import { CURRENT_CONFIG } from './performanceConfig';
import { globalCache, createCacheKey } from './smartCache';

export interface SupabaseQueryResult<T> {
  data: T | null;
  error: any;
}

export interface QueryOptions {
  timeout?: number;
  retries?: number;
  useCache?: boolean;
  cacheTTL?: number;
  cacheKey?: string;
  bypassCircuitBreaker?: boolean;
}

/**
 * Enhanced error handling for Supabase queries with circuit breaker and caching
 */
export async function safeSupabaseQuery<T>(
  queryFn: () => any,
  context: string = 'query',
  options: QueryOptions = {}
): Promise<SupabaseQueryResult<T>> {
  const {
    timeout = CURRENT_CONFIG.queryTimeout,
    retries = CURRENT_CONFIG.retryAttempts,
    useCache = false,
    cacheTTL = CURRENT_CONFIG.cacheTimeout,
    cacheKey,
    bypassCircuitBreaker = false
  } = options;
  
  // Try cache first if enabled
  if (useCache && cacheKey) {
    const cached = await globalCache.get<T>(cacheKey);
    if (cached !== null) {
      if (CURRENT_CONFIG.enableVerboseLogging) {
        console.log(`📦 Cache hit for ${context}: ${cacheKey}`);
      }
      return { data: cached, error: null };
    }
  }
  
  let lastError: any;
  
  // Wrapper function for circuit breaker
  const executeQuery = async (): Promise<any> => {
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error(`Query timeout after ${timeout}ms`)), timeout)
    );
    
    return Promise.race([queryFn(), timeoutPromise]);
  };
  
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      if (CURRENT_CONFIG.enableVerboseLogging) {
        console.log(`🔍 Executing Supabase query: ${context} (attempt ${attempt + 1}/${retries + 1})`);
      }
      
      let result;
      
      // Use circuit breaker unless bypassed
      if (!bypassCircuitBreaker && CURRENT_CONFIG.enableCircuitBreaker) {
        result = await supabaseCircuitBreaker.execute(executeQuery, context);
      } else {
        result = await executeQuery();
      }
      
      if (result && typeof result === 'object' && 'error' in result && result.error) {
        const error = result.error;
        
        // Only retry connection-related errors
        if (isRetryableError(error) && attempt < retries) {
          console.warn(`🔄 Retryable error in ${context}, attempt ${attempt + 1}:`, error.message);
          lastError = error;
          
          // Exponential backoff with jitter
          const delay = Math.min(
            CURRENT_CONFIG.retryDelay * Math.pow(2, attempt) + Math.random() * 100,
            5000
          );
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
        
        console.warn(`❌ Supabase error in ${context}:`, error.message);
        return { data: null, error };
      }
      
      // Cache successful result if caching is enabled
      if (useCache && cacheKey && result) {
        const dataToCache = result?.data || result;
        await globalCache.set(cacheKey, dataToCache, cacheTTL);
        if (CURRENT_CONFIG.enableVerboseLogging) {
          console.log(`💾 Cached result for ${context}: ${cacheKey}`);
        }
      }
      
      if (CURRENT_CONFIG.enableVerboseLogging) {
        console.log(`✅ Supabase query successful for ${context}`);
      }
      return { data: result?.data || result, error: null };
      
    } catch (error: any) {
      lastError = error;
      
      if (isRetryableError(error) && attempt < retries) {
        console.warn(`🔄 Retryable exception in ${context}, attempt ${attempt + 1}:`, error.message);
        
        // Exponential backoff with jitter
        const delay = Math.min(
          CURRENT_CONFIG.retryDelay * Math.pow(2, attempt) + Math.random() * 100,
          5000
        );
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      
      console.warn(`❌ Exception in ${context}:`, error.message);
      break;
    }
  }
  
  return { data: null, error: lastError };
}

/**
 * Check Supabase connection with optimized timeout and circuit breaker
 */
export async function checkSupabaseConnection(): Promise<boolean> {
  try {
    if (CURRENT_CONFIG.enableVerboseLogging) {
      console.log("🔍 Testing Supabase connection...");
    }
    
    const connectionTest = async () => {
      return supabase.from('profiles').select('count', { count: 'exact', head: true });
    };
    
    // Use circuit breaker for connection test
    const result = await supabaseCircuitBreaker.execute(connectionTest, 'connection-check');
    
    if (result?.error) {
      console.warn('🔴 Supabase connection check failed:', result.error.message);
      return false;
    }
    
    if (CURRENT_CONFIG.enableVerboseLogging) {
      console.log("✅ Supabase connection test successful");
    }
    return true;
  } catch (error: any) {
    console.warn('🔴 Error checking Supabase connection:', error.message);
    return false;
  }
}

/**
 * Handle Supabase errors with user-friendly messages without causing cascades
 */
export async function handleSupabaseError(error: any, context: string = 'operation'): Promise<string> {
  console.warn(`Supabase error in ${context}:`, error?.message || error);
  
  // Return a user-friendly error message without triggering toasts
  if (error?.message) {
    return error.message;
  }
  
  return `An error occurred during ${context}. Please try again.`;
}

/**
 * Check if an error is a connection-related error
 */
export function isConnectionError(error: any): boolean {
  if (!error) return false;
  
  const message = error.message?.toLowerCase() || '';
  return (
    message.includes('network') ||
    message.includes('connection') ||
    message.includes('timeout') ||
    message.includes('fetch') ||
    message.includes('failed to load')
  );
}

/**
 * Check if an error is retryable (connection/timeout related)
 */
export function isRetryableError(error: any): boolean {
  if (!error) return false;
  
  const message = error.message?.toLowerCase() || '';
  const code = error.code?.toLowerCase() || '';
  
  return (
    message.includes('timeout') ||
    message.includes('connection') ||
    message.includes('network') ||
    message.includes('fetch') ||
    message.includes('abort') ||
    code === 'network_error' ||
    code === 'timeout' ||
    code === 'connection_error'
  );
}

/**
 * Check if an error is authentication-related
 */
export function isAuthError(error: any): boolean {
  if (!error) return false;
  
  const message = error.message?.toLowerCase() || '';
  const code = error.code || '';
  
  return (
    message.includes('unauthorized') ||
    message.includes('authentication') ||
    message.includes('login') ||
    code === '401' ||
    code === 'PGRST301'
  );
}
