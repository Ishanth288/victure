
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X, Plus, Minus, Receipt, Printer } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { PrintableBill } from "./PrintableBill";

interface CartItem {
  id: number;
  name: string;
  quantity: number;
  unit_cost: number;
  total: number;
}

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

      // Create bill items and update inventory
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

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-4">
      {items.map((item) => (
        <div
          key={item.id}
          className="flex items-center justify-between py-2 border-b"
        >
          <div className="flex-1">
            <div className="font-medium">{item.name}</div>
            <div className="text-sm text-neutral-500">
              ₹{item.unit_cost} per unit
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center border rounded-md">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                disabled={item.quantity <= 1}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span className="w-12 text-center">{item.quantity}</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="w-20 text-right">₹{item.total}</div>
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

      <div className="space-y-3 pt-4">
        <div className="flex justify-between">
          <span>Subtotal</span>
          <span>₹{subtotal}</span>
        </div>

        <div className="space-y-2">
          <Label>GST (%)</Label>
          <Input
            type="number"
            value={gstPercentage}
            onChange={(e) => setGstPercentage(Number(e.target.value))}
            min="0"
            max="100"
          />
          <div className="flex justify-between text-sm">
            <span>GST Amount</span>
            <span>₹{gstAmount}</span>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Discount (₹)</Label>
          <Input
            type="number"
            value={discountAmount}
            onChange={(e) => setDiscountAmount(Number(e.target.value))}
            min="0"
          />
        </div>

        <div className="space-y-2">
          <Label>Payment Method</Label>
          <select
            className="w-full rounded-md border border-input bg-background px-3 py-2"
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
          >
            <option value="cash">Cash</option>
            <option value="card">Credit Card</option>
            <option value="upi">UPI</option>
          </select>
        </div>

        <div className="flex justify-between font-bold text-lg pt-2">
          <span>Total</span>
          <span>₹{total}</span>
        </div>

        <Button
          className="w-full"
          onClick={handleGenerateBill}
          disabled={items.length === 0}
        >
          <Receipt className="w-4 h-4 mr-2" />
          Generate Bill
        </Button>
      </div>

      <Dialog open={showBillPreview} onOpenChange={setShowBillPreview}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Bill Preview</span>
              <Button variant="outline" size="sm" onClick={handlePrint}>
                <Printer className="w-4 h-4 mr-2" />
                Print Bill
              </Button>
            </DialogTitle>
          </DialogHeader>
          {generatedBill && (
            <PrintableBill
              billData={generatedBill}
              items={items}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
