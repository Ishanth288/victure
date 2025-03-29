
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { safeQueryData, getCurrentUserId } from '@/utils/safeSupabaseQueries';

// Define valid table endpoints
export type TableEndpoint = 'inventory' | 'bills' | 'purchase_orders';

// Type for error categories
export type ErrorType = 'connection' | 'database' | 'server' | 'unknown' | 'auth' | 'validation';

// Define result types for different data
export type InventoryData = Array<any>;
export type SalesData = Array<any>;
export type SuppliersData = Array<any>;

// Result type for each endpoint
export type EndpointDataMap = {
  'inventory': InventoryData;
  'bills': SalesData;
  'purchase_orders': SuppliersData;
}

export const useBusinessDataFetch = <T extends TableEndpoint>(endpoint: T) => {
  const [data, setData] = useState<EndpointDataMap[T] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [errorType, setErrorType] = useState<ErrorType>('unknown');
  
  const refetch = async () => {
    setIsLoading(true);
    setError(null);
    setErrorType('unknown');
    
    try {
      // First, check if user is authenticated
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError) {
        throw { message: 'Authentication error: ' + authError.message, type: 'auth' };
      }
      
      if (!authData.user) {
        throw { message: 'User not authenticated', type: 'auth' };
      }
      
      // Use the user_id to get only data belonging to the current user
      // Fix: Use the type-safe approach with proper casting for Supabase queries
      const query = supabase.from(endpoint);
      
      // We need to cast the query to avoid TypeScript errors with the filter
      const { data: responseData, error: apiError } = await (query as any)
        .select('*')
        .eq('user_id', authData.user.id);
      
      if (apiError) {
        throw apiError;
      }
      
      setData(responseData as EndpointDataMap[T]);
    } catch (err: any) {
      const errorMessage = err.message || 'An unexpected error occurred.';
      setError(errorMessage);
      setErrorType(determineErrorType(err));
      
      toast({
        title: "Error",
        description: `Failed to fetch data: ${errorMessage}`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refetch();
    
    // Setup real-time subscription to endpoint data for the current user
    const setupLiveUpdates = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      const channel = supabase
        .channel(`${endpoint}-changes`)
        .on('postgres_changes', 
          { event: '*', schema: 'public', table: endpoint, filter: `user_id=eq.${user.id}` }, 
          () => {
            console.log(`Changes detected in ${endpoint}, refreshing data`);
            refetch();
          })
        .subscribe();
        
      return () => {
        supabase.removeChannel(channel);
      };
    };
    
    const cleanup = setupLiveUpdates();
    return () => {
      if (cleanup) cleanup.then(unsub => unsub && unsub());
    };
  }, [endpoint]);

  const determineErrorType = (errorObject: any): ErrorType => {
    if (!errorObject) return 'unknown';
    
    // Check if the error object has a type property we can use directly
    if (errorObject.type && typeof errorObject.type === 'string') {
      if (['connection', 'database', 'server', 'auth', 'validation', 'unknown'].includes(errorObject.type)) {
        return errorObject.type as ErrorType;
      }
    }
    
    const message = errorObject.message || String(errorObject);
    
    if (message.includes('network') || message.includes('connection')) {
      return 'connection';
    } else if (message.includes('database')) {
      return 'database';
    } else if (message.includes('server')) {
      return 'server';
    } else if (message.includes('auth') || message.includes('login') || message.includes('authentication')) {
      return 'auth';
    } else if (message.includes('validation')) {
      return 'validation';
    }
    
    return 'unknown';
  };

  return { 
    data, 
    isLoading, 
    error, 
    errorType, 
    refetch 
  };
};
