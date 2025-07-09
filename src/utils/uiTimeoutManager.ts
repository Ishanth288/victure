/**
 * UI Timeout Manager
 * Specialized timeout handling for user interface interactions and browser operations
 */

import React, { useCallback, useRef, useEffect, useState } from 'react';
import { ClientTimeoutHandler, TimeoutConfig, TimeoutResult } from './clientTimeoutHandler';
import { toast } from '@/hooks/use-toast';

export interface UITimeoutConfig extends TimeoutConfig {
  showUserFeedback?: boolean;
  gracefulDegradation?: boolean;
  fallbackAction?: () => void;
  userMessage?: string;
}

export interface UIOperationState {
  isLoading: boolean;
  hasTimedOut: boolean;
  attempts: number;
  error?: Error;
}

/**
 * UI-specific timeout manager with user feedback and graceful degradation
 */
export class UITimeoutManager {
  private static pendingOperations = new Map<string, {
    controller: AbortController;
    startTime: number;
    config: UITimeoutConfig;
  }>();

  /**
   * Execute UI operation with timeout and user feedback
   */
  static async executeUIOperation<T>(
    operation: () => Promise<T>,
    config: UITimeoutConfig
  ): Promise<TimeoutResult<T>> {
    const operationId = `ui-${Date.now()}-${Math.random()}`;
    const controller = new AbortController();
    
    this.pendingOperations.set(operationId, {
      controller,
      startTime: Date.now(),
      config
    });

    const enhancedConfig: TimeoutConfig = {
      ...config,
      abortSignal: controller.signal,
      onTimeout: (attempt) => {
        if (config.showUserFeedback) {
          this.showTimeoutFeedback(config, attempt);
        }
        config.onTimeout?.(attempt);
      },
      onRetry: (attempt, error) => {
        if (config.showUserFeedback) {
          this.showRetryFeedback(config, attempt);
        }
        config.onRetry?.(attempt, error);
      },
      onFinalFailure: (error, attempts) => {
        if (config.gracefulDegradation && config.fallbackAction) {
          console.log(`🔄 Executing fallback action for ${config.description}`);
          config.fallbackAction();
        }
        
        if (config.showUserFeedback) {
          this.showFailureFeedback(config, error, attempts);
        }
        
        config.onFinalFailure?.(error, attempts);
      }
    };

    try {
      const result = await ClientTimeoutHandler.executeWithTimeout(operation, enhancedConfig);
      
      if (result.success && config.showUserFeedback && result.attempts > 1) {
        this.showSuccessFeedback(config, result.attempts);
      }
      
      return result;
    } finally {
      this.pendingOperations.delete(operationId);
    }
  }

  /**
   * Create a timeout-aware click handler
   */
  static createTimeoutAwareClickHandler(
    handler: () => Promise<void>,
    config: UITimeoutConfig = {}
  ) {
    return async (event: React.MouseEvent) => {
      event.preventDefault();
      
      const button = event.currentTarget as HTMLButtonElement;
      const originalText = button.textContent;
      
      // Disable button during operation
      button.disabled = true;
      if (config.showUserFeedback) {
        button.textContent = 'Loading...';
      }

      try {
        await this.executeUIOperation(handler, {
          timeout: 5000,
          retries: 1,
          showUserFeedback: true,
          description: 'Button Click',
          ...config
        });
      } finally {
        // Re-enable button
        button.disabled = false;
        if (originalText) {
          button.textContent = originalText;
        }
      }
    };
  }

  /**
   * Create timeout-aware form submission handler
   */
  static createTimeoutAwareFormHandler(
    handler: (formData: FormData) => Promise<void>,
    config: UITimeoutConfig = {}
  ) {
    return async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      
      const form = event.currentTarget;
      const formData = new FormData(form);
      const submitButton = form.querySelector('button[type="submit"]') as HTMLButtonElement;
      
      if (submitButton) {
        submitButton.disabled = true;
      }

      try {
        await this.executeUIOperation(() => handler(formData), {
          timeout: 10000,
          retries: 1,
          showUserFeedback: true,
          description: 'Form Submission',
          ...config
        });
      } finally {
        if (submitButton) {
          submitButton.disabled = false;
        }
      }
    };
  }

  /**
   * Abort all pending UI operations
   */
  static abortAllUIOperations(): void {
    console.log(`🛑 Aborting ${this.pendingOperations.size} pending UI operations`);
    this.pendingOperations.forEach(({ controller }, id) => {
      controller.abort();
    });
    this.pendingOperations.clear();
  }

  /**
   * Get pending operations info
   */
  static getPendingOperations(): Array<{
    id: string;
    duration: number;
    description?: string;
  }> {
    const now = Date.now();
    return Array.from(this.pendingOperations.entries()).map(([id, { startTime, config }]) => ({
      id,
      duration: now - startTime,
      description: config.description
    }));
  }

  private static showTimeoutFeedback(config: UITimeoutConfig, attempt: number): void {
    const message = config.userMessage || `${config.description || 'Operation'} is taking longer than expected...`;
    
    toast({
      title: "Taking longer than expected",
      description: `${message} (Attempt ${attempt})`,
      variant: "default",
      duration: 3000
    });
  }

  private static showRetryFeedback(config: UITimeoutConfig, attempt: number): void {
    toast({
      title: "Retrying...",
      description: `Attempting ${config.description || 'operation'} again (${attempt})`,
      variant: "default",
      duration: 2000
    });
  }

  private static showFailureFeedback(config: UITimeoutConfig, error: Error, attempts: number): void {
    const message = config.userMessage || `${config.description || 'Operation'} failed after ${attempts} attempts`;
    
    toast({
      title: "Operation Failed",
      description: message,
      variant: "destructive",
      duration: 5000
    });
  }

  private static showSuccessFeedback(config: UITimeoutConfig, attempts: number): void {
    if (attempts > 1) {
      toast({
        title: "Success",
        description: `${config.description || 'Operation'} completed after ${attempts} attempts`,
        variant: "default",
        duration: 2000
      });
    }
  }
}

