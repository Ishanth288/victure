
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

  useEffect(() => {
    // Simulate loading time for better UX
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500);

    const prescriptionIdParam = searchParams.get('prescriptionId');
    const patientName = searchParams.get('patientName');
    const patientPhone = searchParams.get('patientPhone');
    const prescriptionNumber = searchParams.get('prescriptionNumber');
    
    if (prescriptionIdParam) {
      setPrescriptionId(parseInt(prescriptionIdParam));
      setShowPrescriptionSearch(false);
      
      if (patientName || patientPhone) {
        setPatientInfo({
          name: patientName || '',
          phone: patientPhone || '',
          prescriptionNumber: prescriptionNumber || undefined,
        });
      }
    }

    return () => clearTimeout(timer);
  }, [searchParams]);

  const handleCreateNewPrescription = () => {
    setShowPrescriptionSearch(false);
    setShowPatientModal(true);
  };

  const handlePatientSuccess = (newPrescriptionId: number, patientData?: any) => {
    setPrescriptionId(newPrescriptionId);
    if (patientData) {
      setPatientInfo(patientData);
    }
    setShowPatientModal(false);
    
    toast({
      title: "Prescription Created",
      description: `Ready to add medicines for ${patientData?.name}`,
    });
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
        <div className="container mx-auto px-4 py-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold">Billing</h1>
            {patientInfo?.prescriptionNumber && (
              <Badge variant="outline" className="text-sm">
                Prescription #{patientInfo.prescriptionNumber}
              </Badge>
            )}
          </div>

          {/* Patient Info Display */}
          {patientInfo && (
            <Card className="mb-6 border-0 shadow-lg bg-gradient-to-r from-blue-50 to-green-50">
              <CardHeader>
                <CardTitle className="text-lg flex items-center text-gray-800">
                  <User className="w-5 h-5 mr-2 text-blue-600" />
                  Patient Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center bg-white/50 p-3 rounded-lg">
                    <User className="w-4 h-4 mr-2 text-blue-500" />
                    <span className="font-medium text-gray-700">Name:</span>
                    <span className="ml-2 text-gray-900">{patientInfo.name}</span>
                  </div>
                  <div className="flex items-center bg-white/50 p-3 rounded-lg">
                    <Phone className="w-4 h-4 mr-2 text-green-500" />
                    <span className="font-medium text-gray-700">Phone:</span>
                    <span className="ml-2 text-gray-900">{patientInfo.phone}</span>
                  </div>
                  {patientInfo.doctorName && (
                    <div className="flex items-center bg-white/50 p-3 rounded-lg">
                      <FileText className="w-4 h-4 mr-2 text-purple-500" />
                      <span className="font-medium text-gray-700">Doctor:</span>
                      <span className="ml-2 text-gray-900">{patientInfo.doctorName}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Search and Results Area */}
            <div className="lg:col-span-2">
              <Card className="h-full shadow-lg border-0">
                <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-t-lg">
                  <CardTitle className="flex items-center text-lg font-semibold">
                    <Search className="w-5 h-5 mr-2" />
                    Search Medicines
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
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
                <Card className="h-full shadow-lg border-0">
                  <CardHeader className="bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-t-lg">
                    <CardTitle className="flex items-center text-lg font-semibold">
                      <Receipt className="w-5 h-5 mr-2" />
                      Bill Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
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
