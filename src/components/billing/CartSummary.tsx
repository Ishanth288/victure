
import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface CartItem {
  id: number;
  name: string;
  quantity: number;
  unit_cost: number;
  total: number;
}

interface CartSummaryProps {
  items: CartItem[];
  onRemoveItem: (id: number) => void;
  onUpdateQuantity: (id: number, quantity: number) => void;
  prescriptionId: number;
  onBillGenerated: () => void;
}

export function CartSummary({
  items,
  onRemoveItem,
  onUpdateQuantity,
  prescriptionId,
  onBillGenerated,
}: CartSummaryProps) {
  const { toast } = useToast();
  const [gstPercentage, setGstPercentage] = useState(18);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [isGenerating, setIsGenerating] = useState(false);

  const subtotal = items.reduce((sum, item) => sum + item.total, 0);
  const gstAmount = (subtotal * gstPercentage) / 100;
  const total = subtotal + gstAmount - discountAmount;

  const handleGenerateBill = async () => {
    if (items.length === 0) {
      toast({
        title: "Error",
        description: "Please add items to the bill",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    try {
      // Create the bill
      const billNumber = `BILL-${Date.now()}`;
      const { data: billData, error: billError } = await supabase
        .from("bills")
        .insert([{
          bill_number: billNumber,
          prescription_id: prescriptionId,
          subtotal,
          gst_percentage: gstPercentage,
          gst_amount: gstAmount,
          discount_amount: discountAmount,
          total_amount: total,
          status: 'completed',
        }])
        .select()
        .single();

      if (billError) throw billError;

      // Create bill items and update inventory
      const billItems = items.map(item => ({
        bill_id: billData.id,
        inventory_item_id: item.id,
        quantity: item.quantity,
        unit_price: item.unit_cost,
        total_price: item.total,
      }));

      const { error: itemsError } = await supabase
        .from("bill_items")
        .insert(billItems);

      if (itemsError) throw itemsError;

      // Update inventory quantities
      for (const item of items) {
        const { data: inventoryItem, error: fetchError } = await supabase
          .from("inventory")
          .select("quantity")
          .eq("id", item.id)
          .single();

        if (fetchError) throw fetchError;

        const { error: updateError } = await supabase
          .from("inventory")
          .update({ 
            quantity: inventoryItem.quantity - item.quantity 
          })
          .eq("id", item.id);

        if (updateError) throw updateError;
      }

      toast({
        title: "Success",
        description: "Bill generated successfully",
      });

      onBillGenerated();
    } catch (error) {
      console.error("Error generating bill:", error);
      toast({
        title: "Error",
        description: "Failed to generate bill",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-4">
      {items.map((item) => (
        <div key={item.id} className="flex items-center justify-between py-2 border-b">
          <div className="flex-1">
            <div className="font-medium">{item.name}</div>
            <div className="text-sm text-neutral-500">
              ₹{item.unit_cost} x {item.quantity} = ₹{item.total}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              value={item.quantity}
              onChange={(e) => onUpdateQuantity(item.id, parseInt(e.target.value))}
              className="w-20"
              min="1"
            />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onRemoveItem(item.id)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ))}

      <div className="space-y-2 pt-4">
        <div className="flex justify-between text-sm">
          <span>Subtotal</span>
          <span>₹{subtotal.toFixed(2)}</span>
        </div>
        <div className="flex items-center justify-between">
          <Label htmlFor="gst">GST (%)</Label>
          <Input
            id="gst"
            type="number"
            value={gstPercentage}
            onChange={(e) => setGstPercentage(parseFloat(e.target.value))}
            className="w-20"
          />
        </div>
        <div className="flex justify-between text-sm">
          <span>GST Amount</span>
          <span>₹{gstAmount.toFixed(2)}</span>
        </div>
        <div className="flex items-center justify-between">
          <Label htmlFor="discount">Discount</Label>
          <Input
            id="discount"
            type="number"
            value={discountAmount}
            onChange={(e) => setDiscountAmount(parseFloat(e.target.value))}
            className="w-20"
          />
        </div>
        <div className="flex items-center justify-between pt-4">
          <Label htmlFor="payment-method">Payment Method</Label>
          <Select value={paymentMethod} onValueChange={setPaymentMethod}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select payment method" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="cash">Cash</SelectItem>
              <SelectItem value="card">Credit/Debit Card</SelectItem>
              <SelectItem value="upi">UPI</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex justify-between font-bold text-lg pt-2 border-t">
          <span>Total</span>
          <span>₹{total.toFixed(2)}</span>
        </div>
      </div>

      <Button
        className="w-full"
        onClick={handleGenerateBill}
        disabled={isGenerating || items.length === 0}
      >
        {isGenerating ? "Generating..." : "Generate Bill"}
      </Button>
    </div>
  );
}
