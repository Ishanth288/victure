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
import { useToast } from "@/hooks/use-toast";

interface AddInventoryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function AddInventoryModal({ open, onOpenChange, onSuccess }: AddInventoryModalProps) {
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
    handleInputChange,
    handleSelectChange,
    resetForm
  } = useInventoryForm(handleSuccess);

  const handleAddItem = async () => {
    try {
      if (!userId) {
        toast({
          title: "Authentication Error",
          description: "You must be logged in to add inventory items",
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

      const insertData = {
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
        status: 'in stock',
        generic_name: formData.genericName.trim() || null,
        strength: formData.strength.trim() || null,
        reorder_point: reorderPoint,
        storage_condition: formData.storage || null,
        user_id: userId
      };

      const { data, error } = await supabase
        .from("inventory")
        .insert([insertData])
        .select();

      if (error) throw error;

      toast({
        title: "Success",
        description: "Item added successfully",
      });
      resetForm();
      handleSuccess();
    } catch (error) {
      console.error("Error adding item:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add item",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl inventory-modal-content">
        <DialogHeader className="flex-shrink-0 pb-4 border-b">
          <DialogTitle>Add New Item</DialogTitle>
          <DialogDescription>
            Add a new item to your inventory. Fill in all required fields.
          </DialogDescription>
        </DialogHeader>
        <div className="inventory-modal-body">
          <div className="inventory-modal-scroll">
            <div className="inventory-form-container py-4">
              <InventoryForm
                formData={formData}
                onInputChange={handleInputChange}
                onSelectChange={handleSelectChange}
                onCancel={() => {
                  resetForm();
                  onOpenChange(false);
                }}
                onSubmit={handleAddItem}
              />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
