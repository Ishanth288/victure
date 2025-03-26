
import { useRef } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { useToast } from "@/hooks/use-toast";

export function useInventoryExport() {
  const { toast } = useToast();
  const tableRef = useRef<HTMLDivElement>(null);

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

  return { tableRef, handleExportInventory };
}
