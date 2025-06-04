import { createContext, useContext, useState, useEffect, useCallback, ReactNode, Dispatch, SetStateAction, useRef } from "react";
import { RealtimeChannel } from "@supabase/supabase-js";
import { type InventoryItem, type InventoryItemFormData, type InventoryItemDB } from "@/types/inventory";
import { supabase, OptimizedQuery } from "@/integrations/supabase/client";
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
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connectionQuality, setConnectionQuality] = useState<'fast' | 'slow' | 'unknown'>('unknown');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const { toast } = useToast();
  const channelRef = useRef<RealtimeChannel | null>(null);
  const userIdRef = useRef<string | null>(null);
  const mountedRef = useRef(true);
  const isInitialized = useRef(false);
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Progressive loading states
  const [loadingPhase, setLoadingPhase] = useState<'initial' | 'fetching' | 'processing' | 'complete'>('initial');

  // Optimized fetch function using OptimizedQuery
  const fetchInventory = useCallback(async (userId: string, showProgress = false) => {
    if (!userId || !mountedRef.current) return;

    try {
      if (showProgress) {
        setLoadingPhase('fetching');
      }

      console.log("🚀 Optimized inventory fetch for user:", userId);
      const startTime = Date.now();

      const { data, error: fetchError } = await OptimizedQuery.execute<InventoryItemDB[]>(
        () => supabase
          .from("inventory")
          .select("*")
          .eq("user_id", userId)
          .order("id", { ascending: false }),
        {
          cacheKey: `inventory_${userId}`,
          cacheTTL: 120000, // 2 minutes cache
          retries: 2,
          timeout: 4000, // 4 second timeout
          operation: 'Fetch Inventory'
        }
      );

      const fetchDuration = Date.now() - startTime;
      const quality = fetchDuration < 1500 ? 'fast' : 'slow';
      setConnectionQuality(quality);

      if (fetchError) {
        throw new Error(`Failed to fetch inventory: ${fetchError.message}`);
      }

      if (mountedRef.current) {
        if (showProgress) {
          setLoadingPhase('processing');
        }

        const transformedData = (data || []).map((item: InventoryItemDB) => ({
          ...item,
          id: Number(item.id),
          quantity: Number(item.quantity) || 0,
          unit_cost: Number(item.unit_cost) || 0,
          selling_price: Number(item.selling_price) || 0,
          reorder_point: Number(item.reorder_point) || 10,
        }));

        setInventory(transformedData);
        setIsLoading(false);
        setError(null);
        setLastUpdated(new Date());
        
        if (showProgress) {
          setLoadingPhase('complete');
        }

        console.log(`✅ Optimized inventory loaded: ${transformedData.length} items in ${fetchDuration}ms (${quality})`);
      }
    } catch (error) {
      console.error("Failed to fetch inventory:", error);
      if (mountedRef.current) {
        const errorMessage = error instanceof Error ? error.message : "Failed to fetch inventory";
        setError(errorMessage);
        setIsLoading(false);
        setLoadingPhase('complete');
      }
    } finally {
      // Always ensure loading is completed
      if (mountedRef.current) {
        setIsLoading(false);
        setLoadingPhase('complete');
      }
    }
  }, [toast]);

  // Enhanced realtime subscription with connection quality monitoring
  const setupRealtimeSubscription = useCallback(async (userId: string) => {
    if (!userId || channelRef.current) return;

    try {
      console.log("📡 Setting up optimized realtime subscription");
      
      const channel = supabase
        .channel(`inventory_optimized_${userId}`)
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
            
            console.log('📡 Real-time inventory update:', payload.eventType);
            
            // Intelligent update instead of full refetch
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
            } else {
              // Fallback to cache-optimized refetch for complex changes
              OptimizedQuery.clearCache(`inventory_${userId}`);
              fetchInventory(userId);
            }
          }
        )
        .subscribe((status) => {
          console.log('📡 Subscription status:', status);
          if (status === 'SUBSCRIBED') {
            setConnectionQuality('fast');
          } else if (status === 'CHANNEL_ERROR') {
            setConnectionQuality('slow');
          }
        });

      channelRef.current = channel;
    } catch (error) {
      console.error("Error setting up realtime subscription:", error);
      setConnectionQuality('slow');
    }
  }, [fetchInventory]);

  // Cleanup channel
  const cleanupChannel = useCallback(() => {
    if (channelRef.current) {
      console.log("🧹 Cleaning up inventory subscription");
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
  }, []);

  // Enhanced refresh function with progress tracking
  const refreshInventory = useCallback(async () => {
    if (userIdRef.current) {
      setIsLoading(true);
      setLoadingPhase('initial');
      
      // Clear cache to force fresh data
      OptimizedQuery.clearCache(`inventory_${userIdRef.current}`);
      await fetchInventory(userIdRef.current, true);
    }
  }, [fetchInventory]);

  // Main initialization effect with progressive loading
  useEffect(() => {
    if (isInitialized.current) return;
    
    let mounted = true;
    mountedRef.current = true;

    const initializeInventory = async () => {
      try {
        setLoadingPhase('initial');
        
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (authError) {
          console.warn('Authentication check failed:', authError.message);
          // Don't throw error, just handle gracefully
          if (mounted) {
            setIsLoading(false);
            setLoadingPhase('complete');
          }
          return;
        }

        if (!user) {
          // User not authenticated - this is normal for index/auth pages
          if (mounted) {
            setIsLoading(false);
            setLoadingPhase('complete');
          }
          return;
        }

        userIdRef.current = user.id;

        if (mounted) {
          // Start loading with progress
          await fetchInventory(user.id, true);
          
          // Setup realtime subscription
          await setupRealtimeSubscription(user.id);
        }
      } catch (error) {
        console.error("Error initializing inventory:", error);
        if (mounted) {
          const errorMessage = error instanceof Error ? error.message : "Failed to initialize inventory";
          setError(errorMessage);
          setIsLoading(false);
          setLoadingPhase('complete');
        }
      }
    };

    // Set up loading timeout with reduced time
    loadingTimeoutRef.current = setTimeout(() => {
      if (isLoading && mountedRef.current) {
        console.warn('⚠️ Inventory loading timeout - forcing completion');
        setIsLoading(false);
        setLoadingPhase('complete');
        setConnectionQuality('slow');
        
        if (!inventory.length) {
          setError('Loading timeout - please try refreshing the page');
        }
      }
    }, 5000); // Reduced from 8000 to 5000

    // Start initialization
    initializeInventory().finally(() => {
      // Clear timeout once initialization is complete
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
        loadingTimeoutRef.current = null;
      }
    });

    isInitialized.current = true;

    // Cleanup function
    return () => {
      mounted = false;
      mountedRef.current = false;
      cleanupChannel();
    };
  }, [fetchInventory, setupRealtimeSubscription, cleanupChannel, isLoading, inventory.length]);

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
        
        // Clear related cache
        OptimizedQuery.clearCache('inventory_');
      } else if (event === 'SIGNED_IN' && session?.user && session.user.id !== userIdRef.current) {
        userIdRef.current = session.user.id;
        setIsLoading(true);
        setLoadingPhase('initial');
        
        await fetchInventory(session.user.id, true);
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
