import { supabase } from "@/integrations/supabase/client";
import { RealtimeChannel } from "@supabase/supabase-js";

interface SubscriptionConfig {
  table: string;
  filter?: string;
  callback: (payload: any) => void;
  events?: ('INSERT' | 'UPDATE' | 'DELETE')[];
}

class RealTimeOptimizer {
  private channels: Map<string, RealtimeChannel> = new Map();
  private subscriptionCounts: Map<string, number> = new Map();
  private reconnectTimeouts: Map<string, NodeJS.Timeout> = new Map();
  private isConnected: boolean = false;
  private connectionRetries: number = 0;
  private maxRetries: number = 3;
  private retryDelay: number = 5000;

  /**
   * Throttled callback to prevent excessive updates
   */
  private callbackThrottleMap = new Map<Function, { lastCall: number; timeout?: NodeJS.Timeout }>();

  /**
   * Create an optimized subscription that shares channels when possible
   */
  public createOptimizedSubscription(
    channelName: string,
    configs: SubscriptionConfig[],
    userId: string
  ): () => void {
    const channelKey = `${channelName}-${userId}`;
    
    // Check if channel already exists
    if (this.channels.has(channelKey)) {
      const currentCount = this.subscriptionCounts.get(channelKey) || 0;
      this.subscriptionCounts.set(channelKey, currentCount + 1);
      
      // Return cleanup function for existing channel
      return () => this.decrementSubscription(channelKey);
    }

    // Create new optimized channel
    const channel = supabase.channel(channelKey, {
      config: {
        broadcast: { self: false },
        presence: { key: userId }
      }
    });

    // Add all event handlers
    configs.forEach(config => {
      const events = config.events || ['INSERT', 'UPDATE', 'DELETE'];
      
      events.forEach(event => {
        channel.on(
          'postgres_changes' as any,
          {
            event,
            schema: 'public',
            table: config.table,
            filter: config.filter
          },
          (payload) => {
            // Throttle callbacks to prevent excessive updates
            this.throttledCallback(config.callback, payload);
          }
        );
      });
    });

    // Subscribe with enhanced error handling
    channel.subscribe((status, err) => {
      console.log(`📡 Channel ${channelKey} status:`, status);
      
      switch (status) {
        case 'SUBSCRIBED':
          this.isConnected = true;
          this.connectionRetries = 0;
          console.log(`✅ Successfully subscribed to ${channelKey}`);
          break;
          
        case 'CHANNEL_ERROR':
        case 'TIMED_OUT':
        case 'CLOSED':
          this.isConnected = false;
          console.error(`❌ Channel ${channelKey} error:`, err);
          this.handleReconnection(channelKey, configs, userId);
          break;
      }
    });

    this.channels.set(channelKey, channel);
    this.subscriptionCounts.set(channelKey, 1);

    return () => this.decrementSubscription(channelKey);
  }

  /**
   * Throttled callback to prevent excessive updates
   */
  private throttledCallback(callback: Function, payload: any): void {
    const now = Date.now();
    const throttleData = this.callbackThrottleMap.get(callback);
    const delay = 100; // 100ms throttle

    if (!throttleData || now - throttleData.lastCall > delay) {
      // Execute immediately
      try {
        callback(payload);
        this.callbackThrottleMap.set(callback, { lastCall: now });
      } catch (error) {
        console.error('Real-time callback error:', error);
      }
    } else {
      // Throttle the call
      if (throttleData.timeout) {
        clearTimeout(throttleData.timeout);
      }

      const timeout = setTimeout(() => {
        try {
          callback(payload);
          this.callbackThrottleMap.set(callback, { lastCall: Date.now() });
        } catch (error) {
          console.error('Real-time callback error:', error);
        }
      }, delay - (now - throttleData.lastCall));

      this.callbackThrottleMap.set(callback, { ...throttleData, timeout });
    }
  }

