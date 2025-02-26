
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import InventoryForm from "./InventoryForm";
import { useInventory } from "@/contexts/InventoryContext";
import { useCallback } from "react";

export default function InventoryModals() {
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
    setFormData(prev => ({ ...prev, [name]: value }));
  }, [setFormData]);

  const handleSelectChange = useCallback((name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  }, [setFormData]);

  const handleAddItem = async () => {
    await new Promise(resolve => setTimeout(resolve, 1000));

    const newItem = {
      id: inventory.length + 1,
      name: formData.name,
      ndc: formData.ndc,
      manufacturer: formData.manufacturer,
      dosageForm: formData.dosageForm,
      unitSize: formData.strength,
      quantity: parseInt(formData.quantity),
      unitCost: parseFloat(formData.unitCost),
      expiryDate: formData.expiryDate,
      supplier: formData.supplier || "Not specified",
      status: parseInt(formData.quantity) > parseInt(formData.reorderPoint) ? "In Stock" : "Low Stock",
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
  };

  const handleEditSubmit = async () => {
    if (!editingItem) return;

    await new Promise(resolve => setTimeout(resolve, 1000));

    const updatedItem = {
      ...editingItem,
      name: formData.name,
      ndc: formData.ndc,
      manufacturer: formData.manufacturer,
      dosageForm: formData.dosageForm,
      unitSize: formData.strength,
      quantity: parseInt(formData.quantity),
      unitCost: parseFloat(formData.unitCost),
      expiryDate: formData.expiryDate,
      supplier: formData.supplier || "Not specified",
      status: parseInt(formData.quantity) > parseInt(formData.reorderPoint) ? "In Stock" : "Low Stock",
    };

    setInventory(prev => 
      prev.map(item => 
        item.id === editingItem.id ? updatedItem : item
      )
    );
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
