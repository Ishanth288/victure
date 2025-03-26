
import { useRef } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import InventoryHeader from "@/components/inventory/InventoryHeader";
import InventorySearch from "@/components/inventory/InventorySearch";
import InventoryTable from "@/components/inventory/InventoryTable";
import InventoryPagination from "@/components/inventory/InventoryPagination";
import InventoryModals from "@/components/inventory/InventoryModals";
import InventoryDeleteDialog from "@/components/inventory/InventoryDeleteDialog";
import { PlanLimitAlert } from "@/components/PlanLimitAlert";
import { useInventoryData } from "@/hooks/useInventoryData";
import { useInventoryItemManagement } from "@/hooks/useInventoryItemManagement";
import { useInventoryFiltering } from "@/hooks/useInventoryFiltering";
import { useInventoryExport } from "@/components/inventory/InventoryExport";

export default function Inventory() {
  // Initialize hooks
  const { 
    loading, 
    inventory, 
    setInventory, 
    userPlan, 
    inventoryLimit,
    fetchInventoryData 
  } = useInventoryData();

  const { 
    searchQuery, 
    setSearchQuery, 
    filterType, 
    handleApplyFilter, 
    currentPage, 
    setCurrentPage, 
    totalPages, 
    filteredItems, 
    paginatedItems,
    itemsPerPage
  } = useInventoryFiltering(inventory);

  const { 
    selectedItems, 
    showDeleteDialog, 
    setShowDeleteDialog, 
    currentEditItem, 
    isAddModalOpen, 
    setIsAddModalOpen, 
    isEditModalOpen, 
    setIsEditModalOpen, 
    handleDeleteItem, 
    confirmDelete, 
    handleToggleSelectItem, 
    handleEditItem 
  } = useInventoryItemManagement(inventory, setInventory, fetchInventoryData);

  const { tableRef, handleExportInventory } = useInventoryExport();

  if (loading) {
    return (
      <DashboardLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[60vh]">
            <p>Loading inventory...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-8">
        {/* Show inventory limit alert based on plan */}
        <PlanLimitAlert 
          currentValue={inventory.length} 
          maxValue={inventoryLimit}
          resourceName="inventory items"
          variant={inventory.length > inventoryLimit * 0.9 ? "warning" : "info"}
        />

        <InventoryHeader 
          onAddClick={() => setIsAddModalOpen(true)} 
          onExportClick={handleExportInventory} 
        />

        <div className="mt-8">
          <InventorySearch
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            totalItems={filteredItems.length}
            onFilterChange={handleApplyFilter}
            activeFilter={filterType}
          />

          <div className="mt-6" ref={tableRef}>
            <InventoryTable
              items={paginatedItems}
              selectedItems={selectedItems}
              onToggleItem={handleToggleSelectItem}
              onEditItem={handleEditItem}
              onDeleteItem={handleDeleteItem}
            />
          </div>

          <div className="mt-4">
            <InventoryPagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              totalItems={filteredItems.length}
              itemsPerPage={itemsPerPage}
            />
          </div>
        </div>

        <InventoryModals
          isAddOpen={isAddModalOpen}
          isEditOpen={isEditModalOpen}
          editItem={currentEditItem}
          onAddClose={() => setIsAddModalOpen(false)}
          onEditClose={() => {
            setIsEditModalOpen(false);
          }}
          onSuccessfulSave={fetchInventoryData}
        />

        <InventoryDeleteDialog
          open={showDeleteDialog}
          onOpenChange={setShowDeleteDialog}
          onConfirm={confirmDelete}
        />
      </div>
    </DashboardLayout>
  );
}
