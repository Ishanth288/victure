
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Receipt } from "lucide-react";
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

  const subtotal = items.reduce((sum, item) => sum + item.total, 0);
  const gstAmount = (subtotal * gstPercentage) / 100;
  const total = subtotal + gstAmount - discountAmount;

  const handleGenerateBill = async () => {
    if (items.length === 0) {
      toast({
        title: "Error",
        description: "Please add items to the cart",
        variant: "destructive",
      });
      return;
    }

    try {
      // Create bill
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

      if (billError) throw billError;

      // Create bill items
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

      if (billItemsError) throw billItemsError;

      // Update inventory quantities
      for (const item of items) {
        const { data: inventoryData, error: fetchError } = await supabase
          .from("inventory")
          .select("quantity")
          .eq("id", item.id)
          .single();

        if (fetchError) throw fetchError;

        const newQuantity = (inventoryData?.quantity || 0) - item.quantity;
        const { error: inventoryError } = await supabase
          .from("inventory")
          .update({ quantity: newQuantity })
          .eq("id", item.id);

        if (inventoryError) throw inventoryError;
      }

      setGeneratedBill(billData);
      setShowBillPreview(true);

      toast({
        title: "Success",
        description: "Bill generated successfully",
      });
    } catch (error) {
      console.error("Error generating bill:", error);
      toast({
        title: "Error",
        description: "Failed to generate bill",
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

        <Button
          className="w-full"
          onClick={handleGenerateBill}
          disabled={items.length === 0}
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
