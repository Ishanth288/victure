
import { Button } from "@/components/ui/button";
import { Printer, Download } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PrintableBill } from "./PrintableBill";
import { CartItem } from "@/types/billing";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { useRef } from "react";
import { toast } from "@/components/ui/use-toast";

interface BillPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  billData: any;
  items: CartItem[];
}

export function BillPreviewDialog({
  open,
  onOpenChange,
  billData,
  items,
}: BillPreviewDialogProps) {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    if (!printRef.current) return;
    
    const printContent = printRef.current;
    
    // Create a style element for print that only uses upper half of the page
    const style = document.createElement('style');
    style.innerHTML = `
      @media print {
        @page {
          size: A4;
          margin: 10mm;
        }
        
        body {
          margin: 0 !important;
          padding: 0 !important;
        }
        
        /* Hide all other elements */
        body > *:not(.print-container) {
          display: none !important;
        }
        
        /* Container for print content */
        .print-container {
          display: block !important;
          position: relative;
          width: 100%;
          height: 148mm !important; /* Upper half of A4 */
          overflow: hidden !important;
          page-break-after: avoid;
          page-break-inside: avoid;
        }
        
        /* Reset any previous print styling */
        .print-content {
          visibility: visible !important;
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          max-height: 148mm !important;
          overflow: hidden !important;
        }
        
        /* Prevent any additional pages */
        .avoid-page-break {
          page-break-inside: avoid;
          page-break-after: avoid;
        }
      }
    `;
    document.head.appendChild(style);
    
    // Create temporary container for printing
    const printContainer = document.createElement('div');
    printContainer.className = 'print-container';
    const printContentClone = printContent.cloneNode(true) as HTMLElement;
    printContentClone.className = 'print-content avoid-page-break';
    printContainer.appendChild(printContentClone);
    document.body.appendChild(printContainer);
    
    // Print
    window.print();
    
    // Cleanup
    document.body.removeChild(printContainer);
    document.head.removeChild(style);
    
    toast({
      title: "Print job sent",
      description: "The bill has been sent to your printer."
    });
  };

  const handleExport = async () => {
    if (!printRef.current) return;
    
    try {
      const printContent = printRef.current;
      
      // Create canvas from the content
      const canvas = await html2canvas(printContent, {
        scale: 2, // Higher scale for better quality
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff"
      });
      
      // Create PDF (A4 size)
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      // Calculate dimensions to fit content in upper half of the page
      const imgWidth = 210 - 20; // A4 width minus margins
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      const maxHeight = 148; // Upper half of A4 (297/2)
      
      // Scale down if needed to fit in upper half
      const finalImgHeight = Math.min(imgHeight, maxHeight);
      const scaleFactor = finalImgHeight / imgHeight;
      const finalImgWidth = imgWidth * scaleFactor;
      
      // Center the image horizontally
      const xPos = (210 - finalImgWidth) / 2;
      
      // Add image to PDF
      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', xPos, 10, finalImgWidth, finalImgHeight);
      
      // Add watermark
      pdf.setFontSize(12);
      pdf.setTextColor(180, 180, 180);
      pdf.text('Victure', 190, 10);
      
      // Save PDF
      pdf.save(`bill-${billData.bill_number || 'export'}.pdf`);
      
      toast({
        title: "Export successful",
        description: "Bill exported as PDF"
      });
    } catch (error) {
      console.error("Error exporting bill:", error);
      toast({
        title: "Export failed",
        description: "Failed to export bill",
        variant: "destructive"
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Bill Preview</span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleExport}>
                <Download className="w-4 h-4 mr-2" />
                Export PDF
              </Button>
              <Button variant="outline" size="sm" onClick={handlePrint}>
                <Printer className="w-4 h-4 mr-2" />
                Print Bill
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>
        <ScrollArea className="flex-1 overflow-auto">
          <div ref={printRef} className="print-content p-4">
            {billData && <PrintableBill billData={billData} items={items} />}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
