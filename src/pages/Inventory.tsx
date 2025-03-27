
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import InventoryHeader from "@/components/inventory/InventoryHeader";
import InventorySearch from "@/components/inventory/InventorySearch";
import InventoryTable from "@/components/inventory/InventoryTable";
import InventoryPagination from "@/components/inventory/InventoryPagination";
import InventoryModals from "@/components/inventory/InventoryModals";
import { PlanLimitAlert } from "@/components/PlanLimitAlert";
import { supabase } from "@/integrations/supabase/client";
import { InventoryItem } from "@/types/inventory";
import { useToast } from "@/components/ui/use-toast";
import { InventoryProvider, useInventory } from "@/contexts/InventoryContext";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// Inner component that uses the inventory context
function InventoryContent() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { 
    inventory, 
    selectedItems, 
    setSelectedItems,
    isAddModalOpen, 
    setIsAddModalOpen,
    isEditModalOpen,
    setIsEditModalOpen,
    editingItem,
    setEditingItem,
    isLoading,
    fetchInventory
  } = useInventory();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<number | null>(null);
  const [filterType, setFilterType] = useState<string | null>(null);
  const [userPlan, setUserPlan] = useState<string>("Free Trial");
  const [inventoryLimit, setInventoryLimit] = useState<number>(501);
  const tableRef = useRef<HTMLDivElement>(null);

  const itemsPerPage = 10;

  useEffect(() => {
    checkAuth();
    fetchUserPlan();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      toast({
        title: "Authentication Required",
        description: "Please login to view inventory",
        variant: "destructive",
      });
      navigate("/auth");
    }
  };

  const fetchUserPlan = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("profiles")
        .select("plan_type")
        .eq("id", user.id)
        .single();

      if (error) throw error;

      if (data) {
        setUserPlan(data.plan_type);
        
        // Set inventory limit based on plan
        if (data.plan_type === "PRO") {
          setInventoryLimit(4001);
        } else if (data.plan_type === "PRO PLUS") {
          setInventoryLimit(10000);
        } else {
          setInventoryLimit(501); // Free Trial
        }
      }
    } catch (error) {
      console.error("Error fetching user plan:", error);
    }
  };

  const handleDeleteItem = async (id: number) => {
    setItemToDelete(id);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;
    
    try {
      // Get current user to ensure we're only deleting their items
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Authentication Error",
          description: "You must be logged in to delete items",
          variant: "destructive",
        });
        return;
      }
      
      // First, check if this item is used in any bills
      const { data: billItems, error: billCheckError } = await supabase
        .from("bill_items")
        .select("id")
        .eq("inventory_item_id", itemToDelete)
        .limit(1);
        
      if (billCheckError) {
        console.error("Error checking bill items:", billCheckError);
        throw billCheckError;
      }
      
      if (billItems && billItems.length > 0) {
        // This item is used in bills, so we can't delete it
        toast({
          title: "Cannot Delete Item",
          description: "This item is used in one or more bills and cannot be deleted.",
          variant: "destructive",
        });
        setShowDeleteDialog(false);
        setItemToDelete(null);
        return;
      }
      
      console.log("Attempting to delete item with ID:", itemToDelete);
      console.log("User ID for deletion:", user.id);
      
      // Now safe to delete as the item is not referenced in bills
      const { error } = await supabase
        .from("inventory")
        .delete()
        .eq("id", itemToDelete)
        .eq("user_id", user.id); // Add user_id filter for security

      if (error) {
        console.error("Delete error:", error);
        throw error;
      }

      // Remove from selected items if present
      setSelectedItems(prev => prev.filter(id => id !== itemToDelete));
      
      // Refresh inventory after deletion
      fetchInventory();
      
      toast({
        title: "Item deleted",
        description: "The inventory item has been removed successfully."
      });
    } catch (error: any) {
      console.error("Error deleting item:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete item",
        variant: "destructive"
      });
    } finally {
      setShowDeleteDialog(false);
      setItemToDelete(null);
    }
  };

  const handleApplyFilter = (type: string) => {
    setFilterType(type === filterType ? null : type);
    setCurrentPage(1);
  };

  const filteredItems = inventory.filter((item) => {
    // First filter by search query
    const matchesSearch = 
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.generic_name && item.generic_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.manufacturer && item.manufacturer.toLowerCase().includes(searchQuery.toLowerCase()));
    
    // Then apply other filters if any
    if (!matchesSearch) return false;
    
    if (filterType === "lowStock") {
      return item.quantity < (item.reorder_point || 10);
    } else if (filterType === "expiringSoon") {
      if (!item.expiry_date) return false;
      
      const expiryDate = new Date(item.expiry_date);
      const now = new Date();
      const monthsDiff = (expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24 * 30);
      
      return monthsDiff <= 3; // Items expiring within 3 months
    }
    
    return true;
  });

  useEffect(() => {
    setTotalPages(Math.ceil(filteredItems.length / itemsPerPage));
    // Reset to page 1 if current page is out of bounds
    if (currentPage > Math.ceil(filteredItems.length / itemsPerPage) && filteredItems.length > 0) {
      setCurrentPage(1);
    }
  }, [filteredItems, currentPage]);

  const paginatedItems = filteredItems.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleToggleSelectItem = (id: number) => {
    setSelectedItems((prevSelected) =>
      prevSelected.includes(id)
        ? prevSelected.filter((itemId) => itemId !== id)
        : [...prevSelected, id]
    );
  };

  const handleEditItem = (item: InventoryItem) => {
    setEditingItem(item);
    setIsEditModalOpen(true);
  };

  const handleExportInventory = async () => {
    if (!tableRef.current) return;
    
    try {
      // Create a temporary wrapper div to style the export
      const wrapper = document.createElement('div');
      wrapper.className = 'bg-white p-8';
      
      // Add a header
      const header = document.createElement('div');
      header.className = 'text-center mb-6';
      header.innerHTML = `
        <h1 class="text-3xl font-bold mb-2">Inventory Report - Victure</h1>
        <p class="text-gray-600">Generated on ${new Date().toLocaleDateString()}</p>
      `;
      wrapper.appendChild(header);
      
      // Create a clone of the table to modify for export
      const table = tableRef.current.querySelector('table')?.cloneNode(true) as HTMLTableElement;
      if (!table) {
        throw new Error("Table not found");
      }
      
      // Remove the actions column
      const rows = table.querySelectorAll('tr');
      rows.forEach(row => {
        // Remove the last cell (actions) and first cell (checkbox)
        const cells = row.querySelectorAll('td, th');
        if (cells.length > 0) {
          row.removeChild(cells[cells.length - 1]); // Remove actions
          row.removeChild(cells[0]); // Remove checkbox
        }
      });
      
      table.className = 'w-full border-collapse';
      
      // Style all cells
      const cells = table.querySelectorAll('td, th');
      cells.forEach(cell => {
        cell.className = 'border border-gray-300 p-2';
      });
      
      wrapper.appendChild(table);
      
      // Add to document temporarily
      document.body.appendChild(wrapper);
      
      // Create PDF
      const pdf = new jsPDF('landscape', 'mm', 'a4');
      
      await html2canvas(wrapper, {
        scale: 1.5,
        useCORS: true,
        backgroundColor: "#ffffff"
      }).then(canvas => {
        const imgData = canvas.toDataURL('image/png');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
        
        pdf.addImage(imgData, 'PNG', 10, 10, pdfWidth - 20, pdfHeight - 20);
        
        // Add watermark
        pdf.setFontSize(12);
        pdf.setTextColor(180, 180, 180);
        pdf.text('Victure', pdf.internal.pageSize.getWidth() - 20, 10);
        
        pdf.save('inventory-report.pdf');
      });
      
      // Remove temporary element
      document.body.removeChild(wrapper);
      
      toast({
        title: "Export successful",
        description: "Inventory report has been exported as PDF",
      });
    } catch (error) {
      console.error("Error exporting inventory:", error);
      toast({
        title: "Export failed",
        description: "Failed to export inventory report",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[60vh]">
          <p>Loading inventory...</p>
        </div>
      </div>
    );
  }

  return (
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
        editItem={editingItem}
        onAddClose={() => setIsAddModalOpen(false)}
        onEditClose={() => {
          setIsEditModalOpen(false);
          setEditingItem(null);
        }}
        onSuccessfulSave={fetchInventory}
      />

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this item?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the inventory item and remove the data from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// Main inventory page component
export default function Inventory() {
  return (
    <DashboardLayout>
      <InventoryProvider>
        <InventoryContent />
      </InventoryProvider>
    </DashboardLayout>
  );
}
