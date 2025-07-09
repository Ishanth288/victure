/**
 * Comprehensive Client-Side Timeout Handling System
 * Provides robust timeout management for all client-side operations
 */

import { CURRENT_CONFIG } from './performanceConfig';
import { useMemoryManager } from './memoryManager';
import { useCallback, useRef, useEffect } from 'react';

export interface TimeoutConfig {
  timeout: number;
  retries?: number;
  retryDelay?: number;
  onTimeout?: (attempt: number) => void;
  onRetry?: (attempt: number, error: Error) => void;
  onSuccess?: (result: any, attempt: number) => void;
  onFinalFailure?: (error: Error, attempts: number) => void;
  abortSignal?: AbortSignal;
  description?: string;
}

export interface TimeoutResult<T> {
  success: boolean;
  data?: T;
  error?: Error;
  attempts: number;
  duration: number;
}

/**
 * Enhanced timeout wrapper with retry logic and comprehensive error handling
 */
export class ClientTimeoutHandler {
  private static activeOperations = new Map<string, AbortController>();
  private static operationStats = new Map<string, {
    totalAttempts: number;
    successCount: number;
    failureCount: number;
    averageDuration: number;
  }>();

  /**
   * Execute a promise with timeout and retry logic
   */
  static async executeWithTimeout<T>(
    operation: () => Promise<T>,
    config: TimeoutConfig
  ): Promise<TimeoutResult<T>> {
    const {
      timeout,
      retries = 0,
      retryDelay = 1000,
      onTimeout,
      onRetry,
      onSuccess,
      onFinalFailure,
      abortSignal,
      description = 'Operation'
    } = config;

    const operationId = `${description}-${Date.now()}-${Math.random()}`;
    const controller = new AbortController();
    this.activeOperations.set(operationId, controller);

    // Combine external abort signal with internal controller
    if (abortSignal) {
      abortSignal.addEventListener('abort', () => {
        controller.abort();
      });
    }

    const startTime = Date.now();
    let lastError: Error | null = null;
    let attempts = 0;

    try {
      for (attempts = 0; attempts <= retries; attempts++) {
        try {
          // Create timeout promise
          const timeoutPromise = new Promise<never>((_, reject) => {
            const timeoutId = setTimeout(() => {
              const error = new Error(`${description} timeout after ${timeout}ms (attempt ${attempts + 1})`);
              error.name = 'TimeoutError';
              reject(error);
            }, timeout);

            // Clear timeout if operation is aborted
            controller.signal.addEventListener('abort', () => {
              clearTimeout(timeoutId);
              const error = new Error(`${description} was aborted`);
              error.name = 'AbortError';
              reject(error);
            });
          });

          // Race between operation and timeout
          const result = await Promise.race([
            operation(),
            timeoutPromise
          ]);

          // Success!
          const duration = Date.now() - startTime;
          this.updateStats(description, attempts + 1, true, duration);
          
          if (onSuccess) {
            onSuccess(result, attempts + 1);
          }

          return {
            success: true,
            data: result,
            attempts: attempts + 1,
            duration
          };

        } catch (error) {
          lastError = error as Error;
          
          // Handle timeout specifically
          if (lastError.name === 'TimeoutError') {
            if (onTimeout) {
              onTimeout(attempts + 1);
            }
            console.warn(`⏰ ${description} timed out on attempt ${attempts + 1}/${retries + 1}`);
          }

          // Handle abort
          if (lastError.name === 'AbortError') {
            console.log(`🛑 ${description} was aborted`);
            break;
          }

          // If we have more retries, wait and try again
          if (attempts < retries) {
            if (onRetry) {
              onRetry(attempts + 1, lastError);
            }
            
            const delay = retryDelay * Math.pow(1.5, attempts); // Exponential backoff
            console.warn(`🔄 Retrying ${description} in ${delay}ms (attempt ${attempts + 2}/${retries + 1})`);
            
            await new Promise(resolve => {
              const retryTimeout = setTimeout(resolve, delay);
              controller.signal.addEventListener('abort', () => {
                clearTimeout(retryTimeout);
                resolve(undefined);
              });
            });
            
            // Check if aborted during delay
            if (controller.signal.aborted) {
              break;
            }
          }
        }
      }

      // All attempts failed
      const duration = Date.now() - startTime;
      this.updateStats(description, attempts, false, duration);
      
      if (onFinalFailure && lastError) {
        onFinalFailure(lastError, attempts);
      }

      return {
        success: false,
        error: lastError || new Error(`${description} failed after ${attempts} attempts`),
        attempts,
        duration
      };

    } finally {
      this.activeOperations.delete(operationId);
    }
  }

