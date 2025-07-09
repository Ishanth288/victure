
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
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
  const [patientFlagged, setPatientFlagged] = useState<boolean>(false);

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
          patient:patients(name, phone_number, is_flagged)
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
      setPatientFlagged(data?.patient?.is_flagged || false);
    };

    fetchPrescriptionDetails();
  }, [prescriptionId, toast, navigate]);

  const handleAddToCart = (medicine: any, quantity: number) => {
    const existingItem = cartItems.find(item => item.id === medicine.id);
    
    // Always use selling_price instead of unit_cost
    const price = medicine.selling_price || medicine.unit_cost;
    
    if (existingItem) {
      const newQuantity = existingItem.quantity + quantity;
      
      // Check if new quantity exceeds available stock
      if (medicine.available_quantity && newQuantity > medicine.available_quantity) {
        toast({
          title: "Insufficient Stock",
          description: `Only ${medicine.available_quantity} units available for ${medicine.name}. Currently ${existingItem.quantity} in cart.`,
          variant: "destructive",
        });
        return;
      }
      
      setCartItems(cartItems.map(item =>
        item.id === medicine.id
          ? { ...item, quantity: newQuantity, total: newQuantity * item.unit_cost }
          : item
      ));
    } else {
      // Check if initial quantity exceeds available stock
      if (medicine.available_quantity && quantity > medicine.available_quantity) {
        toast({
          title: "Insufficient Stock",
          description: `Only ${medicine.available_quantity} units available for ${medicine.name}`,
          variant: "destructive",
        });
        return;
      }
      
      setCartItems([...cartItems, {
        id: medicine.id,
        name: medicine.name,
        quantity,
        unit_cost: price, // Use the price we determined above
        total: quantity * price, // Use the price we determined above
        available_quantity: medicine.available_quantity, // Include available quantity
      }]);
    }
  };

  const handleRemoveItem = (id: number) => {
    setCartItems(cartItems.filter(item => item.id !== id));
  };

  const handleUpdateQuantity = (id: number, quantity: number) => {
    if (quantity <= 0) return;
    
    // Find the item to check available stock
    const item = cartItems.find(item => item.id === id);
    if (!item) return;
    
    // Check if quantity exceeds available stock
    if (item.available_quantity && quantity > item.available_quantity) {
      toast({
        title: "Insufficient Stock",
        description: `Only ${item.available_quantity} units available for ${item.name}`,
        variant: "destructive",
      });
      return;
    }
    
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
    <div className="container mx-auto px-4 py-6">
      <CartHeader 
        patientName={prescriptionDetails?.patient?.name}
        phoneNumber={prescriptionDetails?.patient?.phone_number}
        doctorName={prescriptionDetails?.doctor_name}
        isFlagged={patientFlagged}
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
  );
}
