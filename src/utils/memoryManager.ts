/**
 * Memory Management Utilities
 * Provides cleanup mechanisms for subscriptions, intervals, and other resources
 */

import { useEffect, useRef, useCallback } from 'react';
import { CURRENT_CONFIG } from './performanceConfig';

export interface CleanupFunction {
  (): void;
}

export interface ResourceTracker {
  id: string;
  type: 'interval' | 'timeout' | 'subscription' | 'listener' | 'observer' | 'other';
  cleanup: CleanupFunction;
  createdAt: number;
  description?: string;
}

export class MemoryManager {
  private resources: Map<string, ResourceTracker> = new Map();
  private cleanupCallbacks: Set<CleanupFunction> = new Set();
  private isDestroyed = false;
  private memoryCheckInterval?: NodeJS.Timeout;

  constructor(private enableLogging = CURRENT_CONFIG.enableVerboseLogging) {
    this.startMemoryMonitoring();
  }

  /**
   * Register a resource for cleanup
   */
  register(
    id: string,
    type: ResourceTracker['type'],
    cleanup: CleanupFunction,
    description?: string
  ): void {
    if (this.isDestroyed) {
      console.warn('MemoryManager: Attempting to register resource after destruction');
      return;
    }

    const resource: ResourceTracker = {
      id,
      type,
      cleanup,
      createdAt: Date.now(),
      description
    };

    this.resources.set(id, resource);

    if (this.enableLogging) {
      console.log(`🔧 Registered ${type} resource: ${id}${description ? ` (${description})` : ''}`);
    }
  }

  /**
   * Unregister and cleanup a specific resource
   */
  unregister(id: string): boolean {
    const resource = this.resources.get(id);
    if (!resource) {
      return false;
    }

    try {
      resource.cleanup();
      this.resources.delete(id);

      if (this.enableLogging) {
        console.log(`🧹 Cleaned up ${resource.type} resource: ${id}`);
      }
      return true;
    } catch (error) {
      console.error(`Failed to cleanup resource ${id}:`, error);
      this.resources.delete(id); // Remove even if cleanup failed
      return false;
    }
  }

  /**
   * Register a general cleanup callback
   */
  addCleanupCallback(callback: CleanupFunction): void {
    this.cleanupCallbacks.add(callback);
  }

  /**
   * Remove a cleanup callback
   */
  removeCleanupCallback(callback: CleanupFunction): void {
    this.cleanupCallbacks.delete(callback);
  }

  /**
   * Clean up all resources and callbacks
   */
  cleanup(): void {
    if (this.isDestroyed) {
      return;
    }

    // Cleanup all registered resources
    const resourceIds = Array.from(this.resources.keys());
    let cleanedCount = 0;
    let failedCount = 0;

    for (const id of resourceIds) {
      if (this.unregister(id)) {
        cleanedCount++;
      } else {
        failedCount++;
      }
    }

    // Execute cleanup callbacks
    this.cleanupCallbacks.forEach(callback => {
      try {
        callback();
      } catch (error) {
        console.error('Cleanup callback failed:', error);
      }
    });
    this.cleanupCallbacks.clear();

    // Stop memory monitoring
    if (this.memoryCheckInterval) {
      clearInterval(this.memoryCheckInterval);
      this.memoryCheckInterval = undefined;
    }

    this.isDestroyed = true;

    if (this.enableLogging) {
      console.log(`🧹 MemoryManager cleanup complete: ${cleanedCount} cleaned, ${failedCount} failed`);
    }
  }

