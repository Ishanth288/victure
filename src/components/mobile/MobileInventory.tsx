import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Camera, Package, Plus, Search, Filter, Edit2, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
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

const MobileInventory = () => {
  const { toast } = useToast();
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [showScanner, setShowScanner] = useState(false);

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    try {
      setIsLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('inventory')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setInventory(data || []);
    } catch (error) {
      console.error('Error fetching inventory:', error);
      toast({
        title: "Error",
        description: "Failed to fetch inventory items",
        variant: "destructive",
      });
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
      
      toast({
        title: "Success",
        description: "Item added to inventory successfully",
      });
    } catch (error) {
      console.error('Error adding item:', error);
      toast({
        title: "Error",
        description: "Failed to add item to inventory",
        variant: "destructive",
      });
    }
  };

  const filteredInventory = inventory.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.generic_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.manufacturer?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (showScanner) {
    return (
      <CameraScanner
        onScanComplete={handleScanComplete}
        onClose={() => setShowScanner(false)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-green-50 p-4">
      <div className="max-w-md mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-2xl font-bold text-teal-800 mb-2">Inventory</h1>
          <p className="text-teal-600">Manage your stock efficiently</p>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <Button 
            onClick={() => setShowScanner(true)}
            className="bg-gradient-to-r from-teal-600 to-green-600 hover:from-teal-700 hover:to-green-700 text-white font-medium py-3 rounded-xl shadow-lg"
          >
            <Camera className="w-5 h-5 mr-2" />
            Scan Item
          </Button>
          <Button 
            variant="outline"
            className="border-teal-200 text-teal-700 hover:bg-teal-50 font-medium py-3 rounded-xl"
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
            className="pl-10 py-3 rounded-xl border-gray-200 focus:border-teal-500"
          />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <Card className="border-0 shadow-md bg-white/80 backdrop-blur-sm">
            <CardContent className="p-4 text-center">
              <Package className="w-6 h-6 text-teal-600 mx-auto mb-2" />
              <div className="text-lg font-bold text-teal-800">{inventory.length}</div>
              <div className="text-xs text-gray-600">Total Items</div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md bg-white/80 backdrop-blur-sm">
            <CardContent className="p-4 text-center">
              <div className="text-lg font-bold text-orange-600">{inventory.filter(item => item.quantity <= 10).length}</div>
              <div className="text-xs text-gray-600">Low Stock</div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md bg-white/80 backdrop-blur-sm">
            <CardContent className="p-4 text-center">
              <div className="text-lg font-bold text-red-600">{inventory.filter(item => item.expiry_date && new Date(item.expiry_date) < new Date()).length}</div>
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
              <p className="text-gray-600">No items found</p>
            </div>
          ) : (
            filteredInventory.map((item) => (
              <Card key={item.id} className="border-0 shadow-md bg-white/80 backdrop-blur-sm">
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
                      <Button size="sm" variant="ghost" className="p-2">
                        <Edit2 className="w-4 h-4 text-gray-600" />
                      </Button>
                      <Button size="sm" variant="ghost" className="p-2">
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-gray-500">Quantity:</span>
                      <Badge variant={item.quantity <= 10 ? "destructive" : "secondary"} className="ml-1">
                        {item.quantity}
                      </Badge>
                    </div>
                    <div>
                      <span className="text-gray-500">Price:</span>
                      <span className="ml-1 font-medium">₹{item.selling_price}</span>
                    </div>
                    {item.batch_number && (
                      <div>
                        <span className="text-gray-500">Batch:</span>
                        <span className="ml-1">{item.batch_number}</span>
                      </div>
                    )}
                    {item.expiry_date && (
                      <div>
                        <span className="text-gray-500">Expiry:</span>
                        <span className={`ml-1 ${new Date(item.expiry_date) < new Date() ? 'text-red-600 font-medium' : ''}`}>
                          {new Date(item.expiry_date).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default MobileInventory;
