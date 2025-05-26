
import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import { PatientDetailsModal } from "@/components/billing/PatientDetailsModal";
import { SearchMedicineInput } from "@/components/billing/SearchMedicineInput";
import { CartSummary } from "@/components/billing/CartSummary";
import { CartItem } from "@/types/billing";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User, Phone, FileText } from "lucide-react";

export default function Billing() {
  const [searchParams] = useSearchParams();
  const [showPatientModal, setShowPatientModal] = useState(false);
  const [prescriptionId, setPrescriptionId] = useState<number | null>(null);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [patientInfo, setPatientInfo] = useState<{
    name: string;
    phone: string;
    prescriptionNumber?: string;
  } | null>(null);

  useEffect(() => {
    // Check if we have prescription data from URL params (from prescription page)
    const prescriptionIdParam = searchParams.get('prescriptionId');
    const patientName = searchParams.get('patientName');
    const patientPhone = searchParams.get('patientPhone');
    
    if (prescriptionIdParam) {
      setPrescriptionId(parseInt(prescriptionIdParam));
      
      if (patientName || patientPhone) {
        setPatientInfo({
          name: patientName || '',
          phone: patientPhone || '',
        });
      }
    } else {
      // No prescription ID, show modal to create new prescription
      setShowPatientModal(true);
    }
  }, [searchParams]);

  const handlePatientSuccess = (newPrescriptionId: number) => {
    setPrescriptionId(newPrescriptionId);
    setShowPatientModal(false);
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
    // Optionally reset patient info or navigate away
  };

  if (!prescriptionId && !showPatientModal) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-2">Loading...</h2>
            <p className="text-gray-600">Setting up billing interface</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Billing</h1>
          {prescriptionId && (
            <Badge variant="outline" className="text-sm">
              Prescription #{prescriptionId}
            </Badge>
          )}
        </div>

        {/* Patient Info Display */}
        {patientInfo && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <User className="w-5 h-5 mr-2" />
                Patient Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center">
                  <User className="w-4 h-4 mr-2 text-gray-400" />
                  <span className="font-medium">Name:</span>
                  <span className="ml-2">{patientInfo.name}</span>
                </div>
                <div className="flex items-center">
                  <Phone className="w-4 h-4 mr-2 text-gray-400" />
                  <span className="font-medium">Phone:</span>
                  <span className="ml-2">{patientInfo.phone}</span>
                </div>
                {patientInfo.prescriptionNumber && (
                  <div className="flex items-center">
                    <FileText className="w-4 h-4 mr-2 text-gray-400" />
                    <span className="font-medium">Prescription:</span>
                    <span className="ml-2">{patientInfo.prescriptionNumber}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Search and Results Area */}
          <div className="lg:col-span-2">
            <SearchMedicineInput 
              onAddItem={handleAddItem}
              cartItems={cartItems}
            />
          </div>

          {/* Cart Summary */}
          <div className="lg:col-span-1">
            {prescriptionId && (
              <CartSummary
                items={cartItems}
                prescriptionId={prescriptionId}
                onRemoveItem={handleRemoveItem}
                onUpdateQuantity={handleUpdateQuantity}
                onBillGenerated={handleBillGenerated}
              />
            )}
          </div>
        </div>
      </div>

      <PatientDetailsModal
        open={showPatientModal}
        onOpenChange={setShowPatientModal}
        onSuccess={handlePatientSuccess}
      />
    </DashboardLayout>
  );
}