  /**
   * Handle reconnection with exponential backoff
   */
  private handleReconnection(
    channelKey: string, 
    configs: SubscriptionConfig[], 
    userId: string
  ): void {
    if (this.connectionRetries >= this.maxRetries) {
      console.warn(`🔄 Max reconnection attempts reached for ${channelKey}`);
      return;
    }

    // Clear existing timeout
    const existingTimeout = this.reconnectTimeouts.get(channelKey);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }

    // Calculate delay with exponential backoff
    const delay = this.retryDelay * Math.pow(2, this.connectionRetries);
    
    console.log(`🔄 Attempting reconnection for ${channelKey} in ${delay}ms`);
    
    const timeout = setTimeout(() => {
      this.connectionRetries++;
      
      // Remove failed channel
      const failedChannel = this.channels.get(channelKey);
      if (failedChannel) {
        supabase.removeChannel(failedChannel);
        this.channels.delete(channelKey);
      }
      
      // Recreate subscription
      this.createOptimizedSubscription(channelKey.split('-')[0], configs, userId);
    }, delay);

    this.reconnectTimeouts.set(channelKey, timeout);
  }

  /**
   * Decrement subscription count and cleanup if needed
   */
  private decrementSubscription(channelKey: string): void {
    const currentCount = this.subscriptionCounts.get(channelKey) || 1;
    const newCount = currentCount - 1;

    if (newCount <= 0) {
      // No more subscriptions, cleanup channel
      const channel = this.channels.get(channelKey);
      if (channel) {
        console.log(`🧹 Cleaning up channel ${channelKey}`);
        supabase.removeChannel(channel);
      }
      
      this.channels.delete(channelKey);
      this.subscriptionCounts.delete(channelKey);
      
      // Clear reconnection timeout
      const timeout = this.reconnectTimeouts.get(channelKey);
      if (timeout) {
        clearTimeout(timeout);
        this.reconnectTimeouts.delete(channelKey);
      }
    } else {
      this.subscriptionCounts.set(channelKey, newCount);
    }
  }

  /**
   * Get connection status
   */
  public getConnectionStatus(): { isConnected: boolean; channelCount: number } {
    return {
      isConnected: this.isConnected,
      channelCount: this.channels.size
    };
  }

  /**
   * Cleanup all subscriptions
   */
  public cleanup(): void {
    console.log('🧹 Cleaning up all real-time subscriptions');
    
    // Clear all timeouts
    this.reconnectTimeouts.forEach(timeout => clearTimeout(timeout));
    this.reconnectTimeouts.clear();
    
    // Remove all channels
    this.channels.forEach(channel => supabase.removeChannel(channel));
    this.channels.clear();
    this.subscriptionCounts.clear();
    
    this.isConnected = false;
    this.connectionRetries = 0;
  }

  /**
   * Force reconnect all channels
   */
  public forceReconnect(): void {
    console.log('🔄 Force reconnecting all channels');
    this.connectionRetries = 0;
    
    const channelEntries = Array.from(this.channels.entries());
    
    // Cleanup existing channels
    this.cleanup();
    
    // Recreate channels (this would need subscription configs to be stored)
    console.log('📡 Channels cleaned up, manual re-subscription needed');
  }
}

// Export singleton instance
export const realTimeOptimizer = new RealTimeOptimizer();

// Export helper function for easy subscription creation
export function createOptimizedSubscription(
  channelName: string,
  table: string,
  userId: string,
  callback: (payload: any) => void,
  options?: {
    filter?: string;
    events?: ('INSERT' | 'UPDATE' | 'DELETE')[];
  }
): () => void {
  return realTimeOptimizer.createOptimizedSubscription(
    channelName,
    [{
      table,
      filter: options?.filter,
      callback,
      events: options?.events
    }],
    userId
  );
}

// Network status monitoring
export function setupNetworkMonitoring(): () => void {
  const handleOnline = () => {
    console.log('📶 Network back online, checking subscriptions');
    // Don't auto-reconnect, let components handle their own reconnection
  };

  const handleOffline = () => {
    console.log('📴 Network offline detected');
  };

  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);

  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
} 