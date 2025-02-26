
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Receipt, Info } from "lucide-react";
import { CartItem } from "@/types/billing";
import { supabase } from "@/integrations/supabase/client";
import { CartItemList } from "./CartItemList";
import { BillDetailsForm } from "./BillDetailsForm";
import { BillPreviewDialog } from "./BillPreviewDialog";
import { useBillGeneration } from "@/hooks/useBillGeneration";

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
  const [gstPercentage, setGstPercentage] = useState(18);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const {
    showBillPreview,
    setShowBillPreview,
    generatedBill,
    generateBill,
  } = useBillGeneration();

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

  const subtotal = Math.round(items.reduce((sum, item) => sum + item.total, 0));
  const gstAmount = Math.round((subtotal * gstPercentage) / 100);
  const total = Math.round(subtotal + gstAmount - discountAmount);

  const handleGenerateBill = () => {
    generateBill(
      items,
      prescriptionId,
      subtotal,
      gstAmount,
      gstPercentage,
      discountAmount,
      total,
      onBillGenerated
    );
  };

  return (
    <div className="space-y-4">
      <CartItemList
        items={items}
        onRemoveItem={onRemoveItem}
        onUpdateQuantity={onUpdateQuantity}
      />

      <div className="space-y-3 pt-4">
        <BillDetailsForm
          subtotal={subtotal}
          gstPercentage={gstPercentage}
          gstAmount={gstAmount}
          discountAmount={discountAmount}
          total={total}
          paymentMethod={paymentMethod}
          onGstChange={setGstPercentage}
          onDiscountChange={setDiscountAmount}
          onPaymentMethodChange={setPaymentMethod}
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
