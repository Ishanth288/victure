
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
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
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Add New Item</DialogTitle>
          <DialogDescription>
            Add a new item to your inventory. Fill in all required fields.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-[calc(90vh-8rem)] px-1">
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
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
