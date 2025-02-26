
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Receipt, Info } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { CartItem } from "@/types/billing";
import { CartItemRow } from "./CartItemRow";
import { BillSummary } from "./BillSummary";
import { BillPreviewDialog } from "./BillPreviewDialog";

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
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuth();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session);
      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setIsAuthenticated(!!session);
    setIsLoading(false);
  };

  const subtotal = items.reduce((sum, item) => sum + item.total, 0);
  const gstAmount = (subtotal * gstPercentage) / 100;
  const total = subtotal + gstAmount - discountAmount;

  const handleGenerateBill = async () => {
    if (!isAuthenticated) {
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

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("User not authenticated");
      }

      const { data: billData, error: billError } = await supabase
        .from("bills")
        .insert([
          {
            prescription_id: prescriptionId,
            bill_number: `BILL-${Date.now()}`,
            subtotal,
            gst_amount: gstAmount,
            gst_percentage: gstPercentage,
            discount_amount: discountAmount,
            total_amount: total,
            status: "completed",
            user_id: user.id // Add user_id here
          },
        ])
        .select(`
          *,
          prescription:prescriptions (
            *,
            patient:patients (
              name,
              phone_number
            )
          )
        `)
        .single();

      if (billError) {
        console.error("Bill creation error:", billError);
        throw new Error(billError.message);
      }

      const billItems = items.map((item) => ({
        bill_id: billData.id,
        inventory_item_id: item.id,
        quantity: item.quantity,
        unit_price: item.unit_cost,
        total_price: item.total,
      }));

      const { error: billItemsError } = await supabase
        .from("bill_items")
        .insert(billItems);

      if (billItemsError) {
        console.error("Bill items creation error:", billItemsError);
        throw new Error(billItemsError.message);
      }

      // Update inventory quantities
      for (const item of items) {
        const { data: inventoryData, error: fetchError } = await supabase
          .from("inventory")
          .select("quantity")
          .eq("id", item.id)
          .single();

        if (fetchError) {
          console.error("Inventory fetch error:", fetchError);
          throw new Error(fetchError.message);
        }

        const newQuantity = (inventoryData?.quantity || 0) - item.quantity;
        const { error: inventoryError } = await supabase
          .from("inventory")
          .update({ quantity: newQuantity })
          .eq("id", item.id);

        if (inventoryError) {
          console.error("Inventory update error:", inventoryError);
          throw new Error(inventoryError.message);
        }
      }

      setGeneratedBill(billData);
      setShowBillPreview(true);
      onBillGenerated();

      toast({
        title: "Success",
        description: "Bill generated successfully",
      });
    } catch (error) {
      console.error("Error generating bill:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate bill",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-4">
      {items.map((item) => (
        <CartItemRow
          key={item.id}
          {...item}
          onRemoveItem={onRemoveItem}
          onUpdateQuantity={onUpdateQuantity}
        />
      ))}

      <div className="space-y-3 pt-4">
        <BillSummary
          subtotal={subtotal}
          gstPercentage={gstPercentage}
          gstAmount={gstAmount}
          discountAmount={discountAmount}
          total={total}
          onGstChange={setGstPercentage}
          onDiscountChange={setDiscountAmount}
          onPaymentMethodChange={setPaymentMethod}
          paymentMethod={paymentMethod}
        />

        {!isLoading && !isAuthenticated && (
          <div className="flex items-center gap-2 text-sm text-yellow-600 bg-yellow-50 p-2 rounded-md">
            <Info className="h-4 w-4" />
            <span>Please log in to generate bills</span>
          </div>
        )}

        <Button
          className="w-full"
          onClick={handleGenerateBill}
          disabled={items.length === 0 || !isAuthenticated || isLoading}
        >
          <Receipt className="w-4 h-4 mr-2" />
          Generate Bill
        </Button>
      </div>

      <BillPreviewDialog
        open={showBillPreview}
        onOpenChange={setShowBillPreview}
        billData={generatedBill}
        items={items}
      />
    </div>
  );
}