  /**
   * Get statistics about managed resources
   */
  getStats(): {
    totalResources: number;
    resourcesByType: Record<string, number>;
    oldestResource?: { id: string; age: number };
    averageAge: number;
  } {
    const resources = Array.from(this.resources.values());
    const now = Date.now();
    
    const resourcesByType = resources.reduce((acc, resource) => {
      acc[resource.type] = (acc[resource.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const ages = resources.map(r => now - r.createdAt);
    const averageAge = ages.length > 0 ? ages.reduce((sum, age) => sum + age, 0) / ages.length : 0;
    
    const oldestResource = resources.reduce((oldest, current) => {
      if (!oldest || current.createdAt < oldest.createdAt) {
        return current;
      }
      return oldest;
    }, null as ResourceTracker | null);

    return {
      totalResources: resources.length,
      resourcesByType,
      oldestResource: oldestResource ? {
        id: oldestResource.id,
        age: now - oldestResource.createdAt
      } : undefined,
      averageAge
    };
  }

  /**
   * Force cleanup of resources older than specified age
   */
  cleanupOldResources(maxAge: number = 300000): number { // 5 minutes default
    const now = Date.now();
    const oldResources = Array.from(this.resources.entries())
      .filter(([, resource]) => now - resource.createdAt > maxAge);

    let cleanedCount = 0;
    for (const [id] of oldResources) {
      if (this.unregister(id)) {
        cleanedCount++;
      }
    }

    if (cleanedCount > 0 && this.enableLogging) {
      console.log(`🧹 Cleaned up ${cleanedCount} old resources (older than ${maxAge}ms)`);
    }

    return cleanedCount;
  }

  private startMemoryMonitoring(): void {
    // Check for old resources every 2 minutes
    this.memoryCheckInterval = setInterval(() => {
      this.cleanupOldResources();
      
      if (this.enableLogging) {
        const stats = this.getStats();
        if (stats.totalResources > 10) {
          console.warn(`⚠️ High resource count: ${stats.totalResources} resources managed`);
        }
      }
    }, 120000);
  }
}

// Global memory manager instance
export const globalMemoryManager = new MemoryManager();

// Cleanup on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    globalMemoryManager.cleanup();
  });
}

/**
 * React hook for automatic cleanup management
 */
export function useCleanupEffect(
  cleanup: CleanupFunction,
  deps: React.DependencyList
): void {
  useEffect(() => {
    return cleanup;
  }, deps);
}

/**
 * React hook for managing multiple cleanup functions
 */
export function useMemoryManager(): {
  register: (id: string, type: ResourceTracker['type'], cleanup: CleanupFunction, description?: string) => void;
  unregister: (id: string) => boolean;
  addCleanup: (callback: CleanupFunction) => void;
  getStats: () => ReturnType<MemoryManager['getStats']>;
} {
  const managerRef = useRef<MemoryManager | null>(null);

  if (!managerRef.current) {
    managerRef.current = new MemoryManager();
  }

  const manager = managerRef.current;

  useEffect(() => {
    return () => {
      manager.cleanup();
    };
  }, [manager]);

  const register = useCallback(
    (id: string, type: ResourceTracker['type'], cleanup: CleanupFunction, description?: string) => {
      manager.register(id, type, cleanup, description);
    },
    [manager]
  );

  const unregister = useCallback(
    (id: string) => manager.unregister(id),
    [manager]
  );

  const addCleanup = useCallback(
    (callback: CleanupFunction) => manager.addCleanupCallback(callback),
    [manager]
  );

  const getStats = useCallback(
    () => manager.getStats(),
    [manager]
  );

  return { register, unregister, addCleanup, getStats };
}

/**
 * Hook for managing intervals with automatic cleanup
 */
export function useInterval(
  callback: () => void,
  delay: number | null,
  description?: string
): {
  start: () => void;
  stop: () => void;
  isRunning: boolean;
} {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const callbackRef = useRef(callback);
  const { register, unregister } = useMemoryManager();
  const isRunningRef = useRef(false);

  // Update callback ref when callback changes
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  const start = useCallback(() => {
    if (delay === null || isRunningRef.current) return;

    const id = `interval-${Date.now()}-${Math.random()}`;
    intervalRef.current = setInterval(() => {
      callbackRef.current();
    }, delay);
    
    isRunningRef.current = true;
    
    register(id, 'interval', () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
        isRunningRef.current = false;
      }
    }, description);
  }, [delay, register, description]);

  const stop = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
      isRunningRef.current = false;
    }
  }, []);

  useEffect(() => {
    if (delay !== null) {
      start();
    }
    return stop;
  }, [delay, start, stop]);

  return {
    start,
    stop,
    isRunning: isRunningRef.current
  };
}

/**
 * Hook for managing timeouts with automatic cleanup
 */
export function useTimeout(
  callback: () => void,
  delay: number | null,
  description?: string
): {
  start: () => void;
  stop: () => void;
  restart: () => void;
} {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const callbackRef = useRef(callback);
  const { register, unregister } = useMemoryManager();

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  const stop = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const start = useCallback(() => {
    if (delay === null) return;

    stop(); // Clear any existing timeout
    
    const id = `timeout-${Date.now()}-${Math.random()}`;
    timeoutRef.current = setTimeout(() => {
      callbackRef.current();
      timeoutRef.current = null;
    }, delay);
    
    register(id, 'timeout', stop, description);
  }, [delay, stop, register, description]);

  const restart = useCallback(() => {
    stop();
    start();
  }, [stop, start]);

  useEffect(() => {
    return stop;
  }, [stop]);

  return { start, stop, restart };
}

/**
 * Hook for managing event listeners with automatic cleanup
 */
export function useEventListener<T extends keyof WindowEventMap>(
  eventType: T,
  handler: (event: WindowEventMap[T]) => void,
  element: Window | Document | Element = window,
  options?: boolean | AddEventListenerOptions
): void {
  const handlerRef = useRef(handler);
  const { register } = useMemoryManager();

  useEffect(() => {
    handlerRef.current = handler;
  }, [handler]);

  useEffect(() => {
    if (!element) return;

    const eventHandler = (event: Event) => {
      handlerRef.current(event as WindowEventMap[T]);
    };

    element.addEventListener(eventType, eventHandler, options);
    
    const id = `listener-${eventType}-${Date.now()}`;
    register(id, 'listener', () => {
      element.removeEventListener(eventType, eventHandler, options);
    }, `${eventType} listener`);

    return () => {
      element.removeEventListener(eventType, eventHandler, options);
    };
  }, [eventType, element, options, register]);
}