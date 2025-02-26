
import { useEffect } from "react";
import { motion } from "framer-motion";
import DashboardLayout from "@/components/DashboardLayout";
import InventoryForm from "@/components/inventory/InventoryForm";
import InventoryHeader from "@/components/inventory/InventoryHeader";
import InventorySearch from "@/components/inventory/InventorySearch";
import InventoryTable from "@/components/inventory/InventoryTable";
import InventoryModals from "@/components/inventory/InventoryModals";
import InventoryPagination from "@/components/inventory/InventoryPagination";
import { InventoryProvider, useInventory } from "@/contexts/InventoryContext";

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

function InventoryContent() {
  const {
    inventory,
    setInventory,
    selectedItems,
    setSelectedItems,
    setIsAddModalOpen,
    formData,
    setFormData,
    setIsEditModalOpen,
    setEditingItem,
  } = useInventory();

  useEffect(() => {
    setInventory(inventoryData);
  }, [setInventory]);

  const handleEditClick = (item: typeof inventory[0]) => {
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      <InventoryHeader onAddClick={() => setIsAddModalOpen(true)} />
      
      <InventorySearch
        searchQuery=""
        onSearchChange={() => {}}
      />

      <InventoryTable
        items={inventory}
        selectedItems={selectedItems}
        onToggleItem={(id) => {
          setSelectedItems((prev: number[]) => 
            prev.includes(id) 
              ? prev.filter(item => item !== id)
              : [...prev, id]
          );
        }}
        onEditItem={handleEditClick}
      />

      <InventoryModals />

      <InventoryPagination totalItems={inventory.length} />
    </motion.div>
  );
}

export default function Inventory() {
  return (
    <DashboardLayout>
      <InventoryProvider>
        <InventoryContent />
      </InventoryProvider>
    </DashboardLayout>
  );
}
