/**
 * Progressive Loading System for Dashboard Components
 * Loads critical data first, then secondary data to improve perceived performance
 */

import { useState, useEffect, useCallback } from 'react';
import { CURRENT_CONFIG } from './performanceConfig';
import { safeSupabaseQuery, QueryOptions } from './supabaseErrorHandling';
import { globalCache, createCacheKey } from './smartCache';

export interface LoadingPriority {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3
}

export interface DataLoader<T> {
  key: string;
  priority: number;
  loader: () => Promise<T>;
  dependencies?: string[]; // Keys of other loaders this depends on
  cacheKey?: string;
  cacheTTL?: number;
  retryOnError?: boolean;
}

export interface LoadingState {
  isLoading: boolean;
  hasError: boolean;
  error?: string;
  progress: number; // 0-100
  completedLoaders: string[];
  failedLoaders: string[];
}

export class ProgressiveDataLoader {
  private loaders: Map<string, DataLoader<any>> = new Map();
  private results: Map<string, any> = new Map();
  private loadingState: LoadingState = {
    isLoading: false,
    hasError: false,
    progress: 0,
    completedLoaders: [],
    failedLoaders: []
  };
  private listeners: Set<(state: LoadingState, results: Map<string, any>) => void> = new Set();
  private abortController: AbortController | null = null;

  addLoader<T>(loader: DataLoader<T>): void {
    this.loaders.set(loader.key, loader);
  }

  removeLoader(key: string): void {
    this.loaders.delete(key);
    this.results.delete(key);
  }

  subscribe(listener: (state: LoadingState, results: Map<string, any>) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => {
      try {
        listener({ ...this.loadingState }, new Map(this.results));
      } catch (error) {
        console.error('Error in progressive loader listener:', error);
      }
    });
  }

  async loadAll(): Promise<Map<string, any>> {
    if (this.loadingState.isLoading) {
      console.warn('Progressive loading already in progress');
      return this.results;
    }

    this.abortController = new AbortController();
    this.loadingState = {
      isLoading: true,
      hasError: false,
      progress: 0,
      completedLoaders: [],
      failedLoaders: []
    };
    this.results.clear();
    this.notifyListeners();

    try {
      // Sort loaders by priority
      const sortedLoaders = Array.from(this.loaders.entries())
        .sort(([, a], [, b]) => a.priority - b.priority);

      const totalLoaders = sortedLoaders.length;
      let completedCount = 0;

      // Load critical data first (priority 0)
      const criticalLoaders = sortedLoaders.filter(([, loader]) => loader.priority === 0);
      if (criticalLoaders.length > 0) {
        await this.loadBatch(criticalLoaders, 'critical');
        completedCount += criticalLoaders.length;
        this.updateProgress(completedCount, totalLoaders);
      }

      // Load remaining data in batches by priority
      const remainingLoaders = sortedLoaders.filter(([, loader]) => loader.priority > 0);
      const priorityGroups = this.groupByPriority(remainingLoaders);

      for (const [priority, loaders] of priorityGroups) {
        if (this.abortController?.signal.aborted) break;
        
        // Add small delay between priority groups to prevent overwhelming
        if (priority > 0) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        await this.loadBatch(loaders, `priority-${priority}`);
        completedCount += loaders.length;
        this.updateProgress(completedCount, totalLoaders);
      }

      this.loadingState.isLoading = false;
      this.loadingState.progress = 100;
      this.notifyListeners();

    } catch (error: any) {
      this.loadingState.isLoading = false;
      this.loadingState.hasError = true;
      this.loadingState.error = error.message;
      this.notifyListeners();
      console.error('Progressive loading failed:', error);
    }

    return this.results;
  }

  private async loadBatch(
    loaders: Array<[string, DataLoader<any>]>, 
    batchName: string
  ): Promise<void> {
    if (CURRENT_CONFIG.enableVerboseLogging) {
      console.log(`🚀 Loading ${batchName} batch: ${loaders.map(([key]) => key).join(', ')}`);
    }

    // Check dependencies first
    const readyLoaders = loaders.filter(([, loader]) => 
      this.areDependenciesMet(loader.dependencies || [])
    );

    if (readyLoaders.length === 0) {
      console.warn(`No ready loaders in ${batchName} batch due to unmet dependencies`);
      return;
    }

    // Load in parallel with concurrency limit
    const concurrencyLimit = Math.min(CURRENT_CONFIG.maxConcurrentQueries, readyLoaders.length);
    const chunks = this.chunkArray(readyLoaders, concurrencyLimit);

    for (const chunk of chunks) {
      if (this.abortController?.signal.aborted) break;
      
      const promises = chunk.map(([key, loader]) => this.loadSingle(key, loader));
      await Promise.allSettled(promises);
    }
  }

  private async loadSingle(key: string, loader: DataLoader<any>): Promise<void> {
    try {
      // Check cache first if enabled
      if (loader.cacheKey) {
        const cached = await globalCache.get(loader.cacheKey);
        if (cached !== null) {
          this.results.set(key, cached);
          this.loadingState.completedLoaders.push(key);
          if (CURRENT_CONFIG.enableVerboseLogging) {
            console.log(`📦 Cache hit for ${key}`);
          }
          return;
        }
      }

      // Execute loader
      const result = await loader.loader();
      this.results.set(key, result);
      this.loadingState.completedLoaders.push(key);

      // Cache result if specified
      if (loader.cacheKey && result) {
        await globalCache.set(loader.cacheKey, result, loader.cacheTTL);
      }

      if (CURRENT_CONFIG.enableVerboseLogging) {
        console.log(`✅ Loaded ${key}`);
      }

    } catch (error: any) {
      this.loadingState.failedLoaders.push(key);
      console.error(`❌ Failed to load ${key}:`, error.message);

      if (loader.retryOnError && !this.abortController?.signal.aborted) {
        // Retry once after a short delay
        setTimeout(async () => {
          try {
            const result = await loader.loader();
            this.results.set(key, result);
            this.loadingState.completedLoaders.push(key);
            // Remove from failed list
            const failedIndex = this.loadingState.failedLoaders.indexOf(key);
            if (failedIndex > -1) {
              this.loadingState.failedLoaders.splice(failedIndex, 1);
            }
            this.notifyListeners();
          } catch (retryError) {
            console.error(`❌ Retry failed for ${key}:`, retryError);
          }
        }, 1000);
      }
    }
  }

  private areDependenciesMet(dependencies: string[]): boolean {
    return dependencies.every(dep => this.loadingState.completedLoaders.includes(dep));
  }

  private groupByPriority(
    loaders: Array<[string, DataLoader<any>]>
  ): Map<number, Array<[string, DataLoader<any>]>> {
    const groups = new Map<number, Array<[string, DataLoader<any>]>>();
    
    loaders.forEach(([key, loader]) => {
      const priority = loader.priority;
      if (!groups.has(priority)) {
        groups.set(priority, []);
      }
      groups.get(priority)!.push([key, loader]);
    });
    
    return new Map([...groups.entries()].sort(([a], [b]) => a - b));
  }

  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  private updateProgress(completed: number, total: number): void {
    this.loadingState.progress = total > 0 ? Math.round((completed / total) * 100) : 0;
    this.notifyListeners();
  }

  abort(): void {
    if (this.abortController) {
      this.abortController.abort();
      this.loadingState.isLoading = false;
      this.notifyListeners();
    }
  }

  getResult<T>(key: string): T | undefined {
    return this.results.get(key);
  }

  getState(): LoadingState {
    return { ...this.loadingState };
  }

  clear(): void {
    this.abort();
    this.loaders.clear();
    this.results.clear();
    this.loadingState = {
      isLoading: false,
      hasError: false,
      progress: 0,
      completedLoaders: [],
      failedLoaders: []
    };
  }
}

