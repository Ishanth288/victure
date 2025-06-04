import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Camera, Package, Plus, Search, Filter, Edit2, Trash2, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { MobileOptimizedWrapper } from "./MobileOptimizedWrapper";
import { hapticFeedback } from "@/utils/mobileUtils";
import CameraScanner from "./CameraScanner";

interface InventoryItem {
  id: number;
  name: string;
  generic_name?: string;
  batch_number?: string;
  expiry_date?: string;
  quantity: number;
  unit_cost: number;
  selling_price: number;
  manufacturer?: string;
  category?: string;
  strength?: string;
}

const MobileInventory: React.FC = () => {
  const { toast } = useToast();
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [showScanner, setShowScanner] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Please sign in to access inventory');
      }

      const { data, error } = await supabase
        .from('inventory')
        .select('*')
        .eq('user_id', user.id)
        .order('id', { ascending: false });

      if (error) throw error;
      setInventory(data || []);
      
      // Haptic feedback for successful load
      await hapticFeedback('light');
    } catch (error: any) {
      console.error('Error fetching inventory:', error);
      setError(error.message || 'Failed to fetch inventory items');
      toast({
        title: "Error",
        description: error.message || "Failed to fetch inventory items",
        variant: "destructive",
      });
      
      // Haptic feedback for error
      await hapticFeedback('error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleScanComplete = async (scannedData: any) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('inventory')
        .insert({
          ...scannedData,
          user_id: user.id
        })
        .select()
        .single();

      if (error) throw error;

      setInventory(prev => [data, ...prev]);
      setShowScanner(false);
      
      // Haptic feedback for success
      await hapticFeedback('success');
      
      toast({
        title: "Success",
        description: "Item added to inventory successfully",
      });
    } catch (error: any) {
      console.error('Error adding item:', error);
      
      // Haptic feedback for error
      await hapticFeedback('error');
      
      toast({
        title: "Error",
        description: error.message || "Failed to add item to inventory",
        variant: "destructive",
      });
    }
  };

  const handleRefresh = async () => {
    await hapticFeedback('light');
    await fetchInventory();
  };

  const filteredInventory = inventory.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.generic_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.manufacturer?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const lowStockItems = inventory.filter(item => item.quantity <= 10).length;
  const expiredItems = inventory.filter(item => 
    item.expiry_date && new Date(item.expiry_date) < new Date()
  ).length;

  if (showScanner) {
    return (
      <MobileOptimizedWrapper loadingText="Initializing camera...">
        <CameraScanner
          onScanComplete={handleScanComplete}
          onClose={() => setShowScanner(false)}
        />
      </MobileOptimizedWrapper>
    );
  }

  const ErrorFallback = () => (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-green-50 p-4 flex items-center justify-center">
      <Card className="w-full max-w-md border-red-200 bg-red-50/50">
        <CardContent className="p-6 text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-red-700 mb-2">
            Inventory Error
          </h3>
          <p className="text-sm text-red-600 mb-4">
            {error || 'Failed to load inventory data'}
          </p>
          <Button onClick={handleRefresh} className="w-full">
            Try Again
          </Button>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <MobileOptimizedWrapper 
      loadingText="Loading inventory..."
      errorFallback={error ? <ErrorFallback /> : undefined}
      enableHaptics={true}
    >
      <div className="min-h-screen bg-gradient-to-br from-teal-50 to-green-50 p-4 mobile-scroll-container">
        <div className="max-w-md mx-auto space-y-6">
          {/* Header */}
          <div className="text-center">
            <h1 className="text-2xl font-bold text-teal-800 mb-2">Inventory</h1>
            <p className="text-teal-600">Manage your stock efficiently</p>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <Button 
              onClick={async () => {
                await hapticFeedback('light');
                setShowScanner(true);
              }}
              className="bg-gradient-to-r from-teal-600 to-green-600 hover:from-teal-700 hover:to-green-700 text-white font-medium py-3 rounded-xl shadow-lg mobile-touch-target"
            >
              <Camera className="w-5 h-5 mr-2" />
              Scan Item
            </Button>
            <Button 
              variant="outline"
              onClick={() => hapticFeedback('light')}
              className="border-teal-200 text-teal-700 hover:bg-teal-50 font-medium py-3 rounded-xl mobile-touch-target"
            >
              <Plus className="w-5 h-5 mr-2" />
              Add Manual
            </Button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              placeholder="Search inventory..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 py-3 rounded-xl border-gray-200 focus:border-teal-500 mobile-touch-target"
            />
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-3 gap-3">
            <Card className="border-0 shadow-md bg-white/80 backdrop-blur-sm mobile-optimized">
              <CardContent className="p-4 text-center">
                <Package className="w-6 h-6 text-teal-600 mx-auto mb-2" />
                <div className="text-lg font-bold text-teal-800">{inventory.length}</div>
                <div className="text-xs text-gray-600">Total Items</div>
              </CardContent>
            </Card>
            
            <Card className="border-0 shadow-md bg-white/80 backdrop-blur-sm mobile-optimized">
              <CardContent className="p-4 text-center">
                <div className={`text-lg font-bold ${lowStockItems > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                  {lowStockItems}
                </div>
                <div className="text-xs text-gray-600">Low Stock</div>
              </CardContent>
            </Card>
            
            <Card className="border-0 shadow-md bg-white/80 backdrop-blur-sm mobile-optimized">
              <CardContent className="p-4 text-center">
                <div className={`text-lg font-bold ${expiredItems > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {expiredItems}
                </div>
                <div className="text-xs text-gray-600">Expired</div>
              </CardContent>
            </Card>
          </div>

          {/* Inventory List */}
          <div className="space-y-3">
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600 mx-auto"></div>
                <p className="text-gray-600 mt-2">Loading inventory...</p>
              </div>
            ) : filteredInventory.length === 0 ? (
              <div className="text-center py-8">
                <Package className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600">
                  {searchTerm ? 'No items match your search' : 'No items found'}
                </p>
                {!searchTerm && (
                  <Button
                    onClick={async () => {
                      await hapticFeedback('light');
                      setShowScanner(true);
                    }}
                    className="mt-4"
                    variant="outline"
                  >
                    <Camera className="w-4 h-4 mr-2" />
                    Add Your First Item
                  </Button>
                )}
              </div>
            ) : (
              filteredInventory.map((item) => (
                <Card key={item.id} className="border-0 shadow-md bg-white/80 backdrop-blur-sm mobile-optimized">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-800 text-sm">{item.name}</h3>
                        {item.generic_name && (
                          <p className="text-xs text-gray-600">{item.generic_name}</p>
                        )}
                        {item.manufacturer && (
                          <p className="text-xs text-gray-500">{item.manufacturer}</p>
                        )}
                      </div>
                      <div className="flex space-x-2">
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="p-2 mobile-touch-target"
                          onClick={() => hapticFeedback('light')}
                        >
                          <Edit2 className="w-4 h-4 text-gray-600" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="p-2 mobile-touch-target"
                          onClick={() => hapticFeedback('medium')}
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <div className="text-sm">
                        <span className="text-gray-600">Qty: </span>
                        <span className={`font-medium ${item.quantity <= 10 ? 'text-orange-600' : 'text-gray-800'}`}>
                          {item.quantity}
                        </span>
                      </div>
                      <div className="text-sm">
                        <span className="text-gray-600">Price: </span>
                        <span className="font-medium text-gray-800">₹{item.selling_price}</span>
                      </div>
                    </div>
                    
                    {item.expiry_date && (
                      <div className="mt-2">
                        <Badge 
                          variant={new Date(item.expiry_date) < new Date() ? "destructive" : "secondary"}
                          className="text-xs"
                        >
                          Exp: {new Date(item.expiry_date).toLocaleDateString()}
                        </Badge>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {/* Refresh Button */}
          {inventory.length > 0 && (
            <div className="text-center pt-4">
              <Button
                onClick={handleRefresh}
                variant="outline"
                className="mobile-touch-target"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
                ) : (
                  <Package className="w-4 h-4 mr-2" />
                )}
                Refresh Inventory
              </Button>
            </div>
          )}
        </div>
      </div>
    </MobileOptimizedWrapper>
  );
};

export default MobileInventory;
