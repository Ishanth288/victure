
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

/**
 * Robust error recovery utilities for business-critical operations
 */

interface RetryOptions {
  maxAttempts?: number;
  delay?: number;
  backoffMultiplier?: number;
  onRetry?: (attempt: number, error: any) => void;
}

export async function withRetry<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxAttempts = 3,
    delay = 1000,
    backoffMultiplier = 2,
    onRetry
  } = options;

  let lastError: any;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      
      if (attempt === maxAttempts) {
        break;
      }

      if (onRetry) {
        onRetry(attempt, error);
      }

      // Wait before retrying with exponential backoff
      await new Promise(resolve => 
        setTimeout(resolve, delay * Math.pow(backoffMultiplier, attempt - 1))
      );
    }
  }

  throw lastError;
}

export async function robustInventoryFetch(userId: string) {
  return withRetry(
    async () => {
      const { data, error } = await supabase
        .from('inventory')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(`Database error: ${error.message}`);
      }

      return data || [];
    },
    {
      maxAttempts: 3,
      delay: 1000,
      onRetry: (attempt, error) => {
        console.warn(`Inventory fetch attempt ${attempt} failed:`, error);
        if (attempt === 2) {
          toast({
            title: "Connection Issue",
            description: "Retrying to load inventory data...",
          });
        }
      }
    }
  );
}

export async function robustDataInsert(
  table: 'inventory' | 'patients' | 'bills' | 'prescriptions',
  data: any,
  selectColumns: string = '*'
): Promise<any> {
  return withRetry(
    async () => {
      const { data: result, error } = await supabase
        .from(table)
        .insert(data)
        .select(selectColumns)
        .single();

      if (error) {
        throw new Error(`Insert failed: ${error.message}`);
      }

      return result;
    },
    {
      maxAttempts: 2,
      delay: 500,
      onRetry: (attempt, error) => {
        console.warn(`Insert attempt ${attempt} failed:`, error);
      }
    }
  );
}

export function handleBusinessCriticalError(error: any, context: string) {
  console.error(`BUSINESS CRITICAL ERROR [${context}]:`, error);
  
  const userMessage = error?.message?.includes('network') 
    ? 'Network connection lost. Please check your internet and try again.'
    : error?.message?.includes('auth')
    ? 'Session expired. Please sign in again.'
    : `System error in ${context}. Please contact support if this continues.`;

  toast({
    title: "Critical Error",
    description: userMessage,
    variant: "destructive",
  });

  // Log for business monitoring
  if (typeof window !== 'undefined') {
    (window as any).criticalErrors = (window as any).criticalErrors || [];
    (window as any).criticalErrors.push({
      context,
      error: error.message,
      timestamp: new Date().toISOString(),
      userId: null // Add user ID if available
    });
  }
}
