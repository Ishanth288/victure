import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import InventoryForm from "./InventoryForm";
import { useInventoryForm } from "@/hooks/useInventoryForm";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";
import { InventoryItem } from "@/types/inventory";
import { useToast } from "@/hooks/use-toast";

interface EditInventoryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: InventoryItem | null;
  onSuccess?: () => void;
}

export function EditInventoryModal({ open, onOpenChange, item, onSuccess }: EditInventoryModalProps) {
  const { toast } = useToast();
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserId = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
      }
    };
    
    fetchUserId();
  }, []);

  const handleSuccess = () => {
    if (onSuccess) {
      onSuccess();
    }
    onOpenChange(false);
  };

  const {
    formData,
    setFormData,
    handleInputChange,
    handleSelectChange,
    resetForm
  } = useInventoryForm(handleSuccess);

  // Initialize form data when item changes
  useEffect(() => {
    if (item) {
      setFormData({
        name: item.name,
        genericName: item.generic_name || "",
        ndc: item.ndc || "",
        manufacturer: item.manufacturer || "",
        dosageForm: item.dosage_form || "",
        strength: item.strength || "",
        unitSize: item.unit_size || "",
        unitCost: item.unit_cost.toString(),
        sellingPrice: item.selling_price?.toString() || "",
        quantity: item.quantity.toString(),
        reorderPoint: item.reorder_point?.toString() || "10",
        expiryDate: item.expiry_date || "",
        supplier: item.supplier || "",
        storage: item.storage_condition || "",
      });
    }
  }, [item, setFormData]);

  const handleUpdateItem = async () => {
    try {
      if (!item) {
        toast({
          title: "Error",
          description: "No item selected for editing",
          variant: "destructive",
        });
        return;
      }

      if (!userId) {
        toast({
          title: "Authentication Error",
          description: "You must be logged in to edit inventory items",
          variant: "destructive",
        });
        return;
      }

      // Verify the item belongs to the current user
      const { data: itemData, error: fetchError } = await supabase
        .from("inventory")
        .select("user_id")
        .eq("id", item.id)
        .single();

      if (fetchError) throw fetchError;

      if (itemData.user_id !== userId) {
        toast({
          title: "Access Denied",
          description: "You can only edit your own inventory items",
          variant: "destructive",
        });
        return;
      }

      if (!formData.name || !formData.unitCost || !formData.quantity) {
        toast({
          title: "Error",
          description: "Please fill in all required fields: Name, Cost Price, and Quantity",
          variant: "destructive",
        });
        return;
      }

      const unitCost = parseFloat(formData.unitCost);
      const sellingPrice = parseFloat(formData.sellingPrice || "0");
      const quantity = parseInt(formData.quantity);
      const reorderPoint = parseInt(formData.reorderPoint || "10");

      if (isNaN(unitCost) || isNaN(quantity)) {
        toast({
          title: "Error",
          description: "Please enter valid numbers for Cost Price and Quantity",
          variant: "destructive",
        });
        return;
      }

      // Calculate a default selling price if not provided
      const finalSellingPrice = isNaN(sellingPrice) || sellingPrice <= 0 
        ? unitCost * 1.4 // Default 40% markup
        : sellingPrice;

      const updateData = {
        name: formData.name.trim(),
        ndc: formData.ndc.trim() || null,
        manufacturer: formData.manufacturer.trim() || null,
        dosage_form: formData.dosageForm || null,
        unit_size: formData.unitSize.trim() || null,
        unit_cost: unitCost,
        selling_price: finalSellingPrice,
        quantity: quantity,
        expiry_date: formData.expiryDate || null,
        supplier: formData.supplier.trim() || null,
        status: determineStatus(quantity, reorderPoint),
        generic_name: formData.genericName.trim() || null,
        strength: formData.strength.trim() || null,
        reorder_point: reorderPoint,
        storage_condition: formData.storage || null,
        user_id: userId
      };

      const { data, error } = await supabase
        .from("inventory")
        .update(updateData)
        .eq("id", item.id)
        .eq("user_id", userId)
        .select();

      if (error) throw error;

      toast({
        title: "Success",
        description: "Item updated successfully",
      });
      resetForm();
      handleSuccess();
    } catch (error) {
      console.error("Error updating item:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update item",
        variant: "destructive",
      });
    }
  };

  // Determine inventory status based on quantity
  const determineStatus = (quantity: number, reorderPoint: number): string => {
    if (quantity <= 0) return "out of stock";
    if (quantity <= reorderPoint) return "low stock";
    return "in stock";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl inventory-modal-content">
        <DialogHeader className="flex-shrink-0 pb-4 border-b">
          <DialogTitle>Edit Item</DialogTitle>
          <DialogDescription>
            Update the item details. All changes will be saved automatically.
          </DialogDescription>
        </DialogHeader>
        <div className="inventory-modal-body">
          <div className="inventory-modal-scroll">
            <div className="inventory-form-container py-4">
              <InventoryForm
                formData={formData}
                isEdit
                onInputChange={handleInputChange}
                onSelectChange={handleSelectChange}
                onCancel={() => {
                  resetForm();
                  onOpenChange(false);
                }}
                onSubmit={handleUpdateItem}
              />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
