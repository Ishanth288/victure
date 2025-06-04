
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
    sellingPrice: "", // Added the missing sellingPrice property
    quantity: "",
    reorderPoint: "10",
    expiryDate: "",
    supplier: "",
    storage: "",
  });
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);

  const fetchInventory = useCallback(async () => {
    setIsLoading(true);
    console.log("fetchInventory: Starting data fetch.");
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        console.error("fetchInventory: Error getting user:", userError);
        setInventory([]);
        setIsLoading(false);
        return;
      }

      if (!user) {
        console.warn("fetchInventory: No authenticated user found. Skipping inventory fetch.");
        setInventory([]);
        setIsLoading(false);
        return;
      }
      
      const { data, error: fetchError } = await supabase
        .from("inventory")
        .select("*") // Include bill_items to check for references
        .eq("user_id", user.id)
        .order("name");

      if (fetchError) {
        console.error("fetchInventory: Supabase error fetching inventory data:", fetchError.message);
        toast({
          title: "Error",
          description: `Failed to load inventory data: ${fetchError.message}`,
          variant: "destructive",
        });
        setInventory([]);
        return; // Exit early on error
      }

      console.log("fetchInventory: Fetched inventory items count:", data?.length || 0);
      
      if (data && Array.isArray(data)) {
        const inventoryItems: InventoryItem[] = data.map(item => ({
          ...item,
          generic_name: item.generic_name || null,
          strength: item.strength || null,
          reorder_point: item.reorder_point || 10,
          storage_condition: item.storage_condition || null
        }));

        setInventory(inventoryItems);
        console.log("fetchInventory: Updated inventory state with items.");
      } else {
        console.warn("fetchInventory: No inventory data returned or data is not an array. Setting inventory to empty.");
        setInventory([]);
      }
    } catch (error) {
      console.error("fetchInventory: Caught error during inventory fetch:", error);
      toast({
        title: "Error",
        description: "Failed to fetch inventory items",
        variant: "destructive",
      });
      setInventory([]);
    } finally {
      setIsLoading(false);
      console.log("fetchInventory: Finished data fetch. isLoading set to false.");
    }
  }, [supabase, setInventory, toast]);

  const inventoryChannelRef = useRef<RealtimeChannel | null>(null);

  // Initial data fetch and realtime subscription setup
  useEffect(() => {
    let currentChannel: RealtimeChannel | null = null; // Use a local variable for the current effect run

    const setupSubscription = async () => {
      setIsLoading(true);
      console.log("InventoryContext useEffect: Starting inventory setup.");

      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError) {
        console.error("InventoryContext useEffect: Error getting user:", userError);
        setInventory([]);
        setIsLoading(false);
        return;
      }

      if (!user) {
        console.warn("InventoryContext useEffect: No authenticated user found. Skipping inventory fetch and subscription.");
        setInventory([]);
        setIsLoading(false);
        return;
      }

      console.log("InventoryContext useEffect: Authenticated user found:", user.id);

      try {
        // Fetch inventory data
        const { data, error } = await supabase
          .from("inventory")
          .select("*")
          .eq("user_id", user.id)
          .order("name");

        if (error) {
          console.error("InventoryContext useEffect: Error fetching inventory data:", error);
          throw error;
        }

        if (data && Array.isArray(data)) {
          const inventoryItems: InventoryItem[] = data.map(item => ({
            ...item,
            generic_name: item.generic_name || null,
            strength: item.strength || null,
            reorder_point: item.reorder_point || 10,
            storage_condition: item.storage_condition || null
          }));
          setInventory(inventoryItems);
          console.log("InventoryContext useEffect: Updated inventory state with items.");
        } else {
          console.warn("InventoryContext useEffect: No inventory data returned or data is not an array.");
          setInventory([]);
        }

        // Realtime subscription logic
        // Ensure previous channel is removed before creating a new one
        if (inventoryChannelRef.current) {
          console.log(`InventoryContext useEffect: Removing existing channel ${inventoryChannelRef.current.topic}.`);
          supabase.removeChannel(inventoryChannelRef.current);
          inventoryChannelRef.current = null;
        }

        const newChannel = supabase.channel(`inventory-changes-${user.id}`);
        currentChannel = newChannel; // Assign to local variable for cleanup
        inventoryChannelRef.current = newChannel; // Also update ref for persistence

        console.log(`InventoryContext useEffect: Created new channel 'inventory-changes-${user.id}'.`);

        newChannel
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
              fetchInventory();
            }
          )
          .subscribe();

      } catch (error) {
        console.error("InventoryContext useEffect: Caught error during inventory setup:", error);
        toast({
          title: "Error",
          description: "Failed to setup inventory subscription",
          variant: "destructive",
        });
        setInventory([]);
      } finally {
        setIsLoading(false);
        console.log("InventoryContext useEffect: Finished inventory setup. isLoading set to false.");
      }
    };

    setupSubscription();

    // Cleanup function for useEffect
    return () => {
      if (currentChannel) { // Use the local variable for cleanup
        console.log(`InventoryContext useEffect cleanup: Removing channel ${currentChannel.topic}.`);
        supabase.removeChannel(currentChannel);
        inventoryChannelRef.current = null; // Clear the ref as well
      }
    };
  }, [supabase, fetchInventory, toast, setInventory]); // Added toast and setInventory to dependencies

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