  /**
   * Create a timeout wrapper for fetch requests
   */
  static createFetchWithTimeout(defaultTimeout: number = CURRENT_CONFIG.queryTimeout) {
    return async (url: string, options: RequestInit = {}): Promise<Response> => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), defaultTimeout);

      try {
        const response = await fetch(url, {
          ...options,
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        return response;
      } catch (error) {
        clearTimeout(timeoutId);
        if ((error as Error).name === 'AbortError') {
          throw new Error(`Fetch request to ${url} timed out after ${defaultTimeout}ms`);
        }
        throw error;
      }
    };
  }

  /**
   * Abort all active operations
   */
  static abortAllOperations(): void {
    console.log(`🛑 Aborting ${this.activeOperations.size} active operations`);
    this.activeOperations.forEach((controller, id) => {
      controller.abort();
    });
    this.activeOperations.clear();
  }

  /**
   * Get statistics about operations
   */
  static getOperationStats(): Record<string, any> {
    const stats: Record<string, any> = {};
    this.operationStats.forEach((stat, operation) => {
      stats[operation] = {
        ...stat,
        successRate: stat.totalAttempts > 0 ? (stat.successCount / stat.totalAttempts) * 100 : 0
      };
    });
    return stats;
  }

  /**
   * Clear operation statistics
   */
  static clearStats(): void {
    this.operationStats.clear();
  }

  private static updateStats(operation: string, attempts: number, success: boolean, duration: number): void {
    const current = this.operationStats.get(operation) || {
      totalAttempts: 0,
      successCount: 0,
      failureCount: 0,
      averageDuration: 0
    };

    current.totalAttempts += attempts;
    if (success) {
      current.successCount++;
    } else {
      current.failureCount++;
    }
    
    // Update average duration
    const totalOperations = current.successCount + current.failureCount;
    current.averageDuration = ((current.averageDuration * (totalOperations - 1)) + duration) / totalOperations;

    this.operationStats.set(operation, current);
  }
}

/**
 * React hook for timeout-aware operations
 */
export function useTimeoutOperation() {
  const { register } = useMemoryManager();
  const activeOperationsRef = useRef(new Set<string>());

  const executeWithTimeout = useCallback(async <T>(
    operation: () => Promise<T>,
    config: TimeoutConfig
  ): Promise<TimeoutResult<T>> => {
    const operationId = `hook-${Date.now()}-${Math.random()}`;
    activeOperationsRef.current.add(operationId);

    // Register cleanup
    register(operationId, 'timeout', () => {
      activeOperationsRef.current.delete(operationId);
    }, config.description);

    try {
      const result = await ClientTimeoutHandler.executeWithTimeout(operation, config);
      return result;
    } finally {
      activeOperationsRef.current.delete(operationId);
    }
  }, [register]);

  const abortAllOperations = useCallback(() => {
    ClientTimeoutHandler.abortAllOperations();
    activeOperationsRef.current.clear();
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      abortAllOperations();
    };
  }, [abortAllOperations]);

  return {
    executeWithTimeout,
    abortAllOperations,
    getStats: ClientTimeoutHandler.getOperationStats,
    activeOperationsCount: activeOperationsRef.current.size
  };
}

/**
 * Predefined timeout configurations for common operations
 */
export const TimeoutPresets = {
  // Quick UI operations
  UI_INTERACTION: {
    timeout: 2000,
    retries: 1,
    retryDelay: 500,
    description: 'UI Interaction'
  } as TimeoutConfig,

  // Database queries
  DATABASE_QUERY: {
    timeout: CURRENT_CONFIG.queryTimeout,
    retries: CURRENT_CONFIG.retryAttempts,
    retryDelay: CURRENT_CONFIG.retryDelay,
    description: 'Database Query'
  } as TimeoutConfig,

  // File uploads
  FILE_UPLOAD: {
    timeout: 30000,
    retries: 2,
    retryDelay: 2000,
    description: 'File Upload'
  } as TimeoutConfig,

  // API calls
  API_CALL: {
    timeout: 10000,
    retries: 2,
    retryDelay: 1000,
    description: 'API Call'
  } as TimeoutConfig,

  // Critical operations (no retries)
  CRITICAL: {
    timeout: 5000,
    retries: 0,
    description: 'Critical Operation'
  } as TimeoutConfig,

  // Background tasks
  BACKGROUND: {
    timeout: 60000,
    retries: 3,
    retryDelay: 5000,
    description: 'Background Task'
  } as TimeoutConfig
};

/**
 * Global timeout handler for unhandled promise rejections
 */
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    if (event.reason?.name === 'TimeoutError') {
      console.warn('🚨 Unhandled timeout error:', event.reason.message);
      // Prevent the error from being logged to console as unhandled
      event.preventDefault();
    }
  });

  // Cleanup on page unload
  window.addEventListener('beforeunload', () => {
    ClientTimeoutHandler.abortAllOperations();
  });
}

export default ClientTimeoutHandler;