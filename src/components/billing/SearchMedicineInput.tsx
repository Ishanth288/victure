
import { useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { type InventoryItem, type InventoryItemDB } from "@/types/inventory";

interface SearchMedicineInputProps {
  onAddToCart: (medicine: InventoryItem, quantity: number) => void;
}

export function SearchMedicineInput({ onAddToCart }: SearchMedicineInputProps) {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.length < 1) {
      setSearchResults([]);
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("inventory")
        .select("*")
        .or(`name.ilike.%${query}%,generic_name.ilike.%${query}%`)
        .order("name");

      if (error) {
        console.error("Supabase error:", error);
        throw error;
      }

      const inventoryItems: InventoryItem[] = (data as InventoryItemDB[]).map(item => ({
        ...item,
        generic_name: item.generic_name || null,
        strength: item.strength || null,
        selling_price: item.selling_price || null,
        reorder_point: item.reorder_point || 10,
        storage_condition: item.storage_condition || null
      }));

      setSearchResults(inventoryItems);
    } catch (error) {
      console.error("Error searching medicines:", error);
      toast({
        title: "Error",
        description: "Failed to search medicines",
        variant: "destructive",
      });
      setSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const getStockStatus = (item: InventoryItem) => {
    if (item.quantity === 0) {
      return <Badge variant="destructive">Out of Stock</Badge>;
    } else if (item.quantity < (item.reorder_point || 10)) {
      return <Badge variant="warning">Low Stock: {item.quantity}</Badge>;
    } else {
      return <Badge variant="success">In Stock: {item.quantity}</Badge>;
    }
  };

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-neutral-400" />
        <Input
          placeholder="Search by medicine name or generic name..."
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {searchResults.length > 0 && (
        <Card className="absolute z-10 w-full mt-1 p-2 max-h-80 overflow-y-auto shadow-lg">
          {searchResults.map((medicine) => (
            <div
              key={medicine.id}
              className="p-3 hover:bg-neutral-50 rounded flex items-center justify-between gap-4 cursor-pointer transition-colors"
            >
              <div className="flex-grow">
                <div className="font-medium text-base">{medicine.name}</div>
                {medicine.generic_name && (
                  <div className="text-sm text-neutral-600">
                    {medicine.generic_name}
                  </div>
                )}
                <div className="text-sm text-neutral-500 flex items-center gap-2 mt-1">
                  {medicine.dosage_form && medicine.strength && (
                    <span>{`${medicine.dosage_form} • ${medicine.strength}`}</span>
                  )}
                  <span>₹{medicine.unit_cost.toFixed(2)}</span>
                </div>
                <div className="mt-1">
                  {getStockStatus(medicine)}
                </div>
              </div>
              <Button
                onClick={() => {
                  onAddToCart(medicine, 1);
                  setSearchQuery("");
                  setSearchResults([]);
                }}
                disabled={medicine.quantity < 1}
                variant="outline"
                size="sm"
                className="min-w-[80px]"
              >
                Add
              </Button>
            </div>
          ))}
        </Card>
      )}

      {isLoading && (
        <Card className="absolute z-10 w-full mt-1 p-4 text-center text-neutral-500">
          Searching...
        </Card>
      )}

      {searchQuery && searchResults.length === 0 && !isLoading && (
        <Card className="absolute z-10 w-full mt-1 p-4 text-center text-neutral-500">
          No medicines found
        </Card>
      )}
    </div>
  );
}