// React hook for progressive loading
export function useProgressiveDataLoading() {
  const [loader] = useState(() => new ProgressiveDataLoader());
  const [state, setState] = useState<LoadingState>(loader.getState());
  const [results, setResults] = useState<Map<string, any>>(new Map());

  useEffect(() => {
    const unsubscribe = loader.subscribe((newState, newResults) => {
      setState(newState);
      setResults(newResults);
    });

    return () => {
      unsubscribe();
      loader.clear();
    };
  }, [loader]);

  const addLoader = useCallback(<T>(loaderConfig: DataLoader<T>) => {
    loader.addLoader(loaderConfig);
  }, [loader]);

  const loadAll = useCallback(() => {
    return loader.loadAll();
  }, [loader]);

  const getResult = useCallback(<T>(key: string): T | undefined => {
    return loader.getResult<T>(key);
  }, [loader]);

  const abort = useCallback(() => {
    loader.abort();
  }, [loader]);

  return {
    state,
    results,
    addLoader,
    loadAll,
    getResult,
    abort
  };
}

// Utility function to create common loader configurations
export function createSupabaseLoader<T>(
  key: string,
  queryFn: () => Promise<T>,
  options: {
    priority?: number;
    dependencies?: string[];
    useCache?: boolean;
    cacheTTL?: number;
    retryOnError?: boolean;
  } = {}
): DataLoader<T> {
  const {
    priority = 1,
    dependencies = [],
    useCache = true,
    cacheTTL = CURRENT_CONFIG.cacheTimeout,
    retryOnError = true
  } = options;

  return {
    key,
    priority,
    dependencies,
    retryOnError,
    cacheKey: useCache ? createCacheKey('progressive', { key }) : undefined,
    cacheTTL,
    loader: async (): Promise<T> => {
      const result = await safeSupabaseQuery(
        queryFn,
        `progressive-${key}`,
        {
          useCache,
          cacheKey: useCache ? createCacheKey('progressive', { key }) : undefined,
          cacheTTL
        }
      );
      
      if (result.error) {
        throw new Error(result.error.message || `Failed to load ${key}`);
      }
      
      return result.data as T;
    }
  };
}