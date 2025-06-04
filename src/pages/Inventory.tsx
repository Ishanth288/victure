import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import InventoryHeader from "@/components/inventory/InventoryHeader";
import InventorySearch from "@/components/inventory/InventorySearch";
import InventoryTable from "@/components/inventory/InventoryTable";
import InventoryModals from "@/components/inventory/InventoryModals";
import { PlanLimitAlert } from "@/components/PlanLimitAlert";
import { supabase } from "@/integrations/supabase/client";
import { InventoryItem } from "@/types/inventory";
import { useToast } from "@/components/ui/use-toast";
import { InventoryProvider, useInventory } from "@/contexts/InventoryContext";
import { logInventoryDeletion } from "@/utils/deletionTracker";
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
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import {
  Download,
  Upload,
  Plus,
  Trash2,
} from "lucide-react";

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
    error,
    refreshInventory
  } = useInventory();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [stockFilter, setStockFilter] = useState("all");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<number | null>(null);
  const [filterType, setFilterType] = useState<string | null>(null);
  const [userPlan, setUserPlan] = useState<string>("Free Trial");
  const [inventoryLimit, setInventoryLimit] = useState<number>(501);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const tableRef = useRef<HTMLDivElement>(null);

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
      
      console.log("Attempting to delete item with ID:", itemToDelete);
      console.log("User ID for deletion:", user.id);
      
      // Get the item data before deletion for logging
      const itemToDeleteData = inventory.find(item => item.id === itemToDelete);
      
      // Delete the inventory item directly
      const { error: deleteError } = await supabase
        .from('inventory')
        .delete()
        .eq('id', itemToDelete)
        .eq('user_id', user.id);
      
      if (deleteError) {
        console.error("Delete error:", deleteError);
        toast({
          title: "Error",
          description: deleteError.message || "Failed to delete item",
          variant: "destructive"
        });
        return;
      }

      // Log the deletion for audit purposes
      if (itemToDeleteData) {
        await logInventoryDeletion(
          itemToDeleteData,
          "Manual deletion from inventory",
          `Deleted by user via inventory management`
        );
      }

      // Remove from selected items if present
      setSelectedItems(prev => prev.filter(id => id !== itemToDelete));
      
      // Refresh inventory after deletion
      await refreshInventory();
      
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

  const handleSelectItem = (id: number) => {
    setSelectedItems(prev => 
      prev.includes(id) 
        ? prev.filter(itemId => itemId !== id)
        : [...prev, id]
    );
  };

  const handleSelectAll = (selectAll: boolean) => {
    if (selectAll) {
      setSelectedItems(filteredInventory.map(item => item.id));
    } else {
      setSelectedItems([]);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedItems.length === 0) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Authentication Error",
          description: "You must be logged in to delete items",
          variant: "destructive",
        });
        return;
      }

      // Get the items data before deletion for logging
      const itemsToDelete = inventory.filter(item => selectedItems.includes(item.id));

      // Delete selected items
      const { error: deleteError } = await supabase
        .from('inventory')
        .delete()
        .in('id', selectedItems)
        .eq('user_id', user.id);

      if (deleteError) {
        toast({
          title: "Error",
          description: deleteError.message || "Failed to delete selected items",
          variant: "destructive"
        });
        return;
      }

      // Log each deletion for audit purposes
      for (const item of itemsToDelete) {
        await logInventoryDeletion(
          item,
          "Bulk deletion from inventory",
          `Bulk deleted by user via inventory management (${itemsToDelete.length} items)`
        );
      }

      // Clear selection
      setSelectedItems([]);
      
      // Refresh inventory
      await refreshInventory();
      
      toast({
        title: "Items deleted",
        description: `${selectedItems.length} items have been deleted successfully.`
      });
    } catch (error: any) {
      console.error("Error deleting items:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete items",
        variant: "destructive"
      });
    }
  };

  const handleEditItem = (item: InventoryItem) => {
    setEditingItem(item);
    setIsEditModalOpen(true);
  };

  // Apply filters and search
  const filteredInventory = inventory.filter((item) => {
    const query = searchQuery.toLowerCase();
    const matchesSearch = (
      item.name.toLowerCase().includes(query) ||
      (item.generic_name && item.generic_name.toLowerCase().includes(query)) ||
      (item.manufacturer && item.manufacturer.toLowerCase().includes(query))
    );

    const matchesStock = stockFilter === "all" || 
      (stockFilter === "in-stock" && item.quantity > (item.reorder_point || 10)) ||
      (stockFilter === "low-stock" && item.quantity <= (item.reorder_point || 10) && item.quantity > 0) ||
      (stockFilter === "out-of-stock" && item.quantity === 0);

    return matchesSearch && matchesStock;
  });

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

  console.log("Rendering inventory page with", inventory.length, "items");
  console.log("Filtered items:", filteredInventory.length);

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Show inventory limit alert based on plan */}
      <PlanLimitAlert 
        currentValue={inventory.length} 
        maxValue={inventoryLimit}
        resourceName="inventory items"
        variant={inventory.length > inventoryLimit * 0.9 ? "warning" : "info"}
      />

      <div className="p-6 space-y-6">
        {/* Header Section with proper semantic HTML */}
        <header className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Inventory Management</h1>
            <p className="text-sm text-gray-600 mt-1">
              Manage your pharmacy stock efficiently
            </p>
          </div>
          
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={() => setIsExportModalOpen(true)}
              variant="outline"
              size="sm"
              className="whitespace-nowrap"
              aria-label="Export inventory data"
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button
              onClick={() => setIsBulkModalOpen(true)}
              variant="outline"
              size="sm"
              className="whitespace-nowrap"
              aria-label="Import inventory in bulk"
            >
              <Upload className="h-4 w-4 mr-2" />
              Bulk Import
            </Button>
            <Button
              onClick={() => setIsAddModalOpen(true)}
              size="sm"
              className="whitespace-nowrap"
              aria-label="Add new inventory item"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Item
            </Button>
          </div>
        </header>

        {/* Search and Filters Section */}
        <section className="bg-white rounded-lg border p-4 space-y-4" aria-label="Search and filter controls">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search Input */}
            <div className="flex-1">
              <Label htmlFor="search-inventory" className="sr-only">
                Search inventory items
              </Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" aria-hidden="true" />
                <Input
                  id="search-inventory"
                  placeholder="Search by name, generic name, or manufacturer..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                  aria-describedby="search-help"
                />
              </div>
              <div id="search-help" className="sr-only">
                Search through inventory items by name, generic name, or manufacturer
              </div>
            </div>

            {/* Stock Filter */}
            <div className="sm:w-48">
              <Label htmlFor="stock-filter" className="sr-only">
                Filter by stock level
              </Label>
              <Select value={stockFilter} onValueChange={setStockFilter}>
                <SelectTrigger id="stock-filter" aria-label="Filter by stock level">
                  <SelectValue placeholder="All Stock Levels" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Stock Levels</SelectItem>
                  <SelectItem value="in-stock">In Stock</SelectItem>
                  <SelectItem value="low-stock">Low Stock</SelectItem>
                  <SelectItem value="out-of-stock">Out of Stock</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Bulk Actions */}
          {selectedItems.length > 0 && (
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
              <span className="text-sm font-medium text-blue-900">
                {selectedItems.length} item{selectedItems.length === 1 ? '' : 's'} selected
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleBulkDelete}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  aria-label={`Delete ${selectedItems.length} selected items`}
                >
                  <Trash2 className="h-4 w-4 mr-1" aria-hidden="true" />
                  Delete Selected
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedItems([])}
                  aria-label="Clear selection"
                >
                  Clear Selection
                </Button>
              </div>
            </div>
          )}
        </section>

        {/* Inventory Table */}
        <section aria-label="Inventory items table">
          <InventoryTable
            items={filteredInventory}
            selectedItems={selectedItems}
            onToggleItem={handleSelectItem}
            onEditItem={handleEditItem}
            onDeleteItem={handleDeleteItem}
            isLoading={isLoading}
            error={error}
          />
        </section>
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
        onSuccessfulSave={refreshInventory}
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
