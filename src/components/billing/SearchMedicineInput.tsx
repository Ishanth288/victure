
import { useState, useCallback, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, Loader2, Package } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { CartItem } from "@/types/billing";
import { debounce } from "lodash";

interface Medicine {
  id: number;
  name: string;
  ndc: string | null;
  generic_name: string | null;
  dosage_form: string | null;
  strength: string | null;
  unit_cost: number | null;
  selling_price: number | null;
  quantity: number;
  manufacturer: string | null;
}

interface SearchMedicineInputProps {
  onAddItem: (item: CartItem) => void;
  cartItems: CartItem[];
}

export function SearchMedicineInput({ onAddItem, cartItems }: SearchMedicineInputProps) {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Medicine[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const searchMedicines = useCallback(
    debounce(async (query: string) => {
      if (!query.trim()) {
        setSearchResults([]);
        setShowResults(false);
        setIsSearching(false);
        return;
      }

      setIsSearching(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          throw new Error("User not authenticated");
        }

        const searchTerm = `%${query.toLowerCase()}%`;
        
        // Enhanced search including NDC field
        const { data, error } = await supabase
          .from("inventory")
          .select("*")
          .eq("user_id", user.id)
          .or(`name.ilike.${searchTerm},generic_name.ilike.${searchTerm},ndc.ilike.${searchTerm},manufacturer.ilike.${searchTerm}`)
          .gt("quantity", 0)
          .order("name");

        if (error) throw error;

        setSearchResults(data || []);
        setShowResults(true);
      } catch (error) {
        console.error("Error searching medicines:", error);
        toast({
          title: "Search Error",
          description: "Failed to search medicines",
          variant: "destructive",
        });
      } finally {
        setIsSearching(false);
      }
    }, 300),
    [toast]
  );

  useEffect(() => {
    searchMedicines(searchQuery);
  }, [searchQuery, searchMedicines]);

  const handleAddToCart = (medicine: Medicine) => {
    if (!medicine.selling_price) {
      toast({
        title: "No Price Set",
        description: "This medicine doesn't have a selling price set",
        variant: "destructive",
      });
      return;
    }

    const existingItem = cartItems.find(item => item.id === medicine.id);
    if (existingItem) {
      toast({
        title: "Already Added",
        description: "This medicine is already in your cart",
        variant: "destructive",
      });
      return;
    }

    const cartItem: CartItem = {
      id: medicine.id,
      name: medicine.name,
      ndc: medicine.ndc || "N/A",
      unit_cost: medicine.selling_price,
      quantity: 1,
      total: medicine.selling_price,
      available_quantity: medicine.quantity,
    };

    onAddItem(cartItem);
    toast({
      title: "Added to Cart",
      description: `${medicine.name} added to cart`,
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    
    if (!value.trim()) {
      setShowResults(false);
      setSearchResults([]);
    }
  };

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Search medicines by name, generic name, NDC, or manufacturer..."
            value={searchQuery}
            onChange={handleInputChange}
            className="pl-10 pr-16"
          />
          {isSearching && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center">
              <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
              <span className="text-xs text-gray-500 ml-2">Searching...</span>
            </div>
          )}
        </div>
      </div>

      {/* Search Results Area - Main Content (not dropdown) */}
      {showResults && (
        <div className="border rounded-lg bg-white min-h-[400px]">
          <div className="p-4 border-b bg-gray-50">
            <h3 className="text-sm font-medium text-gray-700">
              Search Results ({searchResults.length} found)
            </h3>
          </div>
          
          <div className="max-h-96 overflow-y-auto">
            {searchResults.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Package className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p className="text-sm">No medicines found matching your search</p>
                <p className="text-xs text-gray-400 mt-1">
                  Try searching by medicine name, generic name, NDC, or manufacturer
                </p>
              </div>
            ) : (
              <div className="divide-y">
                {searchResults.map((medicine) => (
                  <Card key={medicine.id} className="border-0 rounded-none shadow-none">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-medium text-gray-900 truncate">
                              {medicine.name}
                            </h4>
                            {medicine.ndc && medicine.ndc !== "N/A" && (
                              <Badge variant="outline" className="text-xs">
                                NDC: {medicine.ndc}
                              </Badge>
                            )}
                          </div>
                          
                          <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                            {medicine.generic_name && (
                              <div>
                                <span className="font-medium">Generic:</span> {medicine.generic_name}
                              </div>
                            )}
                            {medicine.manufacturer && (
                              <div>
                                <span className="font-medium">Manufacturer:</span> {medicine.manufacturer}
                              </div>
                            )}
                            {medicine.dosage_form && (
                              <div>
                                <span className="font-medium">Form:</span> {medicine.dosage_form}
                              </div>
                            )}
                            {medicine.strength && (
                              <div>
                                <span className="font-medium">Strength:</span> {medicine.strength}
                              </div>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-4 mt-2 text-sm">
                            <span className="text-green-600 font-medium">
                              ₹{medicine.selling_price?.toFixed(2) || "N/A"}
                            </span>
                            <Badge 
                              variant={medicine.quantity > 10 ? "default" : "destructive"}
                              className="text-xs"
                            >
                              Stock: {medicine.quantity}
                            </Badge>
                          </div>
                        </div>
                        
                        <div className="ml-4">
                          <Button
                            size="sm"
                            onClick={() => handleAddToCart(medicine)}
                            disabled={!medicine.selling_price || medicine.quantity === 0}
                            className="h-8 px-3"
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            Add
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
