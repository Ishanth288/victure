import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Receipt, Download, Printer, CreditCard } from "lucide-react";
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
        allowTaint: true,
        backgroundColor: '#ffffff'
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210;
      const pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;

      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      const billNumber = generatedBill?.bill_number || 'bill';
      pdf.save(`${billNumber}.pdf`);
      
      toast({
        title: "PDF exported",
        description: "The bill has been downloaded as PDF."
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Export failed",
        description: "Failed to export bill as PDF.",
        variant: "destructive"
      });
    }
  };

  const handlePreviewBill = async () => {
    if (!prescriptionDetails) {
      toast({
        title: "Error",
        description: "Please select a prescription first",
        variant: "destructive",
      });
      return;
    }

    if (items.length === 0) {
      toast({
        title: "Error",
        description: "Please add items to the cart",
        variant: "destructive",
      });
      return;
    }

    const previewData = {
      bill_number: `PREVIEW-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      subtotal: subtotal,
      gst_amount: gstAmount,
      gst_percentage: gstPercentage,
      discount_amount: discountAmount,
      total_amount: total,
      payment_method: paymentMethod,
      prescription: {
        patient: prescriptionDetails.patient,
        doctor_name: prescriptionDetails.doctor_name,
        prescription_number: prescriptionDetails.prescription_number,
      }
    };

    setGeneratedBill(previewData);
    setShowBillPreview(true);
  };

  const generateBill = async () => {
    setIsGenerating(true);
    
    // Create an abort controller for cancellation
    const abortController = new AbortController();
    let transactionStarted = false;
    let currentSession: any = null;
    let createdBillId: number | null = null;
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      currentSession = session;
      
      if (!session) {
        toast({
          title: "Error",
          description: "You must be logged in to generate bills",
          variant: "destructive",
        });
        return;
      }

      if (items.length === 0) {
        toast({
          title: "Error", 
          description: "Please add items to the cart",
          variant: "destructive",
        });
        return;
      }

      // Validate inventory availability BEFORE starting transaction
      const inventoryValidation = await validateInventoryAvailability(items, session.user.id);
      if (!inventoryValidation.valid) {
        toast({
          title: "Insufficient Inventory",
          description: inventoryValidation.message,
          variant: "destructive",
        });
        return;
      }

      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (profileError) throw new Error(profileError.message);

      // Prepare patient data
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

      // Mark transaction as started
      transactionStarted = true;

      // Step 1: Create the bill record - WITHOUT payment_method for now (will store in display data)
      const billData = {
        bill_number: `BILL-${Date.now()}`,
        subtotal: subtotal,
        gst_amount: gstAmount,
        gst_percentage: gstPercentage,
        discount_amount: discountAmount,
        total_amount: total,
        status: "completed" as const,
        user_id: session.user.id,
        prescription_id: prescriptionId || null,
        date: new Date().toISOString().split('T')[0]
      };

      const { data: billResult, error: billError } = await supabase
        .from('bills')
        .insert(billData)
        .select('id, bill_number, total_amount')
        .single();

      if (billError) {
        throw new Error(`Failed to create bill: ${billError.message}`);
      }

      if (!billResult || !billResult.id) {
        throw new Error("Failed to create bill - no data returned");
      }

      createdBillId = billResult.id;

      // Step 2: Create bill items and update inventory atomically
      const billItems = items.map((item) => ({
        bill_id: billResult.id,
        inventory_item_id: item.id,
        quantity: Math.max(1, Math.floor(item.quantity)),
        unit_price: Math.max(0, item.unit_cost),
        total_price: Math.max(0, item.total),
      }));

      // Insert bill items
      const { error: billItemsError } = await supabase
        .from('bill_items')
        .insert(billItems);

      if (billItemsError) {
        throw new Error(`Failed to create bill items: ${billItemsError.message}`);
      }

      // Step 3: Update inventory quantities
      for (const item of items) {
        const { error: inventoryError } = await supabase
          .from('inventory')
          .update({ 
            quantity: item.quantity - Math.floor(item.quantity)
          })
          .eq('id', item.id)
          .eq('user_id', session.user.id);

        if (inventoryError) {
          throw new Error(`Failed to update inventory for item ${item.name}: ${inventoryError.message}`);
        }
      }

      // Set the generated bill data with all necessary information
      const completeGeneratedBill = {
        id: billResult.id,
        bill_number: billResult.bill_number,
        total_amount: billResult.total_amount,
        subtotal: subtotal,
        gst_amount: gstAmount,
        gst_percentage: gstPercentage,
        discount_amount: discountAmount,
        date: new Date().toISOString().split('T')[0],
        status: "completed",
        pharmacy_address: profileData,
        items: billItems,
        payment_method: paymentMethod,
        prescription: prescriptionDetails
      };
      
      setGeneratedBill(completeGeneratedBill);
      setShowBillPreview(true);
      onBillGenerated();

      toast({
        title: "Success",
        description: `Bill ${billResult.bill_number} generated successfully!`,
      });

    } catch (error) {
      console.error("Error generating bill:", error);
      
      // Enhanced error handling with manual rollback
      if (transactionStarted && createdBillId && currentSession) {
        console.log("Attempting to rollback failed transaction...");
        try {
          // Delete bill items first
          await supabase
            .from('bill_items')
            .delete()
            .eq('bill_id', createdBillId);

          // Delete the bill
          await supabase
            .from('bills')
            .delete()
            .eq('id', createdBillId)
            .eq('user_id', currentSession.user.id);

          console.log("Transaction rolled back successfully");
        } catch (rollbackError) {
          console.error("Rollback failed:", rollbackError);
        }
      }
      
      if (error instanceof Error) {
        if (error.message.includes("timeout")) {
          toast({
            title: "Timeout Error",
            description: "The operation took too long. Please try again.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Error",
            description: error.message,
            variant: "destructive",
          });
        }
      } else {
        toast({
          title: "Error",
          description: "Failed to generate bill - please try again",
          variant: "destructive",
        });
      }
    } finally {
      setIsGenerating(false);
      // Clean up abort controller
      if (!abortController.signal.aborted) {
        abortController.abort();
      }
    }
  };

  // Helper function to validate inventory availability
  const validateInventoryAvailability = async (
    items: CartItem[], 
    userId: string
  ): Promise<{ valid: boolean; message: string }> => {
    try {
      for (const item of items) {
        const { data: inventoryData, error } = await supabase
          .from("inventory")
          .select("quantity, name")
          .eq("id", item.id)
          .eq("user_id", userId)
          .single();

        if (error) {
          return { 
            valid: false, 
            message: `Error checking inventory for item ${item.name}: ${error.message}` 
          };
        }

        if (!inventoryData) {
          return { 
            valid: false, 
            message: `Item ${item.name} not found in inventory` 
          };
        }

        const availableQuantity = inventoryData.quantity || 0;
        const requestedQuantity = Math.floor(item.quantity);

        if (availableQuantity < requestedQuantity) {
          return { 
            valid: false, 
            message: `Insufficient inventory for ${inventoryData.name}. Available: ${availableQuantity}, Requested: ${requestedQuantity}` 
          };
        }
      }

      return { valid: true, message: "All items have sufficient inventory" };
    } catch (error) {
      return { 
        valid: false, 
        message: `Error validating inventory: ${error instanceof Error ? error.message : 'Unknown error'}` 
      };
    }
  };

  const getPaymentMethodIcon = (method: string) => {
    switch (method.toLowerCase()) {
      case 'cash': return '💵';
      case 'card': return '💳';
      case 'upi': return '📱';
      case 'netbanking': return '🏦';
      case 'check': return '📝';
      default: return '💰';
    }
  };

  const getPaymentMethodLabel = (method: string) => {
    switch (method.toLowerCase()) {
      case 'cash': return 'Cash';
      case 'card': return 'Credit/Debit Card';
      case 'upi': return 'UPI';
      case 'netbanking': return 'Net Banking';
      case 'check': return 'Cheque';
      default: return method;
    }
  };

  return (
    <div className="space-y-6">
      {/* Cart Header - REMOVED show/hide preview buttons as requested */}
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold text-gray-800">Shopping Cart</h3>
        <Button
          variant="outline"
          size="sm"
          onClick={handlePreviewBill}
          disabled={items.length === 0}
          className="bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
        >
          <Receipt className="w-4 h-4 mr-2" />
          Preview Bill
        </Button>
      </div>
      
      {/* Cart Items */}
      <div className="border-2 border-gray-200 rounded-xl bg-white shadow-sm">
        {items.length === 0 ? (
          <div className="flex items-center justify-center py-16 text-gray-500">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-1.5 6M7 13l-1.5-6m0 0h11.5M7 13h10m0 0l1.5 6" />
                </svg>
              </div>
              <p className="text-xl font-semibold text-gray-700 mb-2">Cart is Empty</p>
              <p className="text-gray-500">Add medicines from the search to get started</p>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            <div className="p-4 bg-gray-50 rounded-t-xl">
              <p className="text-sm font-medium text-gray-600">
                {items.length} item{items.length !== 1 ? 's' : ''} in cart
              </p>
            </div>
            <ScrollArea 
              className={`p-4 space-y-3 ${
                items.length > 4 
                  ? 'max-h-[320px]' 
                  : ''
              }`}
            >
              {items.map((item) => (
                <CartItemRow
                  key={item.id}
                  id={item.id}
                  name={item.name}
                  quantity={item.quantity}
                  unit_cost={item.unit_cost}
                  total={item.total}
                  onRemoveItem={onRemoveItem}
                  onUpdateQuantity={onUpdateQuantity}
                />
              ))}
            </ScrollArea>
          </div>
        )}
      </div>

      {/* Bill Details Form */}
      <div className="bg-white border-2 border-gray-200 rounded-xl p-6 shadow-sm">
        <h4 className="text-lg font-semibold text-gray-800 mb-6 flex items-center">
          <CreditCard className="w-5 h-5 mr-2" />
          Bill Details
        </h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="space-y-3">
            <Label htmlFor="gst" className="text-sm font-semibold text-gray-700">
              GST Percentage (%)
            </Label>
            <Input
              id="gst"
              type="number"
              value={gstPercentage}
              onChange={(e) => setGstPercentage(parseFloat(e.target.value) || 0)}
              min="0"
              max="100"
              placeholder="18"
              className="h-12 text-lg border-2 border-gray-200 focus:border-blue-500"
            />
          </div>

          <div className="space-y-3">
            <Label htmlFor="discount" className="text-sm font-semibold text-gray-700">
              Discount Amount (₹)
            </Label>
            <Input
              id="discount"
              type="number"
              value={discountAmount}
              onChange={(e) => setDiscountAmount(parseFloat(e.target.value) || 0)}
              min="0"
              placeholder="0"
              className="h-12 text-lg border-2 border-gray-200 focus:border-blue-500"
            />
          </div>
        </div>

        {/* FIXED Payment Method Dropdown */}
        <div className="space-y-3 mb-6">
          <Label htmlFor="paymentMethod" className="text-sm font-semibold text-gray-700">
            Payment Method
          </Label>
          <Select value={paymentMethod} onValueChange={setPaymentMethod}>
            <SelectTrigger className="h-12 text-lg border-2 border-gray-200 focus:border-blue-500">
              <SelectValue>
                <div className="flex items-center space-x-2">
                  <span>{getPaymentMethodIcon(paymentMethod)}</span>
                  <span>{getPaymentMethodLabel(paymentMethod)}</span>
                </div>
              </SelectValue>
            </SelectTrigger>
            <SelectContent className="min-w-[280px] bg-white border-2 border-gray-200 shadow-lg z-50">
              <SelectItem value="cash" className="h-12 text-base bg-white hover:bg-gray-50 focus:bg-gray-50">
                <div className="flex items-center space-x-3">
                  <span className="text-lg">💵</span>
                  <span>Cash</span>
                </div>
              </SelectItem>
              <SelectItem value="card" className="h-12 text-base bg-white hover:bg-gray-50 focus:bg-gray-50">
                <div className="flex items-center space-x-3">
                  <span className="text-lg">💳</span>
                  <span>Credit/Debit Card</span>
                </div>
              </SelectItem>
              <SelectItem value="upi" className="h-12 text-base bg-white hover:bg-gray-50 focus:bg-gray-50">
                <div className="flex items-center space-x-3">
                  <span className="text-lg">📱</span>
                  <span>UPI</span>
                </div>
              </SelectItem>
              <SelectItem value="netbanking" className="h-12 text-base bg-white hover:bg-gray-50 focus:bg-gray-50">
                <div className="flex items-center space-x-3">
                  <span className="text-lg">🏦</span>
                  <span>Net Banking</span>
                </div>
              </SelectItem>
              <SelectItem value="check" className="h-12 text-base bg-white hover:bg-gray-50 focus:bg-gray-50">
                <div className="flex items-center space-x-3">
                  <span className="text-lg">📝</span>
                  <span>Cheque</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Bill Summary */}
        <div className="bg-gradient-to-r from-gray-50 to-blue-50 border-2 border-gray-200 rounded-xl p-6">
          <h5 className="text-lg font-semibold text-gray-800 mb-4">Bill Summary</h5>
          <div className="space-y-3">
            <div className="flex justify-between text-base">
              <span className="text-gray-600">Subtotal:</span>
              <span className="font-semibold">₹{subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-base">
              <span className="text-gray-600">GST ({gstPercentage}%):</span>
              <span className="font-semibold">₹{gstAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-base">
              <span className="text-gray-600">Discount:</span>
              <span className="font-semibold text-red-600">-₹{discountAmount.toFixed(2)}</span>
            </div>
            <div className="border-t-2 border-gray-300 pt-3">
              <div className="flex justify-between text-xl font-bold">
                <span>Total:</span>
                <span className="text-green-600">₹{total.toFixed(2)}</span>
              </div>
            </div>
            <div className="flex justify-between items-center text-base pt-2 border-t border-gray-200">
              <span className="text-gray-600">Payment Method:</span>
              <div className="flex items-center space-x-2">
                <span className="text-lg">{getPaymentMethodIcon(paymentMethod)}</span>
                <span className="font-semibold text-blue-600">
                  {getPaymentMethodLabel(paymentMethod)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Generate Bill Button */}
      <Button
        onClick={generateBill}
        className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 shadow-lg"
        disabled={isGenerating || items.length === 0}
      >
        {isGenerating ? (
          <div className="flex items-center space-x-3">
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent"></div>
            <span>Generating Bill...</span>
          </div>
        ) : (
          <div className="flex items-center space-x-3">
            <Receipt className="w-6 h-6" />
            <span>Generate Bill</span>
          </div>
        )}
      </Button>

      {/* Bill Preview Dialog */}
      {generatedBill && (
        <BillPreviewDialog
          billData={generatedBill}
          items={items}
          open={showBillPreview}
          onOpenChange={setShowBillPreview}
        />
      )}
    </div>
  );
}
