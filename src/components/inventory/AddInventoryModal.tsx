
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

export function AddInventoryModal() {
  const { isAddModalOpen, setIsAddModalOpen, setInventory, inventory } = useInventory();

  const {
    formData,
    handleInputChange,
    handleSelectChange,
    handleAddItem,
    resetForm
  } = useInventoryForm(() => setIsAddModalOpen(false));

  const handleSubmit = async () => {
    const newItem = await handleAddItem();
    if (newItem) {
      setInventory([...inventory, newItem]);
    }
  };

  return (
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
            resetForm();
            setIsAddModalOpen(false);
          }}
          onSubmit={handleSubmit}
        />
      </DialogContent>
    </Dialog>
  );
}
