
import { supabase } from "@/integrations/supabase/client";

// Enhanced connection manager with better error handling
export const connectionManager = {
  checkConnection: async (): Promise<boolean> => {
    try {
      // Check both network status and Supabase connectivity
      if (!navigator.onLine) {
        return false;
      }
      
      // Test Supabase connection with a lightweight query
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);
      
      try {
        await supabase.from('profiles').select('count', { 
          count: 'exact', 
          head: true 
        }).abortSignal(controller.signal);
        
        clearTimeout(timeoutId);
        return true;
      } catch (error: any) {
        clearTimeout(timeoutId);
        console.warn('Supabase connection test failed:', error.message);
        return false;
      }
    } catch (error) {
      console.warn('Connection check failed:', error);
      return false;
    }
  },

  attemptReconnect: async (maxAttempts: number = 3): Promise<boolean> => {
    console.log('Attempting reconnect...');
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      console.log(`Reconnection attempt ${attempt}/${maxAttempts}`);
      
      const isConnected = await connectionManager.checkConnection();
      if (isConnected) {
        console.log('✅ Reconnection successful');
        return true;
      }
      
      if (attempt < maxAttempts) {
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 8000); // Increased max delay
        console.log(`⏳ Waiting ${delay}ms before next attempt...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    console.error('❌ Max reconnection attempts reached');
    return false;
  },

  initialize: (): void => {
    console.log('Enhanced connection manager initialized');
    
    // Monitor online/offline status
    window.addEventListener('online', () => {
      console.log('🌐 Network connection restored');
    });
    
    window.addEventListener('offline', () => {
      console.warn('🚫 Network connection lost');
    });
  }
};

export const fetchWithRetry = async (
  url: string, 
  options: RequestInit = {},
  maxRetries: number = 2
): Promise<Response> => {
  let lastError: Error;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      return response;
    } catch (error: any) {
      lastError = error;
      console.warn(`Fetch attempt ${attempt + 1} failed:`, error.message);
      
      if (attempt < maxRetries) {
        const delay = Math.min(500 * Math.pow(2, attempt), 2000);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError;
};
