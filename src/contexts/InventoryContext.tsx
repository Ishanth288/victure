
import { createContext, useContext, useState, ReactNode } from "react";
import { type InventoryItem, type InventoryItemFormData } from "@/types/inventory";

interface InventoryContextType {
  inventory: InventoryItem[];
  setInventory: (items: InventoryItem[]) => void;
  selectedItems: number[];
  setSelectedItems: (ids: number[]) => void;
  isAddModalOpen: boolean;
  setIsAddModalOpen: (open: boolean) => void;
  isEditModalOpen: boolean;
  setIsEditModalOpen: (open: boolean) => void;
  formData: InventoryItemFormData;
  setFormData: (data: InventoryItemFormData) => void;
  editingItem: InventoryItem | null;
  setEditingItem: (item: InventoryItem | null) => void;
}

const InventoryContext = createContext<InventoryContextType | undefined>(undefined);

export function InventoryProvider({ children }: { children: ReactNode }) {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [selectedItems, setSelectedItems] = useState<number[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [formData, setFormData] = useState<InventoryItemFormData>({
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
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);

  return (
    <InventoryContext.Provider
      value={{
        inventory,
        setInventory,
        selectedItems,
        setSelectedItems,
        isAddModalOpen,
        setIsAddModalOpen,
        isEditModalOpen,
        setIsEditModalOpen,
        formData,
        setFormData,
        editingItem,
        setEditingItem,
      }}
    >
      {children}
    </InventoryContext.Provider>
  );
}

export const useInventory = () => {
  const context = useContext(InventoryContext);
  if (context === undefined) {
    throw new Error("useInventory must be used within an InventoryProvider");
  }
  return context;
};
