
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
import { type InventoryItem } from "@/types/inventory";

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

  const handleEditClick = (item: InventoryItem) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      genericName: item.generic_name || "",
      ndc: item.ndc || "",
      manufacturer: item.manufacturer || "",
      dosageForm: item.dosage_form || "",
      strength: item.strength || "",
      unitSize: item.unit_size || "",
      unitCost: item.unit_cost.toString(),
      sellingPrice: (item.selling_price || item.unit_cost * 1.3).toString(),
      quantity: item.quantity.toString(),
      reorderPoint: item.reorder_point.toString(),
      expiryDate: item.expiry_date || "",
      supplier: item.supplier || "",
      storage: item.storage_condition || "",
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
          const updatedItems = selectedItems.includes(id)
            ? selectedItems.filter(item => item !== id)
            : [...selectedItems, id];
          setSelectedItems(updatedItems);
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