/**
 * React hook for UI timeout operations with state management
 */
export function useUITimeout() {
  const [operationStates, setOperationStates] = useState<Map<string, UIOperationState>>(new Map());
  const operationCounterRef = useRef(0);

  const executeUIOperation = useCallback(async <T>(
    operation: () => Promise<T>,
    config: UITimeoutConfig = {}
  ): Promise<TimeoutResult<T>> => {
    const operationId = `ui-hook-${++operationCounterRef.current}`;
    
    // Set initial state
    setOperationStates(prev => new Map(prev.set(operationId, {
      isLoading: true,
      hasTimedOut: false,
      attempts: 0
    })));

    const enhancedConfig: UITimeoutConfig = {
      ...config,
      onTimeout: (attempt) => {
        setOperationStates(prev => {
          const current = prev.get(operationId) || { isLoading: true, hasTimedOut: false, attempts: 0 };
          return new Map(prev.set(operationId, {
            ...current,
            hasTimedOut: true,
            attempts: attempt
          }));
        });
        config.onTimeout?.(attempt);
      },
      onRetry: (attempt, error) => {
        setOperationStates(prev => {
          const current = prev.get(operationId) || { isLoading: true, hasTimedOut: false, attempts: 0 };
          return new Map(prev.set(operationId, {
            ...current,
            attempts: attempt,
            error
          }));
        });
        config.onRetry?.(attempt, error);
      },
      onFinalFailure: (error, attempts) => {
        setOperationStates(prev => new Map(prev.set(operationId, {
          isLoading: false,
          hasTimedOut: true,
          attempts,
          error
        })));
        config.onFinalFailure?.(error, attempts);
      }
    };

    try {
      const result = await UITimeoutManager.executeUIOperation(operation, enhancedConfig);
      
      // Update final state
      setOperationStates(prev => new Map(prev.set(operationId, {
        isLoading: false,
        hasTimedOut: !result.success,
        attempts: result.attempts,
        error: result.error
      })));
      
      return result;
    } catch (error) {
      setOperationStates(prev => new Map(prev.set(operationId, {
        isLoading: false,
        hasTimedOut: true,
        attempts: 0,
        error: error as Error
      })));
      throw error;
    }
  }, []);

  const clearOperationState = useCallback((operationId: string) => {
    setOperationStates(prev => {
      const newMap = new Map(prev);
      newMap.delete(operationId);
      return newMap;
    });
  }, []);

  const clearAllOperationStates = useCallback(() => {
    setOperationStates(new Map());
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      UITimeoutManager.abortAllUIOperations();
    };
  }, []);

  return {
    executeUIOperation,
    operationStates,
    clearOperationState,
    clearAllOperationStates,
    createClickHandler: UITimeoutManager.createTimeoutAwareClickHandler,
    createFormHandler: UITimeoutManager.createTimeoutAwareFormHandler,
    getPendingOperations: UITimeoutManager.getPendingOperations
  };
}

/**
 * Higher-order component for timeout-aware components
 */
export function withUITimeout<P extends object>(
  Component: React.ComponentType<P>,
  defaultConfig: UITimeoutConfig = {}
) {
  return function TimeoutAwareComponent(props: P) {
    const { executeUIOperation } = useUITimeout();
    
    const enhancedProps = {
      ...props,
      executeUIOperation: (operation: () => Promise<any>, config?: UITimeoutConfig) =>
        executeUIOperation(operation, { ...defaultConfig, ...config })
    };

    return React.createElement(Component, enhancedProps);
  };
}

/**
 * Predefined UI timeout configurations
 */
export const UITimeoutPresets = {
  QUICK_ACTION: {
    timeout: 3000,
    retries: 1,
    showUserFeedback: true,
    gracefulDegradation: true,
    description: 'Quick Action'
  } as UITimeoutConfig,

  FORM_SUBMISSION: {
    timeout: 10000,
    retries: 2,
    retryDelay: 2000,
    showUserFeedback: true,
    gracefulDegradation: true,
    description: 'Form Submission'
  } as UITimeoutConfig,

  DATA_LOADING: {
    timeout: 8000,
    retries: 2,
    retryDelay: 1500,
    showUserFeedback: true,
    gracefulDegradation: true,
    description: 'Data Loading'
  } as UITimeoutConfig,

  SEARCH_OPERATION: {
    timeout: 5000,
    retries: 1,
    retryDelay: 1000,
    showUserFeedback: false, // Usually too fast for feedback
    gracefulDegradation: true,
    description: 'Search'
  } as UITimeoutConfig,

  CRITICAL_ACTION: {
    timeout: 15000,
    retries: 3,
    retryDelay: 3000,
    showUserFeedback: true,
    gracefulDegradation: false, // Don't degrade critical actions
    description: 'Critical Action'
  } as UITimeoutConfig
};

export default UITimeoutManager;