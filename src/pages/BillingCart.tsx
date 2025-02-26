
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import DashboardLayout from "@/components/DashboardLayout";
import { SearchMedicineInput } from "@/components/billing/SearchMedicineInput";
import { CartSummary } from "@/components/billing/CartSummary";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Receipt, Search, ArrowLeft } from "lucide-react";

interface CartItem {
  id: number;
  name: string;
  quantity: number;
  unit_cost: number;
  total: number;
}

export default function BillingCart() {
  const { prescriptionId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [prescriptionDetails, setPrescriptionDetails] = useState<any>(null);

  useEffect(() => {
    const fetchPrescriptionDetails = async () => {
      const { data, error } = await supabase
        .from("prescriptions")
        .select(`
          *,
          patient:patients(name, phone_number)
        `)
        .eq("id", prescriptionId)
        .single();

      if (error) {
        toast({
          title: "Error",
          description: "Failed to load prescription details",
          variant: "destructive",
        });
        return;
      }

      setPrescriptionDetails(data);
    };

    fetchPrescriptionDetails();
  }, [prescriptionId, toast]);

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
    navigate("/billing");
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-6">
        <Card className="mb-6">
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => navigate("/billing")}
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <CardTitle className="text-2xl font-bold text-primary">Generate Bill</CardTitle>
              </div>
              {prescriptionDetails && (
                <div className="text-sm text-gray-500">
                  Patient: {prescriptionDetails.patient.name} | Phone: {prescriptionDetails.patient.phone_number}
                </div>
              )}
            </div>
          </CardHeader>
        </Card>

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
                  prescriptionId={Number(prescriptionId)}
                  onBillGenerated={handleBillGenerated}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
