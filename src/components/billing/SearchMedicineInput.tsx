
import { useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

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
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("inventory")
        .select("*")
        .ilike("name", `%${query}%`)
        .limit(5);

      if (error) throw error;
      setSearchResults(data || []);
    } catch (error) {
      console.error("Error searching medicines:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-neutral-400" />
        <Input
          placeholder="Search medicine by name/code..."
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {searchResults.length > 0 && (
        <Card className="absolute z-10 w-full mt-1 p-2 max-h-80 overflow-y-auto">
          {searchResults.map((medicine) => (
            <div
              key={medicine.id}
              className="p-2 hover:bg-neutral-50 rounded flex items-center justify-between"
            >
              <div>
                <div className="font-medium">{medicine.name}</div>
                <div className="text-sm text-neutral-500">
                  {medicine.dosage_form} {medicine.unit_size}
                </div>
                <div className="text-sm">
                  Stock: {medicine.quantity} | Price: ₹{medicine.unit_cost}
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
              >
                Add
              </Button>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}
