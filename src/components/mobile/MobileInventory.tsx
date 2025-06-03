
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useMobileScanner } from "@/hooks/useMobileScanner";
import { CameraScanner } from "./CameraScanner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  Camera, 
  Package, 
  AlertTriangle,
  Plus,
  Edit,
  ArrowLeft
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { hapticFeedback } from "@/utils/mobileUtils";

interface InventoryItem {
  id: number;
  name: string;
  generic_name?: string;
  quantity: number;
  unit_cost: number;
  selling_price?: number;
  reorder_point: number;
  expiry_date?: string;
  manufacturer?: string;
  strength?: string;
}

export function MobileInventory() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isScannerOpen, openScanner, closeScanner, processMedicine } = useMobileScanner();
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [filteredInventory, setFilteredInventory] = useState<InventoryItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchInventory();
  }, []);

  useEffect(() => {
    filterInventory();
  }, [searchQuery, inventory]);

  const fetchInventory = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("inventory")
        .select("*")
        .eq("user_id", user.id)
        .order("name");

      if (error) throw error;

      setInventory(data || []);
    } catch (error) {
      console.error("Error fetching inventory:", error);
      toast({
        title: "Error",
        description: "Failed to load inventory",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filterInventory = () => {
    if (!searchQuery) {
      setFilteredInventory(inventory);
      return;
    }

    const filtered = inventory.filter(item =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.generic_name && item.generic_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.manufacturer && item.manufacturer.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    setFilteredInventory(filtered);
  };

  const handleScannerResult = async (medicine: any) => {
    await processMedicine(medicine);
    await fetchInventory(); // Refresh inventory after adding item
  };

  const getStockStatus = (item: InventoryItem) => {
    if (item.quantity === 0) return { status: "Out of Stock", color: "bg-red-500" };
    if (item.quantity <= item.reorder_point) return { status: "Low Stock", color: "bg-yellow-500" };
    return { status: "In Stock", color: "bg-green-500" };
  };

  const handleBack = async () => {
    await hapticFeedback('light');
    navigate(-1);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading inventory...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 rounded-b-3xl shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBack}
              className="text-white hover:bg-white/10 p-2"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Inventory</h1>
              <p className="text-blue-100">{inventory.length} total items</p>
            </div>
          </div>
          <Button
            onClick={openScanner}
            className="bg-white/20 hover:bg-white/30 text-white"
          >
            <Camera className="h-4 w-4 mr-2" />
            Scan
          </Button>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search medicines..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/70"
          />
        </div>
      </div>

      {/* Inventory Grid */}
      <div className="p-6 space-y-4">
        {filteredInventory.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchQuery ? "No items found" : "No inventory items"}
              </h3>
              <p className="text-gray-500 mb-4">
                {searchQuery 
                  ? "Try searching with different keywords" 
                  : "Start by scanning or adding your first medicine"
                }
              </p>
              {!searchQuery && (
                <Button onClick={openScanner} className="mt-4">
                  <Camera className="h-4 w-4 mr-2" />
                  Scan Medicine
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          filteredInventory.map((item) => {
            const stockStatus = getStockStatus(item);
            return (
              <Card key={item.id} className="shadow-md hover:shadow-lg transition-shadow">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg text-gray-900">{item.name}</h3>
                      {item.generic_name && (
                        <p className="text-sm text-gray-600">{item.generic_name}</p>
                      )}
                      {item.strength && (
                        <p className="text-sm text-gray-500">{item.strength}</p>
                      )}
                    </div>
                    <Badge className={`${stockStatus.color} text-white`}>
                      {stockStatus.status}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-gray-500">Quantity</p>
                      <p className="font-semibold">{item.quantity}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Unit Cost</p>
                      <p className="font-semibold">₹{item.unit_cost}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Selling Price</p>
                      <p className="font-semibold">₹{item.selling_price || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Reorder Point</p>
                      <p className="font-semibold">{item.reorder_point}</p>
                    </div>
                  </div>

                  {item.manufacturer && (
                    <div className="mb-3">
                      <p className="text-sm text-gray-500">Manufacturer</p>
                      <p className="text-sm font-medium">{item.manufacturer}</p>
                    </div>
                  )}

                  {item.quantity <= item.reorder_point && (
                    <div className="flex items-center space-x-2 text-yellow-600 bg-yellow-50 p-2 rounded-lg">
                      <AlertTriangle className="h-4 w-4" />
                      <span className="text-sm font-medium">Reorder required</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Camera Scanner Modal */}
      {isScannerOpen && (
        <CameraScanner
          onMedicineDetected={handleScannerResult}
          onClose={closeScanner}
        />
      )}
    </div>
  );
}
