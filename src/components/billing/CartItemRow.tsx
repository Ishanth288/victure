
import { Button } from "@/components/ui/button";
import { X, Plus, Minus } from "lucide-react";

interface CartItemRowProps {
  id: number;
  name: string;
  quantity: number;
  unit_cost: number;
  total: number;
  onRemoveItem: (id: number) => void;
  onUpdateQuantity: (id: number, quantity: number) => void;
}

export function CartItemRow({
  id,
  name,
  quantity,
  unit_cost,
  total,
  onRemoveItem,
  onUpdateQuantity,
}: CartItemRowProps) {
  return (
    <div className="flex items-center justify-between py-2 border-b">
      <div className="flex-1">
        <div className="font-medium">{name}</div>
        <div className="text-sm text-neutral-500">₹{unit_cost} per unit</div>
      </div>
      <div className="flex items-center gap-2">
        <div className="flex items-center border rounded-md">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => onUpdateQuantity(id, quantity - 1)}
            disabled={quantity <= 1}
          >
            <Minus className="h-4 w-4" />
          </Button>
          <span className="w-12 text-center">{quantity}</span>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => onUpdateQuantity(id, quantity + 1)}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <div className="w-20 text-right">₹{total}</div>
        <Button variant="ghost" size="icon" onClick={() => onRemoveItem(id)}>
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
