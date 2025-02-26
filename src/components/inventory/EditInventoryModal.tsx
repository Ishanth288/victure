
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
