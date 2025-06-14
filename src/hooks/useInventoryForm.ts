import { useState, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { type InventoryItem, type InventoryItemFormData, type InventoryItemDB } from "@/types/inventory";

const initialFormData: InventoryItemFormData = {
  name: "",
  genericName: "",
  ndc: "",
  manufacturer: "",
  dosageForm: "",
  strength: "",
  unitSize: "",
  unitCost: "",
  sellingPrice: "", // Ensuring sellingPrice is included here as well
  quantity: "",
  reorderPoint: "10",
  expiryDate: "",
  supplier: "",
  storage: "",
};

export function useInventoryForm(onSuccess: () => void) {
  const { toast } = useToast();
  const [formData, setFormData] = useState<InventoryItemFormData>(initialFormData);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  }, []);

  const handleSelectChange = useCallback((name: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  }, []);

  const resetForm = useCallback(() => {
    setFormData(initialFormData);
  }, []);

  const handleAddItem = async () => {
    try {
      if (!formData.name || !formData.unitCost || !formData.quantity) {
        toast({
          title: "Error",
          description: "Please fill in all required fields: Name, Cost Price, and Quantity",
          variant: "destructive",
        });
        return null;
      }

      // Get the current user's ID
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Error",
          description: "You must be logged in to add inventory items",
          variant: "destructive",
        });
        return null;
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
        return null;
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
        user_id: user.id // Add the user_id here
      };

      const { data: newItem, error } = await supabase
        .from("inventory")
        .insert([insertData])
        .select()
        .single();

      if (error) {
        console.error("Supabase error:", error);
        throw error;
      }

      if (!newItem) {
        throw new Error("No data returned from insert");
      }

      console.log("Successfully inserted:", newItem);
      
      resetForm();
      onSuccess();
      toast({
        title: "Success",
        description: "Item added successfully",
      });

      return newItem as InventoryItem;

    } catch (error) {
      console.error("Error adding item:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add item",
        variant: "destructive",
      });
      return null;
    }
  };

  const handleEditItem = async (itemId: number) => {
    try {
      if (!formData.name || !formData.unitCost || !formData.quantity) {
        toast({
          title: "Error",
          description: "Please fill in all required fields: Name, Cost Price, and Quantity",
          variant: "destructive",
        });
        return null;
      }

      // Get the current user's ID
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Error",
          description: "You must be logged in to edit inventory items",
          variant: "destructive",
        });
        return null;
      }

      const unitCost = parseFloat(formData.unitCost);
      const sellingPrice = parseFloat(formData.sellingPrice || "0");
      const quantity = parseInt(formData.quantity);
      const reorderPoint = parseInt(formData.reorderPoint || "10");

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
        generic_name: formData.genericName.trim() || null,
        strength: formData.strength.trim() || null,
        reorder_point: reorderPoint,
        storage_condition: formData.storage || null,
        user_id: user.id
      };

      const { data: updatedItem, error } = await supabase
        .from("inventory")
        .update(updateData)
        .eq('id', itemId)
        .select()
        .single();

      if (error) throw error;

      if (!updatedItem) {
        throw new Error("No data returned from update");
      }

      resetForm();
      onSuccess();
      toast({
        title: "Success",
        description: "Item updated successfully",
      });

      return updatedItem as InventoryItem;

    } catch (error) {
      console.error("Error updating item:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update item",
        variant: "destructive",
      });
      return null;
    }
  };

  return {
    formData,
    setFormData,
    handleInputChange,
    handleSelectChange,
    handleAddItem,
    handleEditItem,
    resetForm,
  };
}
