
import { CartItem } from "@/types/billing";
import { CartItemRow } from "./CartItemRow";

interface CartItemListProps {
  items: CartItem[];
  onRemoveItem: (id: number) => void;
  onUpdateQuantity: (id: number, quantity: number) => void;
}

export function CartItemList({ items, onRemoveItem, onUpdateQuantity }: CartItemListProps) {
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
    </div>
  );
}
