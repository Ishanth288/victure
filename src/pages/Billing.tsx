
import { useState } from "react";
import { PatientDetailsModal } from "@/components/billing/PatientDetailsModal";
import { SearchMedicineInput } from "@/components/billing/SearchMedicineInput";
import { CartSummary } from "@/components/billing/CartSummary";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import DashboardLayout from "@/components/DashboardLayout";
import { Plus, Receipt, Search } from "lucide-react";

interface CartItem {
  id: number;
  name: string;
  quantity: number;
  unit_cost: number;
  total: number;
}

export default function Billing() {
  const [showPatientModal, setShowPatientModal] = useState(false);
  const [currentPrescriptionId, setCurrentPrescriptionId] = useState<number | null>(null);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  const handlePatientDetailsSuccess = (prescriptionId: number) => {
    setCurrentPrescriptionId(prescriptionId);
    setShowPatientModal(false);
  };

  const handleAddToCart = (medicine: any, quantity: number) => {
    const existingItem = cartItems.find(item => item.id === medicine.id);
    
    if (existingItem) {
      setCartItems(cartItems.map(item =>
        item.id === medicine.id
          ? { ...item, quantity: item.quantity + quantity, total: (item.quantity + quantity) * item.unit_cost }
          : item
      ));
    } else {
      setCartItems([...cartItems, {
        id: medicine.id,
        name: medicine.name,
        quantity,
        unit_cost: medicine.unit_cost,
        total: quantity * medicine.unit_cost,
      }]);
    }
  };

  const handleRemoveItem = (id: number) => {
    setCartItems(cartItems.filter(item => item.id !== id));
  };

  const handleUpdateQuantity = (id: number, quantity: number) => {
    if (quantity <= 0) return;
    setCartItems(cartItems.map(item =>
      item.id === id
        ? { ...item, quantity, total: quantity * item.unit_cost }
        : item
    ));
  };

  const handleBillGenerated = () => {
    setCartItems([]);
    setCurrentPrescriptionId(null);
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-6">
        <Card className="mb-6">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-2xl font-bold text-primary">Billing Dashboard</CardTitle>
            {!currentPrescriptionId && (
              <Button 
                onClick={() => setShowPatientModal(true)}
                className="bg-primary hover:bg-primary/90 text-white shadow-lg hover:shadow-xl transition-all duration-200"
              >
                <Plus className="w-4 h-4 mr-2" />
                New Bill
              </Button>
            )}
          </CardHeader>
        </Card>

        <PatientDetailsModal
          open={showPatientModal}
          onOpenChange={setShowPatientModal}
          onSuccess={handlePatientDetailsSuccess}
        />

        {currentPrescriptionId && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <Card className="h-full">
                <CardHeader>
                  <CardTitle className="flex items-center text-lg font-semibold text-gray-700">
                    <Search className="w-5 h-5 mr-2 text-primary" />
                    Search Medicines
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <SearchMedicineInput onAddToCart={handleAddToCart} />
                </CardContent>
              </Card>
            </div>

            <div>
              <Card className="h-full">
                <CardHeader>
                  <CardTitle className="flex items-center text-lg font-semibold text-gray-700">
                    <Receipt className="w-5 h-5 mr-2 text-primary" />
                    Bill Summary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CartSummary
                    items={cartItems}
                    onRemoveItem={handleRemoveItem}
                    onUpdateQuantity={handleUpdateQuantity}
                    prescriptionId={currentPrescriptionId}
                    onBillGenerated={handleBillGenerated}
                  />
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
