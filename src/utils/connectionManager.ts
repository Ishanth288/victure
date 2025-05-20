
import { toast } from "@/hooks/use-toast";
import { checkSupabaseConnection } from "./supabaseErrorHandling";

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

/**
 * Manages connection state and implements reconnection logic with exponential backoff
 */
export const connectionManager = {
  /**
   * Check if the connection is active and attempt reconnection if not
   */
  checkConnection: async (): Promise<boolean> => {
    try {
      const isConnected = await checkSupabaseConnection();
      
      if (isConnected) {
        // If we were previously trying to reconnect, show success message
        if (isReconnecting) {
          toast({
            title: "Connection restored",
            description: "Your connection has been re-established",
            variant: "success",
            duration: 3000
          });
          isReconnecting = false;
          reconnectionAttempts = 0;
        }
        return true;
      } else {
        // Connection failed, attempt reconnection
        if (!isReconnecting) {
          isReconnecting = true;
          toast({
            title: "Connection lost",
            description: "Attempting to reconnect...",
            variant: "warning",
            duration: 5000
          });
        }
        return false;
      }
    } catch (error) {
      console.error("Error checking connection:", error);
      return false;
    }
  },

  /**
   * Attempt to reconnect with exponential backoff
   */
  attemptReconnect: async (options: ConnectionOptions = {}): Promise<boolean> => {
    const {
      maxRetries = 10,
      initialDelay = 1000,
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
      toast({
        title: "Connection failed",
        description: "Could not re-establish connection after multiple attempts",
        variant: "destructive",
        duration: 0 // Don't auto-dismiss this message
      });
      
      reconnectionAttempts = 0;
      isReconnecting = false;
      
      if (onMaxRetriesExceeded) {
        onMaxRetriesExceeded();
      }
      
      return false;
    }

    // Check connection status
    const isConnected = await checkSupabaseConnection();
    
    if (isConnected) {
      // Connection restored
      toast({
        title: "Connection restored",
        description: "Your connection has been re-established",
        variant: "success",
        duration: 3000
      });
      
      reconnectionAttempts = 0;
      isReconnecting = false;
      
      if (onReconnectSuccess) {
        onReconnectSuccess();
      }
      
      return true;
    } else {
      // Connection still failed, retry with exponential backoff
      reconnectionAttempts++;
      
      // Calculate delay with exponential backoff
      const delay = Math.min(initialDelay * Math.pow(1.5, reconnectionAttempts - 1), maxDelay);
      
      // Show reconnection attempt notification
      if (reconnectionAttempts > 1) {
        toast({
          title: "Reconnecting...",
          description: `Attempt ${reconnectionAttempts} of ${maxRetries}`,
          variant: "warning",
          duration: 3000
        });
      }
      
      // Schedule next reconnection attempt
      reconnectionTimer = setTimeout(() => {
        connectionManager.attemptReconnect(options);
      }, delay);
      
      return false;
    }
  },

  /**
   * Cache data locally to prevent data loss during reconnection
   */
  cacheData: (key: string, data: any): void => {
    try {
      localStorage.setItem(`connection_cache_${key}`, JSON.stringify({
        timestamp: Date.now(),
        data
      }));
    } catch (error) {
      console.error("Error caching data:", error);
    }
  },

  /**
   * Retrieve cached data
   */
  getCachedData: (key: string, maxAge = 3600000): any => {
    try {
      const cachedItem = localStorage.getItem(`connection_cache_${key}`);
      
      if (cachedItem) {
        const { timestamp, data } = JSON.parse(cachedItem);
        
        // Check if cached data is still valid (not expired)
        if (Date.now() - timestamp < maxAge) {
          return data;
        }
      }
    } catch (error) {
      console.error("Error retrieving cached data:", error);
    }
    
    return null;
  },

  /**
   * Initialize connection management
   */
  initialize: (): void => {
    // Listen for online/offline events
    window.addEventListener('online', () => {
      toast({
        title: "Back online",
        description: "Checking connection status...",
        variant: "info",
        duration: 3000
      });
      connectionManager.checkConnection();
    });
    
    window.addEventListener('offline', () => {
      toast({
        title: "Offline",
        description: "Please check your internet connection",
        variant: "warning",
        duration: 5000
      });
    });
    
    // Perform initial connection check
    connectionManager.checkConnection();
  }
};

// Helper to handle fetch requests with automatic retries
export const fetchWithRetry = async (
  url: string, 
  options: RequestInit = {}, 
  retryOptions: ConnectionOptions = {}
): Promise<Response> => {
  const {
    maxRetries = 3,
    initialDelay = 1000,
    maxDelay = 8000
  } = retryOptions;
  
  let retries = 0;
  
  while (true) {
    try {
      const response = await fetch(url, {
        ...options,
        // Add cache control to avoid caching during development
        headers: {
          ...options.headers,
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
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
};
