
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';
import * as Sentry from "@sentry/react";

const SUPABASE_URL = "https://aysdilfgxlyuplikmmdt.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF5c2RpbGZneGx5dXBsaWttbWR0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDAxNjU0NTAsImV4cCI6MjA1NTc0MTQ1MH0.7OLDoAC5i8F6IbORW7kY6at5pWdTZDB44D0g6kPaWpA";

// Connection resilience options
const connectionOptions = {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: localStorage
  },
  global: {
    // Add retries for network failures
    fetch: (url: string, options: RequestInit) => {
      const maxRetries = 3;
      const retryDelay = 1000; // Start with 1s delay
      
      return new Promise<Response>((resolve, reject) => {
        const attemptFetch = (retriesLeft: number) => {
          fetch(url, options)
            .then(resolve)
            .catch(error => {
              if (retriesLeft > 0) {
                setTimeout(() => {
                  console.log(`Retrying fetch (${maxRetries - retriesLeft + 1}/${maxRetries})...`);
                  attemptFetch(retriesLeft - 1);
                }, retryDelay * Math.pow(2, maxRetries - retriesLeft));
              } else {
                reject(error);
              }
            });
        };
        
        attemptFetch(maxRetries);
      });
    }
  }
};

export const supabase = createClient<Database>(
  SUPABASE_URL, 
  SUPABASE_PUBLISHABLE_KEY, 
  connectionOptions
);

// Add automatic session refresh mechanism
let refreshTimer: ReturnType<typeof setInterval> | null = null;
const startSessionRefresh = () => {
  if (refreshTimer) clearInterval(refreshTimer);
  
  // Refresh session every 10 minutes
  refreshTimer = setInterval(async () => {
    try {
      const { error } = await supabase.auth.refreshSession();
      if (error) {
        console.error('Session refresh failed:', error);
      }
    } catch (error) {
      console.error('Error during session refresh:', error);
    }
  }, 10 * 60 * 1000); // 10 minutes
};

// Start session refresh when client initializes
startSessionRefresh();

// Helper method to safely handle Supabase query results
export const handleQueryResult = <T>(result: T | { error: true }) => {
  if (result && typeof result === 'object' && 'error' in result && result.error === true) {
    console.error("Supabase query error:", result);
    return null;
  }
  return result as T;
};

/**
 * Check if the application can connect to Supabase
 * Returns a promise that resolves to a boolean indicating connection status
 */
export const checkSupabaseAvailability = async (): Promise<boolean> => {
  try {
    const { error } = await supabase.from('profiles').select('count', { count: 'exact', head: true });
    
    if (error) {
      console.error('Supabase availability test failed:', error);
      Sentry.captureMessage('Supabase connection failed', {
        level: 'warning',
        extra: { error }
      });
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error checking Supabase availability:', error);
    Sentry.captureException(error);
    return false;
  }
};

/**
 * Execute a Supabase query with automatic retry on network errors
 */
export const executeWithRetry = async <T>(
  queryFn: () => Promise<T>,
  options = { maxRetries: 3, initialDelay: 1000 }
): Promise<T> => {
  const { maxRetries, initialDelay } = options;
  let attempts = 0;
  
  while (true) {
    try {
      return await queryFn();
    } catch (error) {
      attempts++;
      
      if (attempts >= maxRetries) {
        throw error;
      }
      
      // Check if it's worth retrying (network errors are retriable)
      const isRetriableError = error instanceof Error && 
        (error.message.includes('network') || 
         error.message.includes('connection') ||
         error.message.includes('offline') ||
         error.message.includes('failed to fetch'));
      
      if (!isRetriableError) {
        throw error;
      }
      
      // Wait before retrying with exponential backoff
      const delay = initialDelay * Math.pow(2, attempts - 1);
      await new Promise(resolve => setTimeout(resolve, delay));
      console.log(`Retrying Supabase query (attempt ${attempts + 1}/${maxRetries})...`);
    }
  }
};

// Add some event listeners for connection state
window.addEventListener('online', () => {
  console.log('Browser online - refreshing Supabase session');
  supabase.auth.refreshSession();
});

window.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') {
    console.log('Tab became visible - refreshing Supabase session');
    supabase.auth.refreshSession();
  }
});
