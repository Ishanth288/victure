import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Receipt, Info, Download, Printer } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { CartItem } from "@/types/billing";
import { CartItemRow } from "./CartItemRow";
import { BillPreviewDialog } from "./BillPreviewDialog";
import { PrintableBill } from "./PrintableBill";
import { ScrollArea } from "@/components/ui/scroll-area";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

interface CartSummaryProps {
  items: CartItem[];
  prescriptionId: number;
  onRemoveItem: (id: number) => void;
  onUpdateQuantity: (id: number, quantity: number) => void;
  onBillGenerated: () => void;
}

export function CartSummary({
  items,
  prescriptionId,
  onRemoveItem,
  onUpdateQuantity,
  onBillGenerated,
}: CartSummaryProps) {
  const { toast } = useToast();
  const [gstPercentage, setGstPercentage] = useState(18);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [showBillPreview, setShowBillPreview] = useState(false);
  const [generatedBill, setGeneratedBill] = useState<any>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showEmbeddedPreview, setShowEmbeddedPreview] = useState(false);
  const [prescriptionDetails, setPrescriptionDetails] = useState<any>(null);
  const billPreviewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    checkAuth();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session);
      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (prescriptionId) {
      fetchPrescriptionDetails();
    }
  }, [prescriptionId]);

  const fetchPrescriptionDetails = async () => {
    try {
      const { data, error } = await supabase
        .from("prescriptions")
        .select(`
          *,
          patient:patients (
            name,
            phone_number
          )
        `)
        .eq("id", prescriptionId)
        .single();

      if (error) throw error;
      setPrescriptionDetails(data);
    } catch (error) {
      console.error("Error fetching prescription details:", error);
    }
  };

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setIsAuthenticated(!!session);
    setIsLoading(false);
  };

  const subtotal = Math.round(items.reduce((sum, item) => sum + item.total, 0));
  const gstAmount = Math.round((subtotal * gstPercentage) / 100);
  const total = Math.round(subtotal + gstAmount - discountAmount);

  const handlePrint = () => {
    if (!billPreviewRef.current) return;
    
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
    const printContentClone = billPreviewRef.current.cloneNode(true) as HTMLElement;
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
    if (!billPreviewRef.current) return;
    
    try {
      const printContent = billPreviewRef.current;
      
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
      pdf.save(`bill-${generatedBill?.bill_number || 'export'}.pdf`);
      
      toast({
        title: "Export successful",
        description: "The bill has been exported as a PDF."
      });
    } catch (error) {
      console.error("Error exporting bill:", error);
      toast({
        title: "Export failed",
        description: "Failed to export the bill as PDF.",
        variant: "destructive"
      });
    }
  };

  const handlePreviewBill = async () => {
    if (items.length === 0) {
      toast({
        title: "Error",
        description: "Please add items to the cart",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({
          title: "Error",
          description: "You must be logged in to preview bills",
          variant: "destructive"
        });
        return;
      }

      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      const billData = {
        bill_number: `BILL-${Date.now()}`,
        date: new Date().toISOString(),
        subtotal: subtotal,
        gst_amount: gstAmount,
        gst_percentage: gstPercentage,
        discount_amount: discountAmount,
        total_amount: total,
        status: "draft",
        prescription: {
          patient: prescriptionDetails?.patient,
          doctor_name: prescriptionDetails?.doctor_name,
          prescription_number: prescriptionDetails?.prescription_number,
        },
      };

      setGeneratedBill({ ...billData, pharmacy_address: profileData });
      setShowEmbeddedPreview(true);
    } catch (error) {
      console.error("Error generating bill preview:", error);
      toast({
        title: "Error",
        description: "Failed to generate bill preview",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateBill = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      toast({
        title: "Error",
        description: "You must be logged in to generate bills",
        variant: "destructive"
      });
      return;
    }

    if (items.length === 0) {
      toast({
        title: "Error",
        description: "Please add items to the cart",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    try {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      const { data: billData, error: billError } = await supabase
        .from("bills")
        .insert([
          {
            prescription_id: prescriptionId,
            bill_number: `BILL-${Date.now()}`,
            subtotal: Math.round(subtotal),
            gst_amount: Math.round(gstAmount),
            gst_percentage: gstPercentage,
            discount_amount: Math.round(discountAmount),
            total_amount: Math.round(total),
            status: "completed",
            user_id: session.user.id
          },
        ])
        .select(`
          *,
          prescription:prescriptions (
            *,
            patient:patients (
              name,
              phone_number
            )
          )
        `)
        .single();

      if (billError) throw new Error(billError.message);

      const billItems = items.map((item) => ({
        bill_id: billData.id,
        inventory_item_id: item.id,
        quantity: item.quantity,
        unit_price: item.unit_cost,
        total_price: item.total,
      }));

      const { error: billItemsError } = await supabase
        .from("bill_items")
        .insert(billItems);

      if (billItemsError) throw new Error(billItemsError.message);

      for (const item of items) {
        const { data: inventoryData, error: fetchError } = await supabase
          .from("inventory")
          .select("quantity")
          .eq("id", item.id)
          .single();

        if (fetchError) throw new Error(fetchError.message);

        const newQuantity = (inventoryData?.quantity || 0) - item.quantity;
        const { error: inventoryError } = await supabase
          .from("inventory")
          .update({ quantity: newQuantity })
          .eq("id", item.id);

        if (inventoryError) throw new Error(inventoryError.message);
      }

      setGeneratedBill({ ...billData, pharmacy_address: profileData });
      setShowBillPreview(true);
      onBillGenerated();

      toast({
        title: "Success",
        description: "Bill generated successfully"
      });
    } catch (error) {
      console.error("Error generating bill:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate bill",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-4">
        {items.map((item) => (
          <CartItemRow
            key={item.id}
            {...item}
            onRemoveItem={onRemoveItem}
            onUpdateQuantity={onUpdateQuantity}
          />
        ))}
      </div>

      <div className="space-y-3 pt-4">
        <div className="rounded-lg border p-4">
          <div className="space-y-3">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span className="font-medium truncate">₹{subtotal.toFixed(2)}</span>
            </div>

            <div className="space-y-2">
              <Label>GST (%)</Label>
              <Input
                type="number"
                value={gstPercentage}
                onChange={(e) => setGstPercentage(Number(e.target.value))}
                min="0"
                max="100"
              />
              <div className="flex justify-between text-sm">
                <span>GST Amount</span>
                <span className="truncate">₹{gstAmount.toFixed(2)}</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Discount (₹)</Label>
              <Input
                type="number"
                value={discountAmount}
                onChange={(e) => setDiscountAmount(Number(e.target.value))}
                min="0"
              />
            </div>

            <div className="space-y-2">
              <Label>Payment Method</Label>
              <select
                className="w-full rounded-md border border-input bg-background px-3 py-2"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
              >
                <option value="cash">Cash</option>
                <option value="card">Credit Card</option>
                <option value="upi">UPI</option>
              </select>
            </div>

            <div className="flex justify-between font-bold text-lg pt-2 border-t">
              <span>Total</span>
              <span className="truncate">₹{total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {!isLoading && !isAuthenticated && (
          <div className="flex items-center gap-2 text-sm text-yellow-600 bg-yellow-50 p-2 rounded-md">
            <Info className="h-4 w-4" />
            <span>Please log in to generate bills</span>
          </div>
        )}

        <div className="flex flex-col gap-2">
          <Button
            className="w-full"
            variant="outline"
            onClick={handlePreviewBill}
            disabled={items.length === 0 || !isAuthenticated || isLoading || isGenerating}
          >
            <Receipt className="w-4 h-4 mr-2" />
            Preview Bill
          </Button>

          <Button
            className="w-full"
            onClick={handleGenerateBill}
            disabled={items.length === 0 || !isAuthenticated || isLoading || isGenerating}
          >
            <Receipt className="w-4 h-4 mr-2" />
            Generate Bill
          </Button>
        </div>
      </div>

      {showEmbeddedPreview && generatedBill && (
        <div className="mt-6 border rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-lg">Bill Preview</h3>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleExport}>
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
              <Button variant="outline" size="sm" onClick={handlePrint}>
                <Printer className="w-4 h-4 mr-2" />
                Print
              </Button>
            </div>
          </div>
          <ScrollArea className="h-[500px] w-full rounded-md border" scrollHideDelay={150}>
            <div ref={billPreviewRef} className="p-4 print-content">
              <PrintableBill billData={generatedBill} items={items} />
            </div>
          </ScrollArea>
        </div>
      )}

      <BillPreviewDialog
        open={showBillPreview}
        onOpenChange={setShowBillPreview}
        billData={generatedBill}
        items={items}
      />
    </div>
  );
}
