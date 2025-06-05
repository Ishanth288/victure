
import { createContext, useContext, useState, useEffect, useCallback, ReactNode, Dispatch, SetStateAction, useRef } from "react";
import { RealtimeChannel } from "@supabase/supabase-js";
import { type InventoryItem, type InventoryItemFormData, type InventoryItemDB } from "@/types/inventory";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

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
  children: ReactNode;
}

export function InventoryProvider({ children }: InventoryProviderProps) {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [selectedItems, setSelectedItems] = useState<number[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [isLoading, setIsLoading] = useState(false); // Changed to false by default
  const [error, setError] = useState<string | null>(null);
  const [connectionQuality, setConnectionQuality] = useState<'fast' | 'slow' | 'unknown'>('unknown');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const { toast } = useToast();
  const channelRef = useRef<RealtimeChannel | null>(null);
  const userIdRef = useRef<string | null>(null);
  const mountedRef = useRef(true);
  const isInitialized = useRef(false);

  // Simple fetch function without aggressive caching or retries
  const fetchInventory = useCallback(async (userId: string) => {
    if (!userId || !mountedRef.current) return;

    try {
      setIsLoading(true);
      console.log("Fetching inventory for user:", userId);
      
      const { data, error: fetchError } = await supabase
        .from("inventory")
        .select("*")
        .eq("user_id", userId)
        .order("id", { ascending: false });

      if (fetchError) {
        console.warn(`Failed to fetch inventory: ${fetchError.message}`);
        setError(fetchError.message);
        return;
      }

      if (mountedRef.current) {
        const transformedData = (data || []).map((item: InventoryItemDB) => ({
          ...item,
          id: Number(item.id),
          quantity: Number(item.quantity) || 0,
          unit_cost: Number(item.unit_cost) || 0,
          selling_price: Number(item.selling_price) || 0,
          reorder_point: Number(item.reorder_point) || 10,
        }));

        setInventory(transformedData);
        setError(null);
        setLastUpdated(new Date());
        setConnectionQuality('fast');
        
        console.log(`Inventory loaded: ${transformedData.length} items`);
      }
    } catch (error) {
      console.warn("Error fetching inventory:", error);
      if (mountedRef.current) {
        const errorMessage = error instanceof Error ? error.message : "Failed to fetch inventory";
        setError(errorMessage);
        setConnectionQuality('slow');
      }
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }
  }, []);

  // Setup realtime subscription
  const setupRealtimeSubscription = useCallback(async (userId: string) => {
    if (!userId || channelRef.current) return;

    try {
      console.log("Setting up realtime subscription");
      
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
            
            console.log('Real-time inventory update:', payload.eventType);
            
            // Simple update handling
            if (payload.eventType === 'INSERT' && payload.new) {
              const newItem = payload.new as InventoryItemDB;
              const transformedItem: InventoryItem = {
                ...newItem,
                id: Number(newItem.id),
                quantity: Number(newItem.quantity) || 0,
                unit_cost: Number(newItem.unit_cost) || 0,
                selling_price: Number(newItem.selling_price) || 0,
                reorder_point: Number(newItem.reorder_point) || 10,
              };
              
              setInventory(prev => [transformedItem, ...prev]);
              setLastUpdated(new Date());
            } else if (payload.eventType === 'DELETE' && payload.old) {
              const deletedId = Number(payload.old.id);
              setInventory(prev => prev.filter(item => item.id !== deletedId));
              setLastUpdated(new Date());
            } else if (payload.eventType === 'UPDATE' && payload.new) {
              const updatedItem = payload.new as InventoryItemDB;
              const transformedItem: InventoryItem = {
                ...updatedItem,
                id: Number(updatedItem.id),
                quantity: Number(updatedItem.quantity) || 0,
                unit_cost: Number(updatedItem.unit_cost) || 0,
                selling_price: Number(updatedItem.selling_price) || 0,
                reorder_point: Number(updatedItem.reorder_point) || 10,
              };
              
              setInventory(prev => prev.map(item => 
                item.id === transformedItem.id ? transformedItem : item
              ));
              setLastUpdated(new Date());
            }
          }
        )
        .subscribe((status) => {
          console.log('Subscription status:', status);
        });

      channelRef.current = channel;
    } catch (error) {
      console.warn("Error setting up realtime subscription:", error);
    }
  }, []);

  // Cleanup channel
  const cleanupChannel = useCallback(() => {
    if (channelRef.current) {
      console.log("Cleaning up inventory subscription");
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
  }, []);

  // Refresh function
  const refreshInventory = useCallback(async () => {
    if (userIdRef.current) {
      await fetchInventory(userIdRef.current);
    }
  }, [fetchInventory]);

  // Initialize only when user is authenticated
  useEffect(() => {
    let mounted = true;
    mountedRef.current = true;

    const initializeInventory = async () => {
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (authError || !user) {
          // User not authenticated - this is normal for index/auth pages
          if (mounted) {
            setIsLoading(false);
          }
          return;
        }

        userIdRef.current = user.id;

        if (mounted) {
          await fetchInventory(user.id);
          await setupRealtimeSubscription(user.id);
        }
      } catch (error) {
        console.warn("Error initializing inventory:", error);
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    // Only initialize if not already done
    if (!isInitialized.current) {
      initializeInventory();
      isInitialized.current = true;
    }

    return () => {
      mounted = false;
      mountedRef.current = false;
      cleanupChannel();
    };
  }, [fetchInventory, setupRealtimeSubscription, cleanupChannel]);

  // Auth state change handler
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mountedRef.current) return;

      if (event === 'SIGNED_OUT') {
        cleanupChannel();
        setInventory([]);
        setSelectedItems([]);
        userIdRef.current = null;
        setError(null);
        setLastUpdated(null);
        setConnectionQuality('unknown');
        isInitialized.current = false;
      } else if (event === 'SIGNED_IN' && session?.user && session.user.id !== userIdRef.current) {
        userIdRef.current = session.user.id;
        setIsLoading(true);
        
        await fetchInventory(session.user.id);
        await setupRealtimeSubscription(session.user.id);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchInventory, setupRealtimeSubscription, cleanupChannel]);

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

export function useInventory() {
  const context = useContext(InventoryContext);
  if (context === undefined) {
    throw new Error("useInventory must be used within an InventoryProvider");
  }
  return context;
}
