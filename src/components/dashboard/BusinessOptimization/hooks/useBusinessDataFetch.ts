
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

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
      // Use type assertion to specify the endpoint is a valid table name
      const { data: responseData, error: apiError } = await supabase
        .from(endpoint)
        .select('*');
      
      if (apiError) {
        throw apiError;
      }
      
      setData(responseData as EndpointDataMap[T]);
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
      setErrorType(determineErrorType(err));
      
      toast({
        title: "Error",
        description: `Failed to fetch data: ${err.message}`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refetch();
  }, [endpoint]);

  const determineErrorType = (errorObject: any): ErrorType => {
    if (!errorObject) return 'unknown';
    
    const message = errorObject.message || String(errorObject);
    
    if (message.includes('network') || message.includes('connection')) {
      return 'connection';
    } else if (message.includes('database')) {
      return 'database';
    } else if (message.includes('server')) {
      return 'server';
    } else if (message.includes('auth') || message.includes('login')) {
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
