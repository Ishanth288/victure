import React, { createContext, useContext, useState, useEffect, useCallback, Dispatch, SetStateAction, useRef } from "react";
import { RealtimeChannel } from "@supabase/supabase-js";
import { type InventoryItem, type InventoryItemFormData, type InventoryItemDB } from "@/types/inventory";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useInventoryQuery } from "@/hooks/queries/useInventoryQuery";
import { debugLog } from "@/utils/debugLogger";

interface InventoryContextType {
  inventory: InventoryItem[];
  setInventory: Dispatch<SetStateAction<InventoryItem[]>>;
  selectedItems: number[];
  setSelectedItems: Dispatch<SetStateAction<number[]>>;
  isAddModalOpen: boolean;
  setIsAddModalOpen: (open: boolean) => void;
  isEditModalOpen: boolean;
  setIsEditModalOpen: (open: boolean) => void;
  editingItem: InventoryItem | null;
  setEditingItem: (item: InventoryItem | null) => void;
  refreshInventory: () => Promise<void>;
  isLoading: boolean;
  error: string | null;
  connectionQuality: 'fast' | 'slow' | 'unknown';
  lastUpdated: Date | null;
}

const InventoryContext = createContext<InventoryContextType | undefined>(undefined);

interface InventoryProviderProps {
  children: React.ReactNode;
}

export const InventoryProvider = ({ children }: InventoryProviderProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Use React Query hook for data fetching - this provides automatic caching and parallelism
  const {
    data: inventory = [],
    isLoading,
    error: queryError,
    refetch,
    isFetched
  } = useInventoryQuery(user?.id || null);
  
  // Local UI state
  const [selectedItems, setSelectedItems] = useState<number[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  
  // Derived state from React Query
  const error = queryError?.message || null;
  const lastUpdated = inventory.length > 0 ? new Date() : null;
  const connectionQuality: 'fast' | 'slow' | 'unknown' = error ? 'slow' : 'fast';
  
  // Legacy state setters (for backward compatibility)
  const setInventory = useCallback((newInventory: InventoryItem[] | ((prev: InventoryItem[]) => InventoryItem[])) => {
    // This is now handled by React Query, so we'll just trigger a refetch
    debugLog.warn('setInventory called but inventory is now managed by React Query. Use refetch instead.');
    refetch();
  }, [refetch]);
  
  // Realtime subscription for live updates
  const channelRef = useRef<RealtimeChannel | null>(null);
  const mountedRef = useRef(true);

  // Setup realtime subscription for live updates
  const setupRealtimeSubscription = useCallback(async (userId: string) => {
if (!userId || channelRef.current || !isFetched) return;

    try {
        debugLog.log("Setting up realtime inventory subscription");
      
      const channel = supabase
        .channel(`inventory_${userId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'inventory',
            filter: `user_id=eq.${userId}`,
          },
          (payload) => {
            if (!mountedRef.current) return;
            
            debugLog.log('Real-time inventory update:', payload.eventType);
            
            // Trigger a refetch when inventory changes
            refetch();
          }
        )
        .subscribe((status) => {
            debugLog.log('Inventory subscription status:', status);
          });

      channelRef.current = channel;
    } catch (error) {
        debugLog.warn("Error setting up realtime inventory subscription:", error);
      }
  }, [refetch, isFetched]);

  // Cleanup channel
  const cleanupChannel = useCallback(() => {
    if (channelRef.current) {
      debugLog.log("Cleaning up inventory subscription");
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
  }, []);

  // Refresh function that uses React Query's refetch
  const refreshInventory = useCallback(async () => {
    await refetch();
  }, [refetch]);

  // Setup realtime subscription when user is available and initial fetch is complete
  useEffect(() => {
    if (!user?.id) return;

    setupRealtimeSubscription(user.id);

    return () => {
      cleanupChannel();
    };
  }, [user?.id, setupRealtimeSubscription, cleanupChannel, isFetched]);

  // Auth state change handler
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event) => {
      if (!mountedRef.current) return;

      if (event === 'SIGNED_OUT') {
        cleanupChannel();
        setSelectedItems([]);
        setEditingItem(null);
        setIsAddModalOpen(false);
        setIsEditModalOpen(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [cleanupChannel]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      cleanupChannel();
    };
  }, [cleanupChannel]);

  const value: InventoryContextType = {
    inventory,
    setInventory,
    selectedItems,
    setSelectedItems,
    isAddModalOpen,
    setIsAddModalOpen,
    isEditModalOpen,
    setIsEditModalOpen,
    editingItem,
    setEditingItem,
    refreshInventory,
    isLoading,
    error,
    connectionQuality,
    lastUpdated,
  };

  return (
    <InventoryContext.Provider value={value}>
      {children}
    </InventoryContext.Provider>
  );
}

export const useInventory = () => {
  const context = useContext(InventoryContext);
  if (context === undefined) {
    throw new Error("useInventory must be used within an InventoryProvider");
  }
  return context;
};
