/**
 * Bill Propagation Utility
 * Ensures immediate bill updates across all pages with optimistic UI updates
 */

import React from 'react';

export interface BillEvent {
  type: 'generated' | 'updated' | 'deleted';
  billId: number;
  billNumber: string;
  prescriptionId?: number;
  totalAmount?: number;
  timestamp: number;
}

export class BillPropagationManager {
  private static instance: BillPropagationManager;
  private listeners: Map<string, ((event: BillEvent) => void)[]> = new Map();

  private constructor() {
    this.setupCrossTabCommunication();
  }

  static getInstance(): BillPropagationManager {
    if (!this.instance) {
      this.instance = new BillPropagationManager();
    }
    return this.instance;
  }

  /**
   * Register a listener for bill events
   */
  subscribe(component: string, callback: (event: BillEvent) => void): () => void {
    if (!this.listeners.has(component)) {
      this.listeners.set(component, []);
    }
    
    this.listeners.get(component)!.push(callback);
    
    // Return unsubscribe function
    return () => {
      const callbacks = this.listeners.get(component);
      if (callbacks) {
        const index = callbacks.indexOf(callback);
        if (index > -1) {
          callbacks.splice(index, 1);
        }
      }
    };
  }

  /**
   * Emit a bill event to all subscribers
   */
  emit(event: BillEvent): void {
    console.log(`📢 BillPropagation: Emitting ${event.type} event for bill ${event.billNumber}`);
    
    // Notify all subscribers immediately
    this.listeners.forEach((callbacks) => {
      callbacks.forEach(callback => {
        try {
          callback(event);
        } catch (error) {
          console.error('BillPropagation: Error in callback:', error);
        }
      });
    });

    // Emit DOM events for backward compatibility
    this.emitDOMEvents(event);
    
    // Store in localStorage for cross-tab communication
    this.storeEventInStorage(event);
  }

  /**
   * Handle bill generation with immediate propagation
   */
  handleBillGenerated(billData: {
    id: number;
    bill_number: string;
    prescription_id?: number;
    total_amount: number;
  }): void {
    const event: BillEvent = {
      type: 'generated',
      billId: billData.id,
      billNumber: billData.bill_number,
      prescriptionId: billData.prescription_id,
      totalAmount: billData.total_amount,
      timestamp: Date.now()
    };

    this.emit(event);
  }

  /**
   * Handle bill update with immediate propagation
   */
  handleBillUpdated(billData: {
    id: number;
    bill_number: string;
    prescription_id?: number;
    total_amount?: number;
  }): void {
    const event: BillEvent = {
      type: 'updated',
      billId: billData.id,
      billNumber: billData.bill_number,
      prescriptionId: billData.prescription_id,
      totalAmount: billData.total_amount,
      timestamp: Date.now()
    };

    this.emit(event);
  }

  /**
   * Handle bill deletion with immediate propagation
   */
  handleBillDeleted(billData: {
    id: number;
    bill_number: string;
    prescription_id?: number;
  }): void {
    const event: BillEvent = {
      type: 'deleted',
      billId: billData.id,
      billNumber: billData.bill_number,
      prescriptionId: billData.prescription_id,
      timestamp: Date.now()
    };

    this.emit(event);
  }

  /**
   * Emit DOM events for backward compatibility
   */
  private emitDOMEvents(event: BillEvent): void {
    // Primary event
    window.dispatchEvent(new CustomEvent(`bill${event.type.charAt(0).toUpperCase() + event.type.slice(1)}`, {
      detail: {
        billId: event.billId,
        billNumber: event.billNumber,
        prescriptionId: event.prescriptionId,
        totalAmount: event.totalAmount,
        timestamp: event.timestamp
      }
    }));

    // Generic data refresh event
    window.dispatchEvent(new CustomEvent('dataRefreshNeeded', {
      detail: {
        type: `bill_${event.type}`,
        timestamp: event.timestamp,
        data: {
          billId: event.billId,
          prescriptionId: event.prescriptionId
        }
      }
    }));
  }

