
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface ConnectionOptions {
  maxRetries?: number;
  initialDelay?: number;
  maxDelay?: number;
  onReconnectSuccess?: () => void;
  onMaxRetriesExceeded?: () => void;
}

let reconnectionAttempts = 0;
let reconnectionTimer: ReturnType<typeof setTimeout> | null = null;
let isReconnecting = false;
let lastConnectionCheck = 0;
const CONNECTION_CHECK_THROTTLE = 5000; // 5 seconds

/**
 * Simple connection check without triggering cascading errors
 */
async function simpleConnectionCheck(): Promise<boolean> {
  try {
    // Throttle connection checks to prevent spam
    const now = Date.now();
    if (now - lastConnectionCheck < CONNECTION_CHECK_THROTTLE) {
      return true; // Assume connected if checked recently
    }
    lastConnectionCheck = now;

    // Use a very simple query with timeout
    const { error } = await Promise.race([
      supabase.from('profiles').select('count', { count: 'exact', head: true }),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Connection timeout')), 3000))
    ]) as any;
    
    return !error;
  } catch (error) {
    console.warn('Connection check failed (this is normal):', error);
    return false;
  }
}

/**
 * Manages connection state without causing error cascades
 */
export const connectionManager = {
  /**
   * Check if the connection is active
   */
  checkConnection: async (): Promise<boolean> => {
    try {
      const isConnected = await simpleConnectionCheck();
      
      if (isConnected && isReconnecting) {
        // Connection restored - reset state
        isReconnecting = false;
        reconnectionAttempts = 0;
        
        toast({
          title: "Connection restored",
          description: "Your connection has been re-established",
          variant: "default",
          duration: 3000
        });
      }
      
      return isConnected;
    } catch (error) {
      console.warn("Connection check failed:", error);
      return false;
    }
  },

  /**
   * Attempt to reconnect with exponential backoff
   */
  attemptReconnect: async (options: ConnectionOptions = {}): Promise<boolean> => {
    const {
      maxRetries = 3, // Reduced from 10 to prevent spam
      initialDelay = 2000, // Increased initial delay
      maxDelay = 30000,
      onReconnectSuccess,
      onMaxRetriesExceeded
    } = options;

    // Clear any existing reconnection timer
    if (reconnectionTimer) {
      clearTimeout(reconnectionTimer);
      reconnectionTimer = null;
    }

    // Check if max retries has been exceeded
    if (reconnectionAttempts >= maxRetries) {
      if (!isReconnecting) {
        toast({
          title: "Connection issues",
          description: "Please check your internet connection",
          variant: "destructive",
          duration: 5000
        });
      }
      
      reconnectionAttempts = 0;
      isReconnecting = false;
      
      if (onMaxRetriesExceeded) {
        onMaxRetriesExceeded();
      }
      
      return false;
    }

    // Check connection status
    const isConnected = await simpleConnectionCheck();
    
    if (isConnected) {
      // Connection restored
      if (isReconnecting) {
        toast({
          title: "Connection restored",
          description: "Your connection has been re-established",
          variant: "default",
          duration: 3000
        });
      }
      
      reconnectionAttempts = 0;
      isReconnecting = false;
      
      if (onReconnectSuccess) {
        onReconnectSuccess();
      }
      
      return true;
    } else {
      // Connection still failed, retry with exponential backoff
      reconnectionAttempts++;
      isReconnecting = true;
      
      // Calculate delay with exponential backoff
      const delay = Math.min(initialDelay * Math.pow(1.5, reconnectionAttempts - 1), maxDelay);
      
      // Schedule next reconnection attempt
      reconnectionTimer = setTimeout(() => {
        connectionManager.attemptReconnect(options);
      }, delay);
      
      return false;
    }
  },

  /**
   * Initialize connection management
   */
  initialize: (): void => {
    // Listen for online/offline events
    window.addEventListener('online', () => {
      connectionManager.checkConnection();
    });
    
    window.addEventListener('offline', () => {
      toast({
        title: "Connection lost",
        description: "Please check your internet connection",
        variant: "warning",
        duration: 5000
      });
    });
  }
};

// Helper to handle fetch requests with automatic retries
export const fetchWithRetry = async (
  url: string, 
  options: RequestInit = {}, 
  retryOptions: ConnectionOptions = {}
): Promise<Response> => {
  const {
    maxRetries = 2, // Reduced retries
    initialDelay = 1000,
    maxDelay = 8000
  } = retryOptions;
  
  let retries = 0;
  
  while (retries < maxRetries) {
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...options.headers,
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        }
      });
      
      return response;
    } catch (error) {
      retries++;
      
      if (retries >= maxRetries) {
        throw error;
      }
      
      // Calculate delay with exponential backoff
      const delay = Math.min(initialDelay * Math.pow(1.5, retries - 1), maxDelay);
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw new Error('Max retries exceeded');
};
