
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface BillDetailsFormProps {
  subtotal: number;
  gstPercentage: number;
  gstAmount: number;
  discountAmount: number;
  total: number;
  paymentMethod: string;
  onGstChange: (value: number) => void;
  onDiscountChange: (value: number) => void;
  onPaymentMethodChange: (value: string) => void;
}

export function BillDetailsForm({
  subtotal,
  gstPercentage,
  gstAmount,
  discountAmount,
  total,
  paymentMethod,
  onGstChange,
  onDiscountChange,
  onPaymentMethodChange,
}: BillDetailsFormProps) {
  return (
    <div className="rounded-lg border p-4">
      <div className="space-y-3">
        <div className="flex justify-between">
          <span>Subtotal</span>
          <span className="font-medium">₹{subtotal}</span>
        </div>

        <div className="space-y-2">
          <Label>GST (%)</Label>
          <Input
            type="number"
            value={gstPercentage}
            onChange={(e) => onGstChange(Number(e.target.value))}
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
            onChange={(e) => onDiscountChange(Number(e.target.value))}
            min="0"
          />
        </div>

        <div className="space-y-2">
          <Label>Payment Method</Label>
          <select
            className="w-full rounded-md border border-input bg-background px-3 py-2"
            value={paymentMethod}
            onChange={(e) => onPaymentMethodChange(e.target.value)}
          >
            <option value="cash">Cash</option>
            <option value="card">Credit Card</option>
            <option value="upi">UPI</option>
          </select>
        </div>

        <div className="flex justify-between font-bold text-lg pt-2 border-t">
          <span>Total</span>
          <span>₹{total}</span>
        </div>
      </div>
    </div>
  );
}