  /**
   * Store event in localStorage for cross-tab communication
   */
  private storeEventInStorage(event: BillEvent): void {
    const storageKey = `lastBill${event.type.charAt(0).toUpperCase() + event.type.slice(1)}`;
    const storageData = {
      billId: event.billId,
      billNumber: event.billNumber,
      prescriptionId: event.prescriptionId,
      totalAmount: event.totalAmount,
      timestamp: event.timestamp
    };

    localStorage.setItem(storageKey, JSON.stringify(storageData));

    // Force storage event for same-tab listeners
    window.dispatchEvent(new StorageEvent('storage', {
      key: storageKey,
      newValue: JSON.stringify(storageData),
      oldValue: null,
      storageArea: localStorage
    }));
  }

  /**
   * Setup cross-tab communication via storage events
   */
  private setupCrossTabCommunication(): void {
    window.addEventListener('storage', (event) => {
      if (event.key?.startsWith('lastBill') && event.newValue) {
        try {
          const data = JSON.parse(event.newValue);
          const eventType = event.key.replace('lastBill', '').toLowerCase() as BillEvent['type'];
          
          const billEvent: BillEvent = {
            type: eventType,
            billId: data.billId,
            billNumber: data.billNumber,
            prescriptionId: data.prescriptionId,
            totalAmount: data.totalAmount,
            timestamp: data.timestamp || Date.now()
          };

          // Only process if this is a recent event (within last 30 seconds)
          if (Date.now() - billEvent.timestamp < 30000) {
            console.log(`📦 BillPropagation: Received cross-tab ${eventType} event for bill ${billEvent.billNumber}`);
            
            // Notify subscribers of cross-tab event
            this.listeners.forEach((callbacks) => {
              callbacks.forEach(callback => {
                try {
                  callback(billEvent);
                } catch (error) {
                  console.error('BillPropagation: Error in cross-tab callback:', error);
                }
              });
            });
          }
        } catch (error) {
          console.error('BillPropagation: Error parsing storage event:', error);
        }
      }
    });
  }
}

// Export singleton instance
export const billPropagation = BillPropagationManager.getInstance();

/**
 * Hook for components to easily subscribe to bill events
 */
export function useBillPropagation(
  componentName: string,
  onBillEvent: (event: BillEvent) => void
): void {
  const manager = BillPropagationManager.getInstance();
  
  // Subscribe on mount and unsubscribe on unmount
  React.useEffect(() => {
    const unsubscribe = manager.subscribe(componentName, onBillEvent);
    return unsubscribe;
  }, [componentName, onBillEvent]);
}

// Enhanced bill sorting utility
export function sortBillsByRecency<T extends { 
  created_at?: string; 
  date?: string; 
  id: number; 
  sort_timestamp?: number;
  sort_priority?: number;
}>(bills: T[]): T[] {
  return bills.sort((a, b) => {
    // Use sort_priority first if available
    if (a.sort_priority && b.sort_priority) {
      const priorityDiff = b.sort_priority - a.sort_priority;
      if (priorityDiff !== 0) return priorityDiff;
    }
    
    // Use sort_timestamp if available
    if (a.sort_timestamp && b.sort_timestamp) {
      const timestampDiff = b.sort_timestamp - a.sort_timestamp;
      if (timestampDiff !== 0) return timestampDiff;
    }
    
    // Fall back to created_at or date comparison
    const aTime = new Date(a.created_at || a.date || 0).getTime();
    const bTime = new Date(b.created_at || b.date || 0).getTime();
    const timeDiff = bTime - aTime;
    
    if (timeDiff !== 0) return timeDiff;
    
    // Final fallback: sort by ID (newer bills have higher IDs)
    return b.id - a.id;
  });
}

/**
 * Debounced refresh utility to prevent excessive API calls
 */
export function createDebouncedRefresh(
  refreshFunction: () => Promise<void>,
  delay: number = 300
): () => void {
  let timeoutId: NodeJS.Timeout | null = null;
  
  return () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    
    timeoutId = setTimeout(async () => {
      try {
        await refreshFunction();
      } catch (error) {
        console.error('Debounced refresh error:', error);
      }
    }, delay);
  };
} 