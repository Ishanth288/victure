
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import InventoryHeader from "@/components/inventory/InventoryHeader";
import InventorySearch from "@/components/inventory/InventorySearch";
import InventoryTable from "@/components/inventory/InventoryTable";
import InventoryPagination from "@/components/inventory/InventoryPagination";
import { InventoryModals } from "@/components/inventory/InventoryModals";
import { supabase } from "@/integrations/supabase/client";
import { InventoryItem } from "@/types/inventory";
import { useToast } from "@/components/ui/use-toast";
import { useInventoryContext } from "@/contexts/InventoryContext";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

export default function Inventory() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const { inventory, fetchInventory } = useInventoryContext();
  const [selectedItems, setSelectedItems] = useState<number[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentEditItem, setCurrentEditItem] = useState<InventoryItem | null>(null);
  const tableRef = useRef<HTMLDivElement>(null);

  const itemsPerPage = 10;

  useEffect(() => {
    checkAuth();
    fetchInventoryData();
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

  const fetchInventoryData = async () => {
    try {
      await fetchInventory();
      setLoading(false);
    } catch (error) {
      console.error("Error fetching inventory:", error);
      setLoading(false);
    }
  };

  const filteredItems = inventory.filter((item) =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (item.generic_name && item.generic_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (item.manufacturer && item.manufacturer.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  useEffect(() => {
    setTotalPages(Math.ceil(filteredItems.length / itemsPerPage));
    setCurrentPage(1);
  }, [filteredItems]);

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
    setCurrentEditItem(item);
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
        <InventoryHeader 
          onAddClick={() => setIsAddModalOpen(true)} 
          onExportClick={handleExportInventory} 
        />

        <div className="mt-8">
          <InventorySearch
            value={searchQuery}
            onChange={setSearchQuery}
            totalItems={filteredItems.length}
          />

          <div className="mt-6" ref={tableRef}>
            <InventoryTable
              items={paginatedItems}
              selectedItems={selectedItems}
              onToggleItem={handleToggleSelectItem}
              onEditItem={handleEditItem}
            />
          </div>

          <div className="mt-4">
            <InventoryPagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
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
            setCurrentEditItem(null);
          }}
          onSuccessfulSave={fetchInventoryData}
        />
      </div>
    </DashboardLayout>
  );
}
