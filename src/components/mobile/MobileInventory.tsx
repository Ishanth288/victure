
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
  ArrowLeft,
  Filter,
  MoreVertical,
  TrendingUp,
  TrendingDown
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
  category?: string;
}

export function MobileInventory() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isScannerOpen, openScanner, closeScanner, processMedicine } = useMobileScanner();
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [filteredInventory, setFilteredInventory] = useState<InventoryItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [filterType, setFilterType] = useState<'all' | 'low-stock' | 'expired'>('all');

  useEffect(() => {
    fetchInventory();
  }, []);

  useEffect(() => {
    filterInventory();
  }, [searchQuery, inventory, filterType]);

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
    let filtered = inventory;

    // Apply text search
    if (searchQuery) {
      filtered = filtered.filter(item =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.generic_name && item.generic_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (item.manufacturer && item.manufacturer.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    // Apply type filter
    if (filterType === 'low-stock') {
      filtered = filtered.filter(item => item.quantity <= item.reorder_point);
    } else if (filterType === 'expired') {
      const today = new Date();
      filtered = filtered.filter(item => 
        item.expiry_date && new Date(item.expiry_date) < today
      );
    }

    setFilteredInventory(filtered);
  };

  const handleScannerResult = async (medicine: any) => {
    await processMedicine(medicine);
    await fetchInventory();
  };

  const getStockStatus = (item: InventoryItem) => {
    if (item.quantity === 0) return { 
      status: "Out of Stock", 
      color: "bg-red-500", 
      textColor: "text-red-700",
      bgColor: "bg-red-50",
      icon: TrendingDown
    };
    if (item.quantity <= item.reorder_point) return { 
      status: "Low Stock", 
      color: "bg-amber-500",
      textColor: "text-amber-700",
      bgColor: "bg-amber-50",
      icon: AlertTriangle
    };
    return { 
      status: "In Stock", 
      color: "bg-teal-500",
      textColor: "text-teal-700",
      bgColor: "bg-teal-50",
      icon: TrendingUp
    };
  };

  const isExpiringSoon = (expiryDate?: string) => {
    if (!expiryDate) return false;
    const expiry = new Date(expiryDate);
    const today = new Date();
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 30 && diffDays > 0;
  };

  const handleBack = async () => {
    await hapticFeedback('light');
    navigate(-1);
  };

  const filterButtons = [
    { key: 'all', label: 'All Items', count: inventory.length },
    { key: 'low-stock', label: 'Low Stock', count: inventory.filter(i => i.quantity <= i.reorder_point).length },
    { key: 'expired', label: 'Expired', count: inventory.filter(i => i.expiry_date && new Date(i.expiry_date) < new Date()).length }
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading inventory...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-br from-teal-500 to-teal-600 text-white">
        <div className="p-6 pb-8">
          <div className="flex items-center justify-between mb-6">
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
                <p className="text-teal-100 text-sm">{inventory.length} total items</p>
              </div>
            </div>
            <Button
              onClick={openScanner}
              className="bg-white/20 hover:bg-white/30 text-white backdrop-blur-sm"
            >
              <Camera className="h-4 w-4 mr-2" />
              Scan
            </Button>
          </div>

          {/* Search Bar */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white/70" />
            <Input
              placeholder="Search medicines, manufacturers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/70 rounded-xl"
            />
          </div>

          {/* Filter Buttons */}
          <div className="flex space-x-2 overflow-x-auto pb-2">
            {filterButtons.map((filter) => (
              <Button
                key={filter.key}
                variant={filterType === filter.key ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setFilterType(filter.key as any)}
                className={`flex-shrink-0 ${
                  filterType === filter.key 
                    ? "bg-white text-teal-600" 
                    : "text-white hover:bg-white/10"
                }`}
              >
                {filter.label} {filter.count > 0 && `(${filter.count})`}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Inventory List */}
      <div className="px-6 -mt-4 space-y-4 pb-6">
        {filteredInventory.length === 0 ? (
          <Card className="text-center py-12 shadow-lg border-0">
            <CardContent>
              <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {searchQuery ? "No items found" : "No inventory items"}
              </h3>
              <p className="text-gray-500 mb-6">
                {searchQuery 
                  ? "Try adjusting your search terms" 
                  : "Start by scanning or adding your first medicine"
                }
              </p>
              {!searchQuery && (
                <Button onClick={openScanner} className="bg-teal-500 hover:bg-teal-600">
                  <Camera className="h-4 w-4 mr-2" />
                  Scan Medicine
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          filteredInventory.map((item) => {
            const stockStatus = getStockStatus(item);
            const expiringSoon = isExpiringSoon(item.expiry_date);
            
            return (
              <Card key={item.id} className="shadow-md hover:shadow-lg transition-all border-0">
                <CardContent className="p-5">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-lg text-gray-900 mb-1 truncate">{item.name}</h3>
                      {item.generic_name && (
                        <p className="text-sm text-gray-600 mb-1">{item.generic_name}</p>
                      )}
                      {item.strength && (
                        <p className="text-sm font-medium text-gray-700">{item.strength}</p>
                      )}
                    </div>
                    <div className="flex items-center space-x-2 ml-3">
                      <Badge className={`${stockStatus.color} text-white text-xs px-2 py-1`}>
                        {stockStatus.status}
                      </Badge>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className={`p-3 rounded-xl ${stockStatus.bgColor}`}>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Quantity</p>
                          <p className={`text-xl font-bold ${stockStatus.textColor}`}>{item.quantity}</p>
                        </div>
                        <stockStatus.icon className={`h-5 w-5 ${stockStatus.textColor}`} />
                      </div>
                    </div>
                    <div className="p-3 rounded-xl bg-gray-50">
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Unit Cost</p>
                      <p className="text-xl font-bold text-gray-900">₹{item.unit_cost}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                    <div>
                      <p className="text-gray-500 font-medium">Selling Price</p>
                      <p className="font-bold text-gray-900">₹{item.selling_price || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 font-medium">Reorder Point</p>
                      <p className="font-bold text-gray-900">{item.reorder_point}</p>
                    </div>
                  </div>

                  {item.manufacturer && (
                    <div className="mb-3">
                      <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Manufacturer</p>
                      <p className="text-sm font-medium text-gray-700">{item.manufacturer}</p>
                    </div>
                  )}

                  {/* Alerts Section */}
                  <div className="space-y-2">
                    {item.quantity <= item.reorder_point && (
                      <div className="flex items-center space-x-2 text-amber-700 bg-amber-50 p-2 rounded-lg">
                        <AlertTriangle className="h-4 w-4" />
                        <span className="text-sm font-medium">Reorder required</span>
                      </div>
                    )}
                    
                    {expiringSoon && (
                      <div className="flex items-center space-x-2 text-orange-700 bg-orange-50 p-2 rounded-lg">
                        <AlertTriangle className="h-4 w-4" />
                        <span className="text-sm font-medium">Expires soon</span>
                      </div>
                    )}
                  </div>
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
