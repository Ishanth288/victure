
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

// Define valid table endpoints
type TableEndpoint = 'inventory' | 'bills' | 'purchase_orders';

// Type for error categories
export type ErrorType = 'connection' | 'database' | 'server' | 'unknown' | 'auth' | 'validation';

// Define result types for different data
type InventoryData = Array<any>;
type SalesData = Array<any>;
type SuppliersData = Array<any>;

// Result type for each endpoint
type EndpointDataMap = {
  'inventory': InventoryData;
  'bills': SalesData;
  'purchase_orders': SuppliersData;
}

export const useBusinessDataFetch = (endpoint: TableEndpoint) => {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [errorType, setErrorType] = useState<ErrorType>('unknown');
  
  const refetch = async () => {
    setIsLoading(true);
    setError(null);
    setErrorType('unknown');
    
    try {
      const { data: responseData, error: apiError } = await supabase
        .from(endpoint)
        .select('*');
      
      if (apiError) {
        throw apiError;
      }
      
      setData(responseData);
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
