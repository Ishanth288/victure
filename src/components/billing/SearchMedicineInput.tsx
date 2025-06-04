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
  const [allMedicines, setAllMedicines] = useState<Medicine[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);

  // Load all medicines on component mount
  const loadAllMedicines = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error("User not authenticated for loading medicines");
        throw new Error("User not authenticated");
      }

      console.log("Loading medicines for user:", user.id);

      const { data, error } = await supabase
        .from("inventory")
        .select("*")
        .eq("user_id", user.id)
        .gt("quantity", 0)
        .order("name");

      if (error) {
        console.error("Database error loading medicines:", error);
        throw error;
      }

      console.log("Loaded medicines:", data?.length || 0, "items");
      setAllMedicines(data || []);
    } catch (error) {
      console.error("Error loading medicines:", error);
      toast({
        title: "Error",
        description: "Failed to load medicines. Please check your internet connection and try again.",
        variant: "destructive",
      });
      // Set empty array on error to prevent infinite loading
      setAllMedicines([]);
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadAllMedicines();
  }, [loadAllMedicines]);

  // Filter and prioritize medicines based on search query
  const getFilteredMedicines = useCallback(() => {
    if (!searchQuery.trim()) {
      // No search query - return all medicines
      return {
        searchResults: [],
        otherMedicines: allMedicines
      };
    }

    const query = searchQuery.toLowerCase();
    const searchResults: Medicine[] = [];
    const otherMedicines: Medicine[] = [];

    allMedicines.forEach((medicine) => {
      const matchesName = medicine.name?.toLowerCase().includes(query) || false;
      const matchesGeneric = medicine.generic_name?.toLowerCase().includes(query) || false;
      const matchesNdc = medicine.ndc?.toLowerCase().includes(query) || false;
      const matchesManufacturer = medicine.manufacturer?.toLowerCase().includes(query) || false;

      if (matchesName || matchesGeneric || matchesNdc || matchesManufacturer) {
        // Calculate match priority (exact matches first, then partial matches)
        const isExactMatch = 
          medicine.name?.toLowerCase() === query ||
          medicine.generic_name?.toLowerCase() === query ||
          medicine.ndc?.toLowerCase() === query;
        
        const isStartsWith =
          medicine.name?.toLowerCase().startsWith(query) ||
          medicine.generic_name?.toLowerCase().startsWith(query) ||
          medicine.ndc?.toLowerCase().startsWith(query);

        if (isExactMatch) {
          // Exact matches go to the top
          searchResults.unshift(medicine);
        } else if (isStartsWith) {
          // Starts with matches go next
          const exactCount = searchResults.filter(m => 
            m.name?.toLowerCase() === query ||
            m.generic_name?.toLowerCase() === query ||
            m.ndc?.toLowerCase() === query
          ).length;
          searchResults.splice(exactCount, 0, medicine);
        } else {
          // Partial matches go after
          searchResults.push(medicine);
        }
      } else {
        otherMedicines.push(medicine);
      }
    });

    return { searchResults, otherMedicines };
  }, [allMedicines, searchQuery]);

  const { searchResults, otherMedicines } = getFilteredMedicines();

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
        variant: "warning",
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
      title: "Success",
      description: `${medicine.name} added to cart`,
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    setIsSearching(!!value.trim());
  };

  const MedicineCard = ({ medicine, isSearchResult = false }: { medicine: Medicine; isSearchResult?: boolean }) => (
    <Card key={medicine.id} className={`border-0 rounded-none shadow-none ${isSearchResult ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <h4 className={`font-medium truncate ${isSearchResult ? 'text-blue-900' : 'text-gray-900'}`}>
                {medicine.name}
                {isSearchResult && <Badge variant="secondary" className="ml-2 text-xs bg-blue-100 text-blue-800">Match</Badge>}
              </h4>
              {medicine.ndc && medicine.ndc !== "N/A" && (
                <Badge variant="outline" className="text-xs">
                  NDC: {medicine.ndc}
                </Badge>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-1 text-xs text-gray-600 mb-2">
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
            <div className="flex items-center gap-4 text-sm">
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
          
          <Button
            size="sm"
            onClick={() => handleAddToCart(medicine)}
            disabled={!medicine.selling_price || medicine.quantity === 0}
            className="h-8 px-3 ml-3"
          >
            <Plus className="h-3 w-3 mr-1" />
            Add
          </Button>
        </div>
      </CardContent>
    </Card>
  );

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
            className="pl-10 pr-16 h-12 text-base"
          />
          {(isLoading || isSearching) && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center">
              <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
              <span className="text-xs text-gray-500 ml-2">
                {isLoading ? "Loading..." : "Searching..."}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Results Area */}
      <div className="border-2 border-gray-200 rounded-xl bg-white">
        {isLoading ? (
          <div className="p-8 text-center">
            <Loader2 className="h-12 w-12 mx-auto mb-3 text-gray-400 animate-spin" />
            <p className="text-sm text-gray-500">Loading medicines...</p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="p-4 border-b bg-gradient-to-r from-gray-50 to-blue-50">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-700">
                  {searchQuery.trim() ? (
                    <>
                      <span className="text-blue-600">{searchResults.length}</span> search results, 
                      <span className="text-gray-500 ml-1">{otherMedicines.length} other medicines</span>
                    </>
                  ) : (
                    `All Medicines (${allMedicines.length} available)`
                  )}
                </h3>
                {searchQuery.trim() && (
                  <Badge variant="outline" className="text-xs">
                    Showing prioritized results
                  </Badge>
                )}
              </div>
            </div>

            <div>
              {allMedicines.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <Package className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p className="text-sm">No medicines available in inventory</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Please add medicines to your inventory first
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {/* Search Results Section (if searching) */}
                  {searchQuery.trim() && searchResults.length > 0 && (
                    <>
                      <div className="p-3 bg-blue-50 border-b-2 border-blue-200">
                        <h4 className="text-sm font-semibold text-blue-800 flex items-center">
                          <Search className="h-4 w-4 mr-2" />
                          Search Results ({searchResults.length})
                        </h4>
                      </div>
                      {searchResults.map((medicine) => (
                        <MedicineCard key={`search-${medicine.id}`} medicine={medicine} isSearchResult={true} />
                      ))}
                    </>
                  )}

                  {/* Other Medicines Section */}
                  {searchQuery.trim() && otherMedicines.length > 0 && (
                    <div className="p-3 bg-gray-50 border-b border-gray-200">
                      <h4 className="text-sm font-semibold text-gray-600 flex items-center">
                        <Package className="h-4 w-4 mr-2" />
                        Other Medicines ({otherMedicines.length})
                      </h4>
                    </div>
                  )}

                  {/* Display other medicines or all medicines if not searching */}
                  {(searchQuery.trim() ? otherMedicines : allMedicines).map((medicine) => (
                    <MedicineCard key={`other-${medicine.id}`} medicine={medicine} isSearchResult={false} />
                  ))}

                  {/* No search results message */}
                  {searchQuery.trim() && searchResults.length === 0 && otherMedicines.length === 0 && (
                    <div className="p-8 text-center text-gray-500">
                      <Search className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                      <p className="text-sm">No medicines found matching "{searchQuery}"</p>
                      <p className="text-xs text-gray-400 mt-1">
                        Try searching by medicine name, generic name, NDC, or manufacturer
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
