
import { useState, useCallback } from "react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { type InventoryItem, type InventoryItemFormData } from "@/types/inventory";

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
  reorderPoint: "",
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
      const { data, error } = await supabase.from("inventory").insert([{
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
      }]).select().single();

      if (error) throw error;

      const newItem: InventoryItem = {
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
        description: "Item added successfully",
      });

      return newItem;
    } catch (error) {
      console.error("Error adding item:", error);
      toast({
        title: "Error",
        description: "Failed to add item",
        variant: "destructive",
      });
      return null;
    }
  };

  const handleEditItem = async (itemId: number) => {
    try {
      const { data, error } = await supabase
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
