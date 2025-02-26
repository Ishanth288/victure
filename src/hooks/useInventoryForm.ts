
import { useState, useCallback } from "react";
import { useToast } from "@/components/ui/use-toast";
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
  sellingPrice: "",
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
          description: "Please fill in all required fields: Name, Unit Cost, and Quantity",
          variant: "destructive",
        });
        return null;
      }

      const unitCost = parseFloat(formData.unitCost);
      const quantity = parseInt(formData.quantity);
      const reorderPoint = parseInt(formData.reorderPoint || "10");

      // Additional validation for numeric values
      if (isNaN(unitCost) || isNaN(quantity) || isNaN(reorderPoint)) {
        toast({
          title: "Error",
          description: "Please enter valid numbers for Unit Cost, Quantity, and Reorder Point",
          variant: "destructive",
        });
        return null;
      }

      // Make sure we have valid positive numbers
      if (unitCost <= 0 || quantity < 0 || reorderPoint < 0) {
        toast({
          title: "Error",
          description: "Unit Cost must be greater than 0, and Quantity and Reorder Point must be non-negative",
          variant: "destructive",
        });
        return null;
      }

      console.log("Attempting to add item with data:", {
        name: formData.name.trim(),
        unit_cost: unitCost,
        quantity: quantity,
        reorder_point: reorderPoint
      });

      const { data: rawData, error } = await supabase
        .from("inventory")
        .insert([
          {
            name: formData.name.trim(),
            generic_name: formData.genericName.trim() || null,
            ndc: formData.ndc.trim() || null,
            manufacturer: formData.manufacturer.trim() || null,
            dosage_form: formData.dosageForm || null,
            strength: formData.strength.trim() || null,
            unit_size: formData.unitSize.trim() || null,
            unit_cost: unitCost,
            selling_price: formData.sellingPrice ? parseFloat(formData.sellingPrice) : null,
            quantity: quantity,
            reorder_point: reorderPoint,
            expiry_date: formData.expiryDate || null,
            supplier: formData.supplier.trim() || null,
            storage_condition: formData.storage || null,
            status: 'in stock',
          }
        ])
        .select()
        .single();

      if (error) {
        console.error("Supabase error:", error);
        throw error;
      }

      if (!rawData) {
        throw new Error("No data returned from insert");
      }

      const data = rawData as InventoryItemDB;

      const newItem: InventoryItem = {
        ...data,
        generic_name: data.generic_name || null,
        strength: data.strength || null,
        selling_price: data.selling_price || null,
        reorder_point: data.reorder_point || 10,
        storage_condition: data.storage_condition || null,
      };

      console.log("Successfully added item:", newItem);
      resetForm();
      onSuccess();
      toast({
        title: "Success",
        description: "Item added successfully",
      });

      return newItem;
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
      const { data: rawData, error } = await supabase
        .from("inventory")
        .update({
          name: formData.name,
          generic_name: formData.genericName || null,
          ndc: formData.ndc || null,
          manufacturer: formData.manufacturer || null,
          dosage_form: formData.dosageForm || null,
          strength: formData.strength || null,
          unit_size: formData.unitSize || null,
          unit_cost: parseFloat(formData.unitCost),
          selling_price: parseFloat(formData.sellingPrice) || null,
          quantity: parseInt(formData.quantity),
          reorder_point: parseInt(formData.reorderPoint),
          expiry_date: formData.expiryDate || null,
          supplier: formData.supplier || null,
          storage_condition: formData.storage || null,
        })
        .eq("id", itemId)
        .select()
        .single();

      if (error) throw error;

      const data = rawData as InventoryItemDB;

      const updatedItem: InventoryItem = {
        ...data,
        generic_name: data.generic_name || null,
        strength: data.strength || null,
        selling_price: data.selling_price || null,
        reorder_point: data.reorder_point || 10,
        storage_condition: data.storage_condition || null,
      };

      resetForm();
      onSuccess();
      toast({
        title: "Success",
        description: "Item updated successfully",
      });

      return updatedItem;
    } catch (error) {
      console.error("Error updating item:", error);
      toast({
        title: "Error",
        description: "Failed to update item",
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
