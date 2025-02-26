
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useInventory } from "@/contexts/InventoryContext";
import InventoryForm from "./InventoryForm";
import { useInventoryForm } from "@/hooks/useInventoryForm";
import { useEffect } from "react";

export function EditInventoryModal() {
  const {
    isEditModalOpen,
    setIsEditModalOpen,
    setInventory,
    inventory,
    editingItem,
    setEditingItem,
  } = useInventory();

  const {
    formData,
    setFormData,
    handleInputChange,
    handleSelectChange,
    handleEditItem,
    resetForm
  } = useInventoryForm(() => {
    setIsEditModalOpen(false);
    setEditingItem(null);
  });

  // Initialize form data when editingItem changes
  useEffect(() => {
    if (editingItem) {
      setFormData({
        name: editingItem.name,
        genericName: editingItem.generic_name || "",
        ndc: editingItem.ndc || "",
        manufacturer: editingItem.manufacturer || "",
        dosageForm: editingItem.dosage_form || "",
        strength: editingItem.strength || "",
        unitSize: editingItem.unit_size || "",
        unitCost: editingItem.unit_cost.toString(),
        sellingPrice: editingItem.selling_price?.toString() || (editingItem.unit_cost * 1.3).toString(),
        quantity: editingItem.quantity.toString(),
        reorderPoint: editingItem.reorder_point?.toString() || "10",
        expiryDate: editingItem.expiry_date || "",
        supplier: editingItem.supplier || "",
        storage: editingItem.storage_condition || "",
      });
    }
  }, [editingItem, setFormData]);

  const handleSubmit = async () => {
    if (!editingItem) return;
    const updatedItem = await handleEditItem(editingItem.id);
    if (updatedItem) {
      setInventory(inventory.map(item => 
        item.id === editingItem.id ? updatedItem : item
      ));
    }
  };

  return (
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
            resetForm();
            setIsEditModalOpen(false);
          }}
          onSubmit={handleSubmit}
        />
      </DialogContent>
    </Dialog>
  );
}
