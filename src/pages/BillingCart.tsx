
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import { CartHeader } from "@/components/billing/CartHeader";
import { CartContent } from "@/components/billing/CartContent";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import type { CartItem } from "@/types/billing";

export default function BillingCart() {
  const { prescriptionId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [prescriptionDetails, setPrescriptionDetails] = useState<any>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({
          title: "Authentication Required",
          description: "Please login to access billing",
          variant: "destructive",
        });
        navigate("/auth");
        return;
      }
    };

    checkAuth();
  }, [navigate, toast]);

  useEffect(() => {
    const fetchPrescriptionDetails = async () => {
      if (!prescriptionId) return;
      
      const prescriptionIdNumber = parseInt(prescriptionId);
      if (isNaN(prescriptionIdNumber)) {
        toast({
          title: "Error",
          description: "Invalid prescription ID",
          variant: "destructive",
        });
        navigate("/billing");
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("prescriptions")
        .select(`
          *,
          patient:patients(name, phone_number)
        `)
        .eq("id", prescriptionIdNumber)
        .eq("user_id", user.id)
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
  }, [prescriptionId, toast, navigate]);

  const handleAddToCart = (medicine: any, quantity: number) => {
    const existingItem = cartItems.find(item => item.id === medicine.id);
    
    // Always use selling_price instead of unit_cost
    const price = medicine.selling_price || medicine.unit_cost;
    
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
        unit_cost: price, // Use the price we determined above
        total: quantity * price, // Use the price we determined above
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
        <CartHeader 
          patientName={prescriptionDetails?.patient?.name}
          phoneNumber={prescriptionDetails?.patient?.phone_number}
        />

        <CartContent
          items={cartItems}
          onAddToCart={handleAddToCart}
          onRemoveItem={handleRemoveItem}
          onUpdateQuantity={handleUpdateQuantity}
          prescriptionId={parseInt(prescriptionId!)}
          onBillGenerated={handleBillGenerated}
        />
      </div>
    </DashboardLayout>
  );
}
