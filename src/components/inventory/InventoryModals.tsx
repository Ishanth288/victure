
import { useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import InventoryForm from "./InventoryForm";
import { useInventory } from "@/contexts/InventoryContext";
import { type InventoryItem, type InventoryItemFormData } from "@/types/inventory";

export default function InventoryModals() {
  const { toast } = useToast();
  const {
    isAddModalOpen,
    setIsAddModalOpen,
    isEditModalOpen,
    setIsEditModalOpen,
    formData,
    setFormData,
    inventory,
    setInventory,
    editingItem,
    setEditingItem,
  } = useInventory();

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  }, [setFormData]);

  const handleSelectChange = useCallback((name: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  }, [setFormData]);

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

      setInventory([...inventory, newItem]);
      setFormData({
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
      });
      setIsAddModalOpen(false);
      toast({
        title: "Success",
        description: "Item added successfully",
      });
    } catch (error) {
      console.error("Error adding item:", error);
      toast({
        title: "Error",
        description: "Failed to add item",
        variant: "destructive",
      });
    }
  };

  const handleEditSubmit = async () => {
    if (!editingItem) return;

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
        .eq("id", editingItem.id)
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

      setInventory(inventory.map(item => 
        item.id === editingItem.id ? updatedItem : item
      ));
      
      setFormData({
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
      });
      setEditingItem(null);
      setIsEditModalOpen(false);
      toast({
        title: "Success",
        description: "Item updated successfully",
      });
    } catch (error) {
      console.error("Error updating item:", error);
      toast({
        title: "Error",
        description: "Failed to update item",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Add New Item</DialogTitle>
            <DialogDescription>
              Add a new item to your inventory. Fill in all required fields.
            </DialogDescription>
          </DialogHeader>
          <InventoryForm
            formData={formData}
            onInputChange={handleInputChange}
            onSelectChange={handleSelectChange}
            onCancel={() => {
              setFormData({
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
              });
              setIsAddModalOpen(false);
            }}
            onSubmit={handleAddItem}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Edit Item</DialogTitle>
            <DialogDescription>
              Update the item details. All changes will be saved automatically.
            </DialogDescription>
          </DialogHeader>
          <InventoryForm
            formData={formData}
            isEdit
            onInputChange={handleInputChange}
            onSelectChange={handleSelectChange}
            onCancel={() => {
              setFormData({
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
              });
              setIsEditModalOpen(false);
            }}
            onSubmit={handleEditSubmit}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
