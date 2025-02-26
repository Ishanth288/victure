
import { useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";

interface Medicine {
  id: number;
  name: string;
  quantity: number;
  unit_cost: number;
  dosage_form: string | null;
  unit_size: string | null;
}

interface SearchMedicineInputProps {
  onAddToCart: (medicine: Medicine, quantity: number) => void;
}

export function SearchMedicineInput({ onAddToCart }: SearchMedicineInputProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Medicine[]>([]);
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
        .ilike("name", `${query}%`)
        .order("name")
        .limit(5);

      if (error) throw error;
      setSearchResults(data || []);
    } catch (error) {
      console.error("Error searching medicines:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStockStatus = (quantity: number) => {
    if (quantity === 0) {
      return <Badge variant="destructive">Out of Stock</Badge>;
    } else if (quantity < 10) {
      return <Badge variant="warning">Low Stock: {quantity}</Badge>;
    } else {
      return <Badge variant="success">In Stock: {quantity}</Badge>;
    }
  };

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-neutral-400" />
        <Input
          placeholder="Start typing medicine name..."
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
                <div className="text-sm text-neutral-500 flex items-center gap-2 mt-1">
                  {medicine.dosage_form && medicine.unit_size && (
                    <span>{`${medicine.dosage_form} • ${medicine.unit_size}`}</span>
                  )}
                  <span>₹{medicine.unit_cost.toFixed(2)}</span>
                </div>
                <div className="mt-1">
                  {getStockStatus(medicine.quantity)}
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
