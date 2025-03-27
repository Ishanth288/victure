
import { createContext, useContext, useState, useEffect, ReactNode, Dispatch, SetStateAction } from "react";
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
    quantity: "",
    reorderPoint: "",
    expiryDate: "",
    supplier: "",
    storage: "",
  });
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);

  const fetchInventory = async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.error("No authenticated user found during inventory fetch");
        setInventory([]);
        setIsLoading(false);
        return;
      }
      
      const { data, error } = await supabase
        .from("inventory")
        .select("*")
        .eq("user_id", user.id)
        .order("name");

      if (error) throw error;

      console.log("Fetched inventory items:", data?.length || 0);
      
      if (data) {
        const inventoryItems: InventoryItem[] = (data as InventoryItemDB[]).map(item => ({
          ...item,
          generic_name: item.generic_name || null,
          strength: item.strength || null,
          reorder_point: item.reorder_point || 10,
          storage_condition: item.storage_condition || null
        }));

        setInventory(inventoryItems);
      }
    } catch (error) {
      console.error("Error fetching inventory:", error);
      toast({
        title: "Error",
        description: "Failed to fetch inventory items",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Setup realtime subscription
  useEffect(() => {
    const setupRealtimeSubscription = async () => {
      try {
        // Get the current user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          console.error("No authenticated user found when setting up realtime subscription");
          return;
        }
        
        console.log("Setting up realtime subscription for inventory table");
        
        const channel = supabase
          .channel('inventory-changes')
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'inventory',
              filter: `user_id=eq.${user.id}`
            },
            (payload) => {
              console.log("Received realtime update:", payload);
              fetchInventory();
            }
          )
          .subscribe((status) => {
            console.log("Supabase channel status:", status);
          });

        return () => {
          console.log("Removing Supabase channel subscription");
          supabase.removeChannel(channel);
        };
      } catch (error) {
        console.error("Error setting up realtime subscription:", error);
      }
    };
    
    setupRealtimeSubscription();
  }, []);

  // Initial data fetch
  useEffect(() => {
    fetchInventory();
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
