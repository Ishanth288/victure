import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import DashboardLayout from "@/components/DashboardLayout";
import InventoryForm from "@/components/inventory/InventoryForm";
import InventoryHeader from "@/components/inventory/InventoryHeader";
import InventorySearch from "@/components/inventory/InventorySearch";
import InventoryTable from "@/components/inventory/InventoryTable";
import { type InventoryItem, type InventoryItemFormData } from "@/types/inventory";

const inventoryData = [
  {
    id: 1,
    name: "Amoxicillin",
    ndc: "12345-678-90",
    manufacturer: "PharmaCo",
    dosageForm: "Tablet",
    unitSize: "500mg",
    quantity: 150,
    unitCost: 2.5,
    expiryDate: "2024-12-31",
    supplier: "MedSupply Inc",
    status: "In Stock",
  },
  {
    id: 2,
    name: "Lisinopril",
    ndc: "98765-432-10",
    manufacturer: "MediPharm",
    dosageForm: "Tablet",
    unitSize: "10mg",
    quantity: 50,
    unitCost: 1.75,
    expiryDate: "2024-06-30",
    supplier: "PharmaDist",
    status: "Low Stock",
  },
  {
    id: 3,
    name: "Ibuprofen",
    ndc: "45678-901-23",
    manufacturer: "HealthCare",
    dosageForm: "Capsule",
    unitSize: "200mg",
    quantity: 0,
    unitCost: 0.5,
    expiryDate: "2024-03-15",
    supplier: "MedSupply Inc",
    status: "Out of Stock",
  },
];

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

export default function Inventory() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedItems, setSelectedItems] = useState<number[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [formData, setFormData] = useState<InventoryItemFormData>(initialFormData);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [inventory, setInventory] = useState<InventoryItem[]>(inventoryData);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  }, []);

  const handleSelectChange = useCallback((name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  }, []);

  const handleEditClick = (item: InventoryItem) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      genericName: "",
      ndc: item.ndc,
      manufacturer: item.manufacturer,
      dosageForm: item.dosageForm,
      strength: item.unitSize,
      unitSize: item.unitSize,
      unitCost: item.unitCost.toString(),
      sellingPrice: (item.unitCost * 1.3).toString(),
      quantity: item.quantity.toString(),
      reorderPoint: "10",
      expiryDate: item.expiryDate,
      supplier: item.supplier,
      storage: "Room Temperature",
    });
    setIsEditModalOpen(true);
  };

  const toggleItemSelection = (id: number) => {
    setSelectedItems(prev => 
      prev.includes(id) 
        ? prev.filter(item => item !== id)
        : [...prev, id]
    );
  };

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

    setInventory(prev => [...prev, newItem]);
    setFormData(initialFormData);
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
    setFormData(initialFormData);
    setEditingItem(null);
    setIsEditModalOpen(false);
  };

  return (
    <DashboardLayout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="space-y-6"
      >
        <InventoryHeader onAddClick={() => setIsAddModalOpen(true)} />
        
        <InventorySearch
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />

        <InventoryTable
          items={inventory}
          selectedItems={selectedItems}
          onToggleItem={toggleItemSelection}
          onEditItem={handleEditClick}
        />

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
                setFormData(initialFormData);
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
                setFormData(initialFormData);
                setIsEditModalOpen(false);
              }}
              onSubmit={handleEditSubmit}
            />
          </DialogContent>
        </Dialog>

        <div className="flex items-center justify-between">
          <p className="text-sm text-neutral-600">
            Showing {inventory.length} of {inventory.length} items
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled>
              Previous
            </Button>
            <Button variant="outline" size="sm" disabled>
              Next
            </Button>
          </div>
        </div>
      </motion.div>
    </DashboardLayout>
  );
}
