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
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showEmbeddedPreview, setShowEmbeddedPreview] = useState(false);
  const [prescriptionDetails, setPrescriptionDetails] = useState<any>(null);
  const billPreviewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleAuthStateChange = (_event: any, session: any) => {
      setIsAuthenticated(!!session);
      if (isLoading) {
        setIsLoading(false);
      }
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(handleAuthStateChange);

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
    if (!prescriptionId) {
      console.warn("fetchPrescriptionDetails: No prescriptionId provided.");
      setPrescriptionDetails(null);
      return;
    }

    console.log(`fetchPrescriptionDetails: Fetching details for prescription ID: ${prescriptionId}`);
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

      if (error) {
        console.error(`fetchPrescriptionDetails: Error fetching prescription details for ID ${prescriptionId}:`, error);
        toast({
          title: "Error",
          description: `Failed to load prescription details: ${error.message}`,
          variant: "destructive",
        });
        setPrescriptionDetails(null);
        return;
      }
      
      if (!data) {
        console.warn(`fetchPrescriptionDetails: No data found for prescription ID: ${prescriptionId}`);
        setPrescriptionDetails(null);
        return;
      }

      setPrescriptionDetails(data);
      console.log(`fetchPrescriptionDetails: Successfully fetched details for prescription ID: ${prescriptionId}`);
    } catch (error: any) {
      console.error("fetchPrescriptionDetails: Unexpected error:", error);
      toast({
        title: "Error",
        description: `An unexpected error occurred: ${error.message}`,
        variant: "destructive",
      });
      setPrescriptionDetails(null);
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
        
        body > *:not(.print-container) {
          display: none !important;
        }
        
        .print-container {
          display: block !important;
          position: relative;
          width: 100%;
          height: 148mm !important;
          overflow: hidden !important;
          page-break-after: avoid;
          page-break-inside: avoid;
        }
        
        .print-content {
          visibility: visible !important;
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          max-height: 148mm !important;
          overflow: hidden !important;
        }
        
        .avoid-page-break {
          page-break-inside: avoid;
          page-break-after: avoid;
        }
      }
    `;
    document.head.appendChild(style);
    
    const printContainer = document.createElement('div');
    printContainer.className = 'print-container';
    const printContentClone = billPreviewRef.current.cloneNode(true) as HTMLElement;
    printContentClone.className = 'print-content avoid-page-break';
    printContainer.appendChild(printContentClone);
    document.body.appendChild(printContainer);
    
    window.print();
    
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
      
      const canvas = await html2canvas(printContent, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff"
      });
      
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      const imgWidth = 210 - 20;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      const maxHeight = 148;
      
      const finalImgHeight = Math.min(imgHeight, maxHeight);
      const scaleFactor = finalImgHeight / imgHeight;
      const finalImgWidth = imgWidth * scaleFactor;
      
      const xPos = (210 - finalImgWidth) / 2;
      
      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', xPos, 10, finalImgWidth, finalImgHeight);
      
      pdf.setFontSize(12);
      pdf.setTextColor(180, 180, 180);
      pdf.text('Victure', 190, 10);
      
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

  const generateBill = async () => {
    setIsGenerating(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({
          title: "Error",
          description: "You must be logged in to generate bills",
          variant: "destructive",
        });
        setIsGenerating(false);
        return;
      }

      if (items.length === 0) {
        toast({
          title: "Error",
          description: "Please add items to the cart",
          variant: "destructive",
        });
        setIsGenerating(false);
        return;
      }

      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (profileError) throw new Error(profileError.message);

      let patientId = prescriptionDetails?.patient?.id;
      if (prescriptionDetails && prescriptionDetails.patient) {
        if (patientId && patientId > 0) {
          const { error: patientUpdateError } = await supabase
            .from('patients')
            .update({
              name: prescriptionDetails.patient.name.trim(),
              phone_number: prescriptionDetails.patient.phone_number?.trim() || null,
            })
            .eq('id', patientId);

          if (patientUpdateError) {
            throw new Error(`Patient update error: ${patientUpdateError.message}`);
          }
        } else {
          const { data: newPatientData, error: patientError } = await supabase
            .from("patients")
            .insert({
              name: prescriptionDetails.patient.name.trim(),
              phone_number: prescriptionDetails.patient.phone_number?.trim() || null,
              user_id: session.user.id,
            })
            .select("id")
            .single();

          if (patientError) {
            throw new Error(`Patient creation error: ${patientError.message}`);
          }
          
          if (!newPatientData?.id) {
            throw new Error("Failed to create patient - no ID returned");
          }
          
          patientId = newPatientData.id;
        }
      }

      const billInsertData = {
        prescription_id: prescriptionId,
        bill_number: `BILL-${Date.now()}`,
        subtotal: subtotal,
        gst_amount: gstAmount,
        gst_percentage: gstPercentage,
        discount_amount: discountAmount,
        total_amount: total,
        status: "completed",
        user_id: session.user.id,
      };

      if (billInsertData.total_amount <= 0) {
        throw new Error("Bill total must be greater than zero");
      }

      const { data: billData, error: billError } = await supabase
        .from("bills")
        .insert([billInsertData])
        .select(
          `
          *,
          prescription:prescriptions (
            *,
            patient:patients (
              id,
              name,
              phone_number
            )
          )
        `
        )
        .single();

      if (billError) {
        throw new Error(`Bill creation error: ${billError.message}`);
      }

      if (!billData?.id) {
        throw new Error("Failed to create bill - no ID returned");
      }

      const validBillItems = items
        .filter(item => item.id && item.quantity > 0 && item.unit_cost >= 0)
        .map((item) => ({
          bill_id: billData.id,
          inventory_item_id: item.id,
          quantity: Math.max(1, Math.floor(item.quantity)),
          unit_price: Math.max(0, item.unit_cost),
          total_price: Math.max(0, item.total),
        }));

      if (validBillItems.length === 0) {
        throw new Error("No valid items to add to bill");
      }

      const { error: billItemsError } = await supabase
        .from("bill_items")
        .insert(validBillItems);

      if (billItemsError) {
        throw new Error(`Bill items creation error: ${billItemsError.message}`);
      }

      const inventoryUpdates = [];
      for (const item of items) {
        if (!item.id || item.quantity <= 0) continue;

        const { data: inventoryData, error: fetchError } = await supabase
          .from("inventory")
          .select("quantity, id")
          .eq("id", item.id)
          .single();

        if (fetchError) {
          throw new Error(`Inventory fetch error for item ${item.id}: ${fetchError.message}`);
        }

        const currentQuantity = inventoryData?.quantity || 0;
        const requestedQuantity = Math.floor(item.quantity);
        
        if (currentQuantity < requestedQuantity) {
          throw new Error(`Insufficient inventory for item ${item.name || item.id}. Available: ${currentQuantity}, Requested: ${requestedQuantity}`);
        }

        const newQuantity = currentQuantity - requestedQuantity;
        inventoryUpdates.push({
          id: item.id,
          newQuantity: newQuantity,
          item: item
        });
      }

      for (const update of inventoryUpdates) {
        const { error: inventoryError } = await supabase
          .from("inventory")
          .update({ 
            quantity: update.newQuantity,
          })
          .eq("id", update.id);

        if (inventoryError) {
          throw new Error(`Inventory update error for item ${update.item.name || update.id}: ${inventoryError.message}`);
        }
      }

      setGeneratedBill({ ...billData, pharmacy_address: profileData });
      setShowBillPreview(true);
      onBillGenerated();

      toast({
        title: "Success",
        description: "Bill generated successfully",
      });
    } catch (error) {
      console.error("Error generating bill:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate bill",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Cart Items</h3>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowEmbeddedPreview(!showEmbeddedPreview)}
        >
          {showEmbeddedPreview ? "Hide Preview" : "Show Preview"}
        </Button>
      </div>
      <ScrollArea className="h-[250px] w-full rounded-md border p-4">
        {items.length === 0 ? (
          <p className="text-center text-gray-500">No items in cart</p>
        ) : (
          items.map((item) => (
            <CartItemRow
              key={item.id}
              id={item.id}
              name={item.name}
              ndc={item.ndc}
              quantity={item.quantity}
              unit_cost={item.unit_cost}
              total={item.total}
              available_quantity={item.available_quantity}
              onRemoveItem={onRemoveItem}
              onUpdateQuantity={onUpdateQuantity}
            />
          ))
        )}
      </ScrollArea>

      <div className="space-y-2">
        <Label htmlFor="gst">GST Percentage</Label>
        <Input
          id="gst"
          type="number"
          value={gstPercentage}
          onChange={(e) => setGstPercentage(parseFloat(e.target.value) || 0)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="discount">Discount Amount</Label>
        <Input
          id="discount"
          type="number"
          value={discountAmount}
          onChange={(e) => setDiscountAmount(parseFloat(e.target.value) || 0)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="paymentMethod">Payment Method</Label>
        <Input
          id="paymentMethod"
          type="text"
          value={paymentMethod}
          onChange={(e) => setPaymentMethod(e.target.value)}
        />
      </div>

      <div className="border-t pt-4 space-y-2">
        <div className="flex justify-between">
          <span>Subtotal:</span>
          <span>₹{subtotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span>GST ({gstPercentage}%):</span>
          <span>₹{gstAmount.toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span>Discount:</span>
          <span>-₹{discountAmount.toFixed(2)}</span>
        </div>
        <div className="flex justify-between font-bold text-lg">
          <span>Total:</span>
          <span>₹{total.toFixed(2)}</span>
        </div>
      </div>

      <Button
        onClick={generateBill}
        className="w-full"
        disabled={isGenerating || items.length === 0}
      >
        {isGenerating ? "Generating..." : "Generate Bill"}
      </Button>

      {generatedBill && (
        <BillPreviewDialog
          billData={generatedBill}
          items={items}
          open={showBillPreview}
          onOpenChange={setShowBillPreview}
        />
      )}

      {showEmbeddedPreview && generatedBill && (
        <div className="mt-4 p-4 border rounded-md bg-gray-50">
          <h4 className="text-md font-semibold mb-2">Bill Preview</h4>
          <div ref={billPreviewRef}>
            <PrintableBill billData={generatedBill} items={items} />
          </div>
        </div>
      )}
    </div>
  );
}
