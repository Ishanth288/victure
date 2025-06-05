import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import { EnhancedPatientDetailsModal } from "@/components/billing/EnhancedPatientDetailsModal";
import { SearchMedicineInput } from "@/components/billing/SearchMedicineInput";
import { CartSummary } from "@/components/billing/CartSummary";
import { BillingSkeleton } from "@/components/billing/BillingSkeleton";
import { CartItem } from "@/types/billing";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { User, Phone, FileText, Search, Receipt, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Billing() {
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const [showPatientModal, setShowPatientModal] = useState(false);
  const [showPrescriptionSearch, setShowPrescriptionSearch] = useState(true);
  const [prescriptionId, setPrescriptionId] = useState<number | null>(null);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [patientInfo, setPatientInfo] = useState<{
    name: string;
    phone: string;
    prescriptionNumber?: string;
    doctorName?: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 🧹 CRITICAL: Clear any cached data on component mount
  useEffect(() => {
    console.log("🧹 Billing component mounted - clearing all cached data");
    setPatientInfo(null);
    setPrescriptionId(null);
    setCartItems([]);
    setShowPrescriptionSearch(true);
    setShowPatientModal(false);
  }, []); // Empty dependency array = runs once on mount

  useEffect(() => {
    // Simulate loading time for better UX
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500);

    const prescriptionIdParam = searchParams.get('prescriptionId');
    const prescriptionNumber = searchParams.get('prescriptionNumber');
    
    console.log("🔄 Billing page - URL params check:", { prescriptionIdParam, prescriptionNumber });
    console.log("🔄 Current component state:", {
      prescriptionId,
      patientInfo,
      showPrescriptionSearch,
      showPatientModal
    });
    
    if (prescriptionIdParam) {
      const newPrescriptionId = parseInt(prescriptionIdParam);
      console.log(`🎯 Setting prescription ID from URL: ${newPrescriptionId}`);
      setPrescriptionId(newPrescriptionId);
      setShowPrescriptionSearch(false);
    } else {
      // No prescription ID - show the prescription search
      console.log("🔄 No prescription ID in URL - showing search");
      setShowPrescriptionSearch(true);
    }

    return () => clearTimeout(timer);
  }, [searchParams]);

  const handleCreateNewPrescription = () => {
    console.log("🧹 Creating new prescription - clearing all data");
    // CRITICAL: Clear all data before opening modal
    setPatientInfo(null);
    setPrescriptionId(null);
    setCartItems([]);
    setShowPrescriptionSearch(false);
    setShowPatientModal(true);
  };

  const handlePatientSuccess = (newPrescriptionId: number, patientData?: any) => {
    console.log("🎯 PRESCRIPTION SUCCESS - New ID:", newPrescriptionId);
    console.log("🎯 PATIENT DATA RECEIVED:", patientData);
    
    // 🚨 CRITICAL: Force complete state reset before setting new data
    setPatientInfo(null);
    setPrescriptionId(null);
    setCartItems([]);
    
    // 🚨 FORCE FRESH PRESCRIPTION ID: Add small delay to ensure state clearing
    setTimeout(() => {
      console.log("🔄 Setting fresh prescription ID:", newPrescriptionId);
      setPrescriptionId(newPrescriptionId);
      
      // 🚨 IMMEDIATELY set patient info to avoid database lookup delay
      if (patientData) {
        console.log("🔄 Setting fresh patient info:", {
          name: patientData.name,
          phone: patientData.phone_number,
          prescriptionNumber: patientData.prescriptionNumber,
          doctorName: patientData.doctorName
        });
        
        setPatientInfo({
          name: patientData.name,
          phone: patientData.phone_number,
          prescriptionNumber: patientData.prescriptionNumber,
          doctorName: patientData.doctorName
        });
      }
      
      setShowPatientModal(false);
      
      toast({
        title: "Prescription Created",
        description: `Ready to add medicines for ${patientData?.name}`,
      });
    }, 200); // Increased delay to ensure complete state reset
  };

  const handleModalClose = () => {
    setShowPatientModal(false);
    // Reset to show prescription search when modal is closed
    setShowPrescriptionSearch(true);
    setPrescriptionId(null);
    setPatientInfo(null);
    setCartItems([]);
  };

  const handleAddItem = (item: CartItem) => {
    setCartItems(prev => {
      const existing = prev.find(cartItem => cartItem.id === item.id);
      if (existing) {
        return prev.map(cartItem =>
          cartItem.id === item.id
            ? { ...cartItem, quantity: cartItem.quantity + 1, total: (cartItem.quantity + 1) * cartItem.unit_cost }
            : cartItem
        );
      }
      return [...prev, item];
    });
  };

  const handleRemoveItem = (id: number) => {
    setCartItems(prev => prev.filter(item => item.id !== id));
  };

  const handleUpdateQuantity = (id: number, quantity: number) => {
    if (quantity <= 0) {
      handleRemoveItem(id);
      return;
    }

    setCartItems(prev =>
      prev.map(item =>
        item.id === id
          ? { ...item, quantity, total: quantity * item.unit_cost }
          : item
      )
    );
  };

  const handleBillGenerated = () => {
    setCartItems([]);
    setPatientInfo(null);
    setPrescriptionId(null);
    setShowPrescriptionSearch(true);
    
    toast({
      title: "Bill Generated Successfully",
      description: "Prescription has been saved and bill created",
    });
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <BillingSkeleton />
      </DashboardLayout>
    );
  }

  if (showPrescriptionSearch) {
    return (
      <DashboardLayout>
        <div className="container mx-auto px-4 py-6">
          <div className="flex justify-center items-center min-h-[60vh]">
            <Card className="shadow-lg border-0 bg-gradient-to-br from-blue-50 to-white max-w-md w-full">
              <CardHeader className="text-center">
                <CardTitle className="flex items-center justify-center text-xl font-semibold text-gray-800">
                  <FileText className="w-6 h-6 mr-2 text-blue-600" />
                  Start Billing
                </CardTitle>
                <p className="text-sm text-gray-600 mt-2">
                  Create a new prescription to begin billing
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                <Button 
                  onClick={handleCreateNewPrescription}
                  className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create New Prescription
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <Suspense fallback={<BillingSkeleton />}>
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-3xl font-bold">Billing</h1>
            {patientInfo?.prescriptionNumber && (
              <Badge variant="outline" className="text-sm">
                Prescription #{patientInfo.prescriptionNumber}
              </Badge>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Search and Results Area */}
            <div className="lg:col-span-2">
              <Card className="shadow-lg border-0">
                <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-t-lg py-3">
                  <CardTitle className="flex items-center text-lg font-semibold">
                    <Search className="w-5 h-5 mr-2" />
                    Search Medicines
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <SearchMedicineInput 
                    onAddItem={handleAddItem}
                    cartItems={cartItems}
                  />
                </CardContent>
              </Card>
            </div>

            {/* Cart Summary */}
            <div className="lg:col-span-1">
              {prescriptionId && (
                <Card className="shadow-lg border-0">
                  <CardHeader className="bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-t-lg py-3">
                    <CardTitle className="flex items-center text-lg font-semibold">
                      <Receipt className="w-5 h-5 mr-2" />
                      Bill Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4">
                    <CartSummary
                      items={cartItems}
                      prescriptionId={prescriptionId}
                      onRemoveItem={handleRemoveItem}
                      onUpdateQuantity={handleUpdateQuantity}
                      onBillGenerated={handleBillGenerated}
                    />
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>

        <EnhancedPatientDetailsModal
          open={showPatientModal}
          onOpenChange={handleModalClose}
          onSuccess={handlePatientSuccess}
        />
      </Suspense>
    </DashboardLayout>
  );
}
