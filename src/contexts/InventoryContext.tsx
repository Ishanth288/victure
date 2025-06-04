
import { createContext, useContext, useState, useEffect, useCallback, ReactNode, Dispatch, SetStateAction, useRef } from "react";
import { RealtimeChannel } from "@supabase/supabase-js";
import { type InventoryItem, type InventoryItemFormData, type InventoryItemDB } from "@/types/inventory";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { robustInventoryFetch, handleBusinessCriticalError } from "@/utils/errorRecovery";

interface InventoryContextType {
  inventory: InventoryItem[];
  setInventory: Dispatch<SetStateAction<InventoryItem[]>>;
  selectedItems: number[];
  setSelectedItems: Dispatch<SetStateAction<number[]>>;
  isAddModalOpen: boolean;
  setIsAddModalOpen: (open: boolean) => void;
  isEditModalOpen: boolean;
  setIsEditModalOpen: (open: boolean) => void;
  formData: InventoryItemFormData;
  setFormData: Dispatch<SetStateAction<InventoryItemFormData>>;
  editingItem: InventoryItem | null;
  setEditingItem: (item: InventoryItem | null) => void;
  isLoading: boolean;
  fetchInventory: () => Promise<void>;
}

const InventoryContext = createContext<InventoryContextType | undefined>(undefined);

export function InventoryProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [selectedItems, setSelectedItems] = useState<number[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [formData, setFormData] = useState<InventoryItemFormData>({
    name: "",
    genericName: "",
    ndc: "",
    manufacturer: "",
    dosageForm: "",
    strength: "",
    unitSize: "",
    unitCost: "",
    sellingPrice: "",
    quantity: "",
    reorderPoint: "10",
    expiryDate: "",
    supplier: "",
    storage: "",
  });
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);

  // Use refs to track subscription state and prevent multiple subscriptions
  const subscriptionRef = useRef<RealtimeChannel | null>(null);
  const isSubscribedRef = useRef(false);
  const mountedRef = useRef(true);

  const fetchInventory = useCallback(async () => {
    if (!mountedRef.current) return;
    
    setIsLoading(true);
    console.log("fetchInventory: Starting robust data fetch.");
    
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        console.warn("fetchInventory: No authenticated user found.");
        setInventory([]);
        return;
      }

      // Fixed: Use id for ordering instead of non-existent created_at column
      const { data, error } = await supabase
        .from('inventory')
        .select('*')
        .eq('user_id', user.id)
        .order('id', { ascending: false });
      
      if (error) {
        throw new Error(`Database error: ${error.message}`);
      }
      
      if (mountedRef.current) {
        const inventoryItems: InventoryItem[] = (data || []).map(item => ({
          ...item,
          generic_name: item.generic_name || null,
          strength: item.strength || null,
          reorder_point: item.reorder_point || 10,
          storage_condition: item.storage_condition || null
        }));

        setInventory(inventoryItems);
        console.log("fetchInventory: Updated inventory state successfully.");
      }
    } catch (error) {
      console.error("fetchInventory: Critical error:", error);
      if (mountedRef.current) {
        handleBusinessCriticalError(error, 'Inventory Data Fetch');
        setInventory([]);
      }
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }
  }, []);

  // Setup subscription with proper cleanup
  useEffect(() => {
    const setupSubscription = async () => {
      // Cleanup any existing subscription first
      if (subscriptionRef.current) {
        console.log("Cleaning up existing subscription before creating new one");
        await supabase.removeChannel(subscriptionRef.current);
        subscriptionRef.current = null;
        isSubscribedRef.current = false;
      }

      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        console.warn("No authenticated user found for subscription setup.");
        return;
      }

      // Only create subscription if we don't already have one
      if (!isSubscribedRef.current && mountedRef.current) {
        try {
          const channel = supabase.channel(`inventory-changes-${user.id}-${Date.now()}`);
          subscriptionRef.current = channel;

          console.log(`Creating new subscription channel: ${channel.topic}`);

          channel
            .on(
              'postgres_changes',
              {
                event: '*',
                schema: 'public',
                table: 'inventory',
                filter: `user_id=eq.${user.id}`
              },
              (payload) => {
                console.log('Inventory change received!', payload);
                if (mountedRef.current) {
                  fetchInventory();
                }
              }
            )
            .subscribe((status) => {
              if (status === 'SUBSCRIBED') {
                console.log('Successfully subscribed to inventory changes');
                isSubscribedRef.current = true;
              } else if (status === 'CHANNEL_ERROR') {
                console.error('Error subscribing to inventory changes');
                isSubscribedRef.current = false;
              }
            });

        } catch (error) {
          console.error("Error setting up inventory subscription:", error);
          handleBusinessCriticalError(error, 'Real-time Subscription Setup');
        }
      }
    };

    // Initial data fetch
    fetchInventory();
    
    // Setup subscription
    setupSubscription();

    // Cleanup function
    return () => {
      mountedRef.current = false;
      if (subscriptionRef.current) {
        console.log("Cleaning up inventory subscription on unmount");
        supabase.removeChannel(subscriptionRef.current);
        subscriptionRef.current = null;
        isSubscribedRef.current = false;
      }
    };
  }, []); // Empty dependency array to run only once

  // Reset mounted ref when component mounts
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  return (
    <InventoryContext.Provider
      value={{
        inventory,
        setInventory,
        selectedItems,
        setSelectedItems,
        isAddModalOpen,
        setIsAddModalOpen,
        isEditModalOpen,
        setIsEditModalOpen,
        formData,
        setFormData,
        editingItem,
        setEditingItem,
        isLoading,
        fetchInventory,
      }}
    >
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
