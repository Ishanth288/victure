
import { Search, Receipt } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SearchMedicineInput } from "./SearchMedicineInput";
import { CartSummary } from "./CartSummary";
import { CartItem } from "@/types/billing";

interface CartContentProps {
  items: CartItem[];
  onAddToCart: (medicine: any, quantity: number) => void;
  onRemoveItem: (id: number) => void;
  onUpdateQuantity: (id: number, quantity: number) => void;
  prescriptionId: number;
  onBillGenerated: () => void;
}

export function CartContent({
  items,
  onAddToCart,
  onRemoveItem,
  onUpdateQuantity,
  prescriptionId,
  onBillGenerated,
}: CartContentProps) {
  return (
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
            <SearchMedicineInput onAddToCart={onAddToCart} />
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
              items={items}
              onRemoveItem={onRemoveItem}
              onUpdateQuantity={onUpdateQuantity}
              prescriptionId={prescriptionId}
              onBillGenerated={onBillGenerated}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
