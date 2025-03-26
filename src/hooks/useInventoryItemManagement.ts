
import { useState } from "react";
import { InventoryItem } from "@/types/inventory";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export function useInventoryItemManagement(
  inventory: InventoryItem[],
  setInventory: React.Dispatch<React.SetStateAction<InventoryItem[]>>,
  onSuccess: () => void
) {
  const { toast } = useToast();
  const [selectedItems, setSelectedItems] = useState<number[]>([]);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<number | null>(null);
  const [currentEditItem, setCurrentEditItem] = useState<InventoryItem | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const handleDeleteItem = async (id: number) => {
    setItemToDelete(id);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;
    
    try {
      // Get current user to ensure we're only deleting their items
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Authentication Error",
          description: "You must be logged in to delete items",
          variant: "destructive",
        });
        return;
      }
      
      // First, check if this item is used in any bills
      const { data: billItems, error: billCheckError } = await supabase
        .from("bill_items")
        .select("id")
        .eq("inventory_item_id", itemToDelete)
        .limit(1);
        
      if (billCheckError) {
        console.error("Error checking bill items:", billCheckError);
        throw billCheckError;
      }
      
      if (billItems && billItems.length > 0) {
        // This item is used in bills, so we can't delete it
        toast({
          title: "Cannot Delete Item",
          description: "This item is used in one or more bills and cannot be deleted.",
          variant: "destructive",
        });
        setShowDeleteDialog(false);
        setItemToDelete(null);
        return;
      }
      
      console.log("Attempting to delete item with ID:", itemToDelete);
      console.log("User ID for deletion:", user.id);
      
      // Now safe to delete as the item is not referenced in bills
      const { error } = await supabase
        .from("inventory")
        .delete()
        .eq("id", itemToDelete)
        .eq("user_id", user.id); // Add user_id filter for security

      if (error) {
        console.error("Delete error:", error);
        throw error;
      }

      // Remove from local state
      setInventory(prev => prev.filter(item => item.id !== itemToDelete));
      
      // Remove from selected items if present
      setSelectedItems(prev => prev.filter(id => id !== itemToDelete));
      
      toast({
        title: "Item deleted",
        description: "The inventory item has been removed successfully."
      });
    } catch (error: any) {
      console.error("Error deleting item:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete item",
        variant: "destructive"
      });
    } finally {
      setShowDeleteDialog(false);
      setItemToDelete(null);
    }
  };

  const handleToggleSelectItem = (id: number) => {
    setSelectedItems((prevSelected) =>
      prevSelected.includes(id)
        ? prevSelected.filter((itemId) => itemId !== id)
        : [...prevSelected, id]
    );
  };

  const handleEditItem = (item: InventoryItem) => {
    setCurrentEditItem(item);
    setIsEditModalOpen(true);
  };

  const handleAddItem = () => {
    setIsAddModalOpen(true);
  };

  return {
    selectedItems,
    showDeleteDialog,
    setShowDeleteDialog,
    itemToDelete,
    currentEditItem,
    isAddModalOpen,
    setIsAddModalOpen,
    isEditModalOpen,
    setIsEditModalOpen,
    handleDeleteItem,
    confirmDelete,
    handleToggleSelectItem,
    handleEditItem,
    handleAddItem
  };
}
