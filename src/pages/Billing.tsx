
import { useState } from "react";
import { PatientDetailsModal } from "@/components/billing/PatientDetailsModal";
import { SearchMedicineInput } from "@/components/billing/SearchMedicineInput";
import { CartSummary } from "@/components/billing/CartSummary";
import { Button } from "@/components/ui/button";
import DashboardLayout from "@/components/DashboardLayout";
import { Plus } from "lucide-react";

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
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Billing</h1>
          {!currentPrescriptionId && (
            <Button onClick={() => setShowPatientModal(true)}>
              <Plus className="w-4 h-4 mr-2" />
              New Bill
            </Button>
          )}
        </div>

        <PatientDetailsModal
          open={showPatientModal}
          onOpenChange={setShowPatientModal}
          onSuccess={handlePatientDetailsSuccess}
        />

        {currentPrescriptionId && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <div className="bg-white rounded-lg shadow p-4">
                <h2 className="text-lg font-semibold mb-4">Add Items</h2>
                <SearchMedicineInput onAddToCart={handleAddToCart} />
              </div>
            </div>

            <div>
              <div className="bg-white rounded-lg shadow p-4">
                <h2 className="text-lg font-semibold mb-4">Bill Summary</h2>
                <CartSummary
                  items={cartItems}
                  onRemoveItem={handleRemoveItem}
                  onUpdateQuantity={handleUpdateQuantity}
                  prescriptionId={currentPrescriptionId}
                  onBillGenerated={handleBillGenerated}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
