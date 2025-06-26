/**
 * Smart Caching System for Supabase Queries
 * Implements intelligent caching with TTL, invalidation, and memory management
 */

import { CURRENT_CONFIG } from './performanceConfig';

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
  accessCount: number;
  lastAccessed: number;
  size: number; // Estimated size in bytes
}

export interface CacheStats {
  hits: number;
  misses: number;
  entries: number;
  totalSize: number;
  hitRate: number;
}

export class SmartCache {
  private cache = new Map<string, CacheEntry<any>>();
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    entries: 0,
    totalSize: 0,
    hitRate: 0
  };
  private readonly maxSize: number;
  private readonly maxEntries: number;
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor(maxSize: number = 10 * 1024 * 1024, maxEntries: number = 1000) { // 10MB default
    this.maxSize = maxSize;
    this.maxEntries = maxEntries;
    this.startCleanupTimer();
  }

  async get<T>(key: string): Promise<T | null> {
    const entry = this.cache.get(key);
    
    if (!entry) {
      this.stats.misses++;
      this.updateHitRate();
      return null;
    }

    // Check if entry has expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      this.stats.entries--;
      this.stats.totalSize -= entry.size;
      this.stats.misses++;
      this.updateHitRate();
      return null;
    }

    // Update access statistics
    entry.accessCount++;
    entry.lastAccessed = Date.now();
    this.stats.hits++;
    this.updateHitRate();
    
    return entry.data;
  }

  async set<T>(key: string, data: T, ttl: number = CURRENT_CONFIG.cacheTimeout): Promise<void> {
    const size = this.estimateSize(data);
    
    // Check if we need to make space
    if (this.cache.size >= this.maxEntries || this.stats.totalSize + size > this.maxSize) {
      await this.evictLeastUsed();
    }

    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl,
      accessCount: 0,
      lastAccessed: Date.now(),
      size
    };

    // Remove existing entry if it exists
    const existing = this.cache.get(key);
    if (existing) {
      this.stats.totalSize -= existing.size;
    } else {
      this.stats.entries++;
    }

    this.cache.set(key, entry);
    this.stats.totalSize += size;
  }

  async cachedQuery<T>(
    key: string, 
    queryFn: () => Promise<T>, 
    ttl: number = CURRENT_CONFIG.cacheTimeout
  ): Promise<T> {
    // Try to get from cache first
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    // Execute query and cache result
    const data = await queryFn();
    await this.set(key, data, ttl);
    return data;
  }

  invalidate(key: string): boolean {
    const entry = this.cache.get(key);
    if (entry) {
      this.cache.delete(key);
      this.stats.entries--;
      this.stats.totalSize -= entry.size;
      return true;
    }
    return false;
  }

  invalidatePattern(pattern: string): number {
    let count = 0;
    const regex = new RegExp(pattern);
    
    for (const [key, entry] of this.cache.entries()) {
      if (regex.test(key)) {
        this.cache.delete(key);
        this.stats.entries--;
        this.stats.totalSize -= entry.size;
        count++;
      }
    }
    
    return count;
  }

  clear(): void {
    this.cache.clear();
    this.stats = {
      hits: 0,
      misses: 0,
      entries: 0,
      totalSize: 0,
      hitRate: 0
    };
  }

  getStats(): CacheStats {
    return { ...this.stats };
  }

  private estimateSize(data: any): number {
    try {
      return new Blob([JSON.stringify(data)]).size;
    } catch {
      // Fallback estimation
      const str = typeof data === 'string' ? data : JSON.stringify(data);
      return str.length * 2; // Rough estimate: 2 bytes per character
    }
  }

  private updateHitRate(): void {
    const total = this.stats.hits + this.stats.misses;
    this.stats.hitRate = total > 0 ? (this.stats.hits / total) * 100 : 0;
  }

  private async evictLeastUsed(): Promise<void> {
    if (this.cache.size === 0) return;

    // Find least recently used entries
    const entries = Array.from(this.cache.entries())
      .map(([key, entry]) => ({ key, entry }))
      .sort((a, b) => {
        // Sort by access frequency and recency
        const scoreA = a.entry.accessCount / (Date.now() - a.entry.lastAccessed + 1);
        const scoreB = b.entry.accessCount / (Date.now() - b.entry.lastAccessed + 1);
        return scoreA - scoreB;
      });

    // Remove least used entries (up to 25% of cache)
    const toRemove = Math.max(1, Math.floor(entries.length * 0.25));
    
    for (let i = 0; i < toRemove && i < entries.length; i++) {
      const { key, entry } = entries[i];
      this.cache.delete(key);
      this.stats.entries--;
      this.stats.totalSize -= entry.size;
    }
  }

  private startCleanupTimer(): void {
    // Clean up expired entries every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanupExpired();
    }, 5 * 60 * 1000);
  }

  private cleanupExpired(): void {
    const now = Date.now();
    let cleaned = 0;
    
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
        this.stats.entries--;
        this.stats.totalSize -= entry.size;
        cleaned++;
      }
    }
    
    if (cleaned > 0 && CURRENT_CONFIG.enableVerboseLogging) {
      console.log(`🧹 Cache cleanup: removed ${cleaned} expired entries`);
    }
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.clear();
  }
}

// Global cache instance
export const globalCache = new SmartCache();

// Utility functions for common caching patterns
export function createCacheKey(table: string, params: Record<string, any>): string {
  const sortedParams = Object.keys(params)
    .sort()
    .map(key => `${key}:${params[key]}`)
    .join('|');
  return `${table}:${sortedParams}`;
}

export function createUserCacheKey(userId: string, table: string, params: Record<string, any> = {}): string {
  return createCacheKey(`user:${userId}:${table}`, params);
}

// Cache invalidation helpers
export function invalidateUserCache(userId: string): number {
  return globalCache.invalidatePattern(`^user:${userId}:`);
}

export function invalidateTableCache(table: string): number {
  return globalCache.invalidatePattern(`:${table}:`);
}

// Preload commonly accessed data
export async function preloadCache(preloadFunctions: Array<() => Promise<void>>): Promise<void> {
  const promises = preloadFunctions.map(fn => 
    fn().catch(error => {
      console.warn('Cache preload failed:', error);
    })
  );
  
  await Promise.allSettled(promises);
}

// Export cache statistics for monitoring
export function getCacheMetrics() {
  const stats = globalCache.getStats();
  return {
    ...stats,
    memoryUsageMB: (stats.totalSize / (1024 * 1024)).toFixed(2),
    averageEntrySize: stats.entries > 0 ? Math.round(stats.totalSize / stats.entries) : 0
  };
}