import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Receipt, Download, Printer, CreditCard, User, Phone, FileText, Trash2, Banknote, Smartphone, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { CartItem } from "@/types/billing";
import { CartItemRow } from "./CartItemRow";
import { BillPreviewDialog } from "./BillPreviewDialog";
import { PrintableBill } from "./PrintableBill";
import { ScrollArea } from "@/components/ui/scroll-area";
import { logBillItemDeletion } from "@/utils/deletionTracker";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { useBilling } from "@/contexts/BillingContext";
import { billPropagation } from "@/utils/billPropagation";

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
  const { addBill } = useBilling();
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
    console.log("🔄 CartSummary: prescriptionId changed to:", prescriptionId);
    
    // 🧹 CRITICAL: Clear all cached data when prescription changes
    setPrescriptionDetails(null);
    setGeneratedBill(null);
    setShowBillPreview(false);
    
    // 🚨 FORCE IMMEDIATE FRESH FETCH: Clear React Query cache if it exists
    if (typeof window !== 'undefined') {
      // Clear any potential cached prescription data in localStorage
      localStorage.removeItem(`prescription_${prescriptionId}`);
      localStorage.removeItem('lastPrescriptionDetails');
      
      // 🚨 FORCE BROWSER CACHE CLEAR: Add timestamp to prevent any browser caching
      const timestamp = Date.now();
      console.log(`🚨 CACHE BUST: Forcing fresh data with timestamp: ${timestamp}`);
    }
    
    if (prescriptionId) {
      console.log(`🔄 Triggering fresh fetch for prescription ID: ${prescriptionId}`);
      // Add small delay to ensure state is fully cleared before fetching
      setTimeout(() => {
        fetchPrescriptionDetails();
      }, 100);
    } else {
      console.log("🧹 No prescriptionId provided - clearing prescription details");
      setPrescriptionDetails(null);
    }
  }, [prescriptionId]);

  const fetchPrescriptionDetails = async () => {
    if (!prescriptionId) {
      console.warn("fetchPrescriptionDetails: No prescriptionId provided.");
      setPrescriptionDetails(null);
      return;
    }

    console.log(`🔍 DEBUGGING: Fetching prescription details for ID: ${prescriptionId}`);
    try {
      // 🚨 FORCE FRESH DATA: Add cache busting and timestamp to prevent stale data
      const cacheKey = `${prescriptionId}_${Date.now()}`;
      console.log(`🔄 Cache-busting query for prescription ${prescriptionId} with key: ${cacheKey}`);
      
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
        console.error(`❌ ERROR fetching prescription ${prescriptionId}:`, error);
        toast({
          title: "Error",
          description: `Failed to load prescription details: ${error.message}`,
          variant: "destructive",
        });
        setPrescriptionDetails(null);
        return;
      }
      
      if (!data) {
        console.warn(`⚠️ NO DATA found for prescription ID: ${prescriptionId}`);
        setPrescriptionDetails(null);
        return;
      }

      // 🚨 DEBUG: Log the actual data being retrieved with detailed comparison
      console.log("📊 RETRIEVED PRESCRIPTION DATA:", {
        prescriptionId: data.id,
        prescriptionNumber: data.prescription_number,
        doctorName: data.doctor_name,
        patientName: data.patient?.name,
        patientPhone: data.patient?.phone_number,
        patientId: data.patient_id,
        timestamp: new Date().toISOString(),
        fullData: data
      });

      // 🚨 ADDITIONAL CHECK: Verify this is actually fresh data
      const previousPatientName = prescriptionDetails?.patient?.name;
      const newPatientName = data.patient?.name;
      
      if (previousPatientName && previousPatientName !== newPatientName) {
        console.log(`🔄 PATIENT DATA CHANGED: "${previousPatientName}" → "${newPatientName}"`);
      } else if (previousPatientName === newPatientName) {
        console.log(`⚠️ SAME PATIENT DATA: Still showing "${newPatientName}" - might be cached`);
      }

      setPrescriptionDetails(data);
      console.log(`✅ Successfully loaded prescription ID: ${prescriptionId}`);
    } catch (error: any) {
      console.error("💥 Unexpected error fetching prescription:", error);
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
      date: new Date().toISOString(),
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
    console.log("🚀 Starting bill generation...");

    const abortController = new AbortController();
    let createdBillId: number | null = null;

    try {
      await (async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          throw new Error("Authentication Error: You must be logged in.");
        }

        if (items.length === 0) {
          throw new Error("Empty Cart: Please add items to the cart.");
        }

        if (!prescriptionId) {
          throw new Error("Missing Prescription: No prescription selected.");
        }

        console.log(`🔍 Validating prescription ID: ${prescriptionId}`);
        const { data: prescriptionCheck, error: prescriptionError } = await supabase
          .from('prescriptions')
          .select('id, status, user_id')
          .eq('id', prescriptionId)
          .eq('user_id', session.user.id)
          .single();

        if (prescriptionError || !prescriptionCheck) {
          throw new Error("Invalid Prescription: The selected prescription is not valid or doesn't exist.");
        }

        console.log("📦 Validating inventory availability...");
        const inventoryValidation = await validateInventoryAvailability(items, session.user.id);
        if (!inventoryValidation.valid) {
          throw new Error(`Insufficient Inventory: ${inventoryValidation.message}`);
        }

        console.log("👤 Fetching pharmacy profile...");
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (profileError) {
          throw new Error(`Profile Error: Failed to load pharmacy profile. ${profileError.message}`);
        }

        let patientId = prescriptionDetails?.patient?.id;
        if (prescriptionDetails && prescriptionDetails.patient) {
            console.log("👤 Handling patient data...");
            if (patientId && patientId > 0) {
                const { error: patientUpdateError } = await supabase
                    .from('patients')
                    .update({ name: prescriptionDetails.patient.name.trim(), phone_number: prescriptionDetails.patient.phone_number?.trim() || null })
                    .eq('id', patientId);
                if (patientUpdateError) console.warn("Patient update failed, continuing with existing data:", patientUpdateError);
            } else {
                // First, try to find existing patient with same phone and user_id
                const phoneNumber = prescriptionDetails.patient.phone_number?.trim() || null;
                if (phoneNumber) {
                    const { data: existingPatient, error: findError } = await supabase
                        .from('patients')
                        .select('id')
                        .eq('phone_number', phoneNumber)
                        .eq('user_id', session.user.id)
                        .single();
                    
                    if (existingPatient?.id) {
                        console.log(`👤 Found existing patient with ID: ${existingPatient.id}`);
                        patientId = existingPatient.id;
                        // Update existing patient's name if needed
                        const { error: updateError } = await supabase
                            .from('patients')
                            .update({ name: prescriptionDetails.patient.name.trim() })
                            .eq('id', existingPatient.id);
                        if (updateError) console.warn("Patient name update failed:", updateError);
                    } else {
                        // Create new patient only if none exists
                        const { data: newPatientData, error: patientError } = await supabase
                            .from("patients")
                            .insert({ name: prescriptionDetails.patient.name.trim(), phone_number: phoneNumber, user_id: session.user.id, status: 'active' })
                            .select("id").single();
                        if (patientError) throw new Error(`Patient creation error: ${patientError.message}`);
                        if (!newPatientData?.id) throw new Error("Failed to create patient - no ID returned");
                        patientId = newPatientData.id;
                        console.log(`👤 Created new patient with ID: ${patientId}`);
                    }
                } else {
                    // No phone number provided, create patient without phone
                    const { data: newPatientData, error: patientError } = await supabase
                        .from("patients")
                        .insert({ name: prescriptionDetails.patient.name.trim(), phone_number: null, user_id: session.user.id, status: 'active' })
                        .select("id").single();
                    if (patientError) throw new Error(`Patient creation error: ${patientError.message}`);
                    if (!newPatientData?.id) throw new Error("Failed to create patient - no ID returned");
                    patientId = newPatientData.id;
                    console.log(`👤 Created new patient (no phone) with ID: ${patientId}`);
                }
            }
        }

        // Validate bill total amount
        if (total <= 0) {
          throw new Error("Invalid Bill Amount: Cannot create a bill with zero or negative total amount. Please add items with valid prices.");
        }

        console.log("📄 Creating bill record...");
        const billData = {
          bill_number: `BILL-${Date.now()}`,
          subtotal, gst_amount: gstAmount, gst_percentage: gstPercentage, discount_amount: discountAmount, total_amount: total,
          status: "active" as const, user_id: session.user.id, prescription_id: prescriptionId || null,
        };

        const { data: billResult, error: billError } = await supabase.from('bills').insert(billData).select('id, bill_number, total_amount').single();
        if (billError) throw new Error(`Failed to create bill: ${billError.message}`);
        if (!billResult?.id) throw new Error("Failed to create bill - no data returned");
        createdBillId = billResult.id;
        console.log(`✅ Bill created with ID: ${createdBillId}`);

        const billItems = items.map(item => ({ bill_id: billResult.id, inventory_item_id: item.id, quantity: Math.max(1, Math.floor(item.quantity)), unit_price: Math.max(0, item.unit_cost), total_price: Math.max(0, item.total) }));
        const { error: billItemsError } = await supabase.from('bill_items').insert(billItems);
        if (billItemsError) throw new Error(`Failed to create bill items: ${billItemsError.message}`);

        console.log("🔄 Updating inventory quantities...");
        for (const item of items) {
            const requestedQuantity = Math.floor(item.quantity);
            const { data: currentInventory, error: fetchError } = await supabase.from('inventory').select('quantity').eq('id', item.id).eq('user_id', session.user.id).single();
            if (fetchError) throw new Error(`Failed to fetch current inventory for ${item.name}: ${fetchError.message}`);
            
            const currentQuantity = currentInventory?.quantity || 0;
            const newQuantity = Math.max(0, currentQuantity - requestedQuantity);
            
            const { error: inventoryError } = await supabase.from('inventory').update({ quantity: newQuantity }).eq('id', item.id).eq('user_id', session.user.id);
            if (inventoryError) throw new Error(`Failed to update inventory for item ${item.name}: ${inventoryError.message}`);
            console.log(`   - ${item.name}: ${currentQuantity} -> ${newQuantity}`);
        }

        const completeGeneratedBill = {
            id: billResult.id, bill_number: billResult.bill_number, total_amount: billResult.total_amount, subtotal, gst_amount: gstAmount, gst_percentage: gstPercentage, discount_amount: discountAmount,
            date: new Date().toISOString(), status: "completed", pharmacy_address: profileData, items: billItems, payment_method: paymentMethod, prescription: prescriptionDetails,
        };
        setGeneratedBill(completeGeneratedBill);
        setShowBillPreview(true);

        const contextBill = {
            id: billResult.id, bill_number: billResult.bill_number, prescription_id: prescriptionId, subtotal, gst_amount: gstAmount, gst_percentage: gstPercentage, discount_amount: discountAmount, total_amount: billResult.total_amount,
            status: "completed", date: new Date().toISOString(), created_at: new Date().toISOString(), updated_at: new Date().toISOString(), user_id: session.user.id,
            prescription: prescriptionDetails ? { id: prescriptionDetails.id, prescription_number: prescriptionDetails.prescription_number, doctor_name: prescriptionDetails.doctor_name, patient_id: prescriptionDetails.patient_id, patient: prescriptionDetails.patient } : undefined,
            bill_items: billItems.map((item, index) => ({ id: Date.now() + index, bill_id: billResult.id, inventory_item_id: item.inventory_item_id, quantity: item.quantity, unit_price: item.unit_price, total_price: item.total_price }))
        };
        addBill(contextBill);
        onBillGenerated();
        billPropagation.handleBillGenerated({
          id: billResult.id,
          bill_number: billResult.bill_number,
          prescription_id: prescriptionId,
          total_amount: billResult.total_amount
        });

        toast({ title: "Success", description: `Bill ${billResult.bill_number} generated successfully.` });
        console.log("✅ Bill generation complete.");

      })();
    } catch (error: any) {
      console.error("💥 Bill Generation Failed:", error);
      toast({ title: "Error", description: error.message, variant: "destructive" });

      if (createdBillId) {
        console.log(`롤백 중... Bill ID: ${createdBillId}`);
        // Add your rollback logic here if needed
      }
    } finally {
      setIsGenerating(false);
      console.log("🛑 Bill generation process finished.");
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
        <div className="flex gap-2">
          {/* 🚨 DEBUG: Force refresh button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              console.log("🔄 FORCE REFRESH: Manually refreshing prescription data");
              setPrescriptionDetails(null);
              setTimeout(() => fetchPrescriptionDetails(), 100);
            }}
            className="bg-yellow-50 border-yellow-200 text-yellow-700 hover:bg-yellow-100"
          >
            🔄 Refresh
          </Button>
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
      </div>
      
      {/* ENHANCED: Patient Information Display */}
      {prescriptionDetails && prescriptionDetails.patient && (
        <div className="bg-white border-2 border-blue-200 rounded-xl p-6 shadow-sm">
          <h4 className="text-lg font-semibold text-blue-800 mb-4 flex items-center">
            <User className="w-5 h-5 mr-2" />
            Patient Information
            <span className="ml-auto text-xs bg-gray-100 px-2 py-1 rounded">
              ID: {prescriptionId} | DB: {prescriptionDetails.id}
            </span>
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center space-x-3">
                <User className="w-4 h-4 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-500">Patient Name</p>
                  <p className="font-semibold text-gray-800">
                    {prescriptionDetails.patient.name}
                    <span className="ml-2 text-xs text-gray-400">
                      ({new Date().toLocaleTimeString()})
                    </span>
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Phone className="w-4 h-4 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-500">Phone Number</p>
                  <p className="font-semibold text-gray-800">
                    {prescriptionDetails.patient.phone_number || 'Not provided'}
                    <span className="ml-2 text-xs text-gray-400">
                      (Prescription: {prescriptionDetails.date || 'N/A'})
                    </span>
                  </p>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center space-x-3">
                <FileText className="w-4 h-4 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-500">Doctor Name</p>
                  <p className="font-semibold text-gray-800">Dr. {prescriptionDetails.doctor_name}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Receipt className="w-4 h-4 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-500">Prescription Number</p>
                  <p className="font-semibold text-gray-800">{prescriptionDetails.prescription_number}</p>
                </div>
              </div>
            </div>
          </div>
          <details className="mt-4">
            <summary className="text-xs text-gray-500 cursor-pointer">Debug: Raw Prescription Data</summary>
            <pre className="text-xs bg-gray-50 p-2 mt-2 rounded overflow-auto">
              {JSON.stringify(prescriptionDetails, null, 2)}
            </pre>
          </details>
        </div>
      )}

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
              className={`p-4 space-y-3 max-h-[320px] overflow-y-auto scrollbar-thin`}
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
