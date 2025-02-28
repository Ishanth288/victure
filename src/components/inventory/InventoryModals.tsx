
import { AddInventoryModal } from "./AddInventoryModal";
import { EditInventoryModal } from "./EditInventoryModal";
import { InventoryItem } from "@/types/inventory";

interface InventoryModalsProps {
  isAddOpen: boolean;
  isEditOpen: boolean;
  editItem: InventoryItem | null; 
  onAddClose: () => void;
  onEditClose: () => void;
  onSuccessfulSave: () => void;
}

export default function InventoryModals({ 
  isAddOpen, 
  isEditOpen, 
  editItem, 
  onAddClose, 
  onEditClose,
  onSuccessfulSave 
}: InventoryModalsProps) {
  return (
    <>
      <AddInventoryModal 
        open={isAddOpen} 
        onOpenChange={onAddClose} 
        onSuccess={onSuccessfulSave}
      />
      
      <EditInventoryModal 
        open={isEditOpen} 
        onOpenChange={onEditClose} 
        item={editItem}
        onSuccess={onSuccessfulSave}
      />
    </>
  );
}
