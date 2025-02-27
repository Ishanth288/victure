
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
import { toast } from "sonner";

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
    const originalDisplay = document.body.style.display;
    const originalOverflow = document.body.style.overflow;
    
    // Create a style element for print that only uses upper half of the page
    const style = document.createElement('style');
    style.innerHTML = `
      @media print {
        @page {
          size: A4;
          margin: 10mm;
          scale: 1;
        }
        
        body * {
          visibility: hidden;
          overflow: visible !important;
        }
        
        #print-content, #print-content * {
          visibility: visible;
        }
        
        #print-content {
          position: absolute;
          left: 0;
          top: 0;
          width: 100%;
          transform: scale(0.98);
          transform-origin: top left;
        }
        
        /* Additional rules to prevent blank pages */
        html, body {
          height: auto !important;
          overflow: visible !important;
        }
        
        .page-break {
          display: none;
        }
      }
    `;
    document.head.appendChild(style);
    
    // Add ID to print content
    printContent.setAttribute('id', 'print-content');
    
    // Prepare for printing
    document.body.style.overflow = 'visible';
    
    // Print
    window.print();
    
    // Cleanup
    printContent.removeAttribute('id');
    document.body.style.display = originalDisplay;
    document.body.style.overflow = originalOverflow;
    document.head.removeChild(style);
    
    toast.success("Print job sent to printer");
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
      
      // Create PDF
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgData = canvas.toDataURL('image/png');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      // Add image to PDF
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      
      // Add watermark
      pdf.setFontSize(12);
      pdf.setTextColor(180, 180, 180);
      pdf.text('Victure', pdf.internal.pageSize.getWidth() - 20, 10);
      
      // Save PDF
      pdf.save(`bill-${billData.bill_number || 'export'}.pdf`);
      
      toast.success("Bill exported as PDF");
    } catch (error) {
      console.error("Error exporting bill:", error);
      toast.error("Failed to export bill");
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
