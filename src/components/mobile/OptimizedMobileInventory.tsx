
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Camera, Package, Plus, Search, Edit2, Trash2, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import CameraScanner from "./CameraScanner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

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
  reorder_point?: number;
}

const OptimizedMobileInventory: React.FC = () => {
  const { toast } = useToast();
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [showScanner, setShowScanner] = useState(false);
  const [deleteItemId, setDeleteItemId] = useState<number | null>(null);

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    try {
      setIsLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Authentication Error",
          description: "Please log in to access inventory",
          variant: "destructive",
        });
        return;
      }

      const { data, error } = await supabase
        .from('inventory')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Supabase error:', error);
        throw new Error(`Database error: ${error.message}`);
      }
      
      setInventory(data || []);
      console.log('Successfully loaded inventory:', data?.length || 0, 'items');
    } catch (error) {
      console.error('Error fetching inventory:', error);
      toast({
        title: "Failed to Load Inventory",
        description: error instanceof Error ? error.message : "Please check your connection and try again",
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

      // Enhanced validation for scanned data
      const validatedData = {
        name: scannedData.name?.trim() || 'Unknown Medicine',
        generic_name: scannedData.generic_name?.trim() || null,
        manufacturer: scannedData.manufacturer?.trim() || null,
        batch_number: scannedData.batch_number?.trim() || null,
        expiry_date: scannedData.expiry_date || null,
        quantity: Math.max(1, parseInt(scannedData.quantity) || 1),
        unit_cost: Math.max(0, parseFloat(scannedData.unit_cost) || 0),
        selling_price: Math.max(0, parseFloat(scannedData.selling_price) || 0),
        strength: scannedData.strength?.trim() || null,
        category: scannedData.category?.trim() || null,
        user_id: user.id
      };

      const { data, error } = await supabase
        .from('inventory')
        .insert(validatedData)
        .select()
        .single();

      if (error) throw error;

      setInventory(prev => [data, ...prev]);
      setShowScanner(false);
      
      toast({
        title: "Success",
        description: `${validatedData.name} added to inventory successfully`,
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

  const handleDeleteItem = async (itemId: number) => {
    try {
      const { error } = await supabase
        .from('inventory')
        .delete()
        .eq('id', itemId);

      if (error) throw error;

      setInventory(prev => prev.filter(item => item.id !== itemId));
      toast({
        title: "Success",
        description: "Item deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting item:', error);
      toast({
        title: "Error",
        description: "Failed to delete item",
        variant: "destructive",
      });
    }
    setDeleteItemId(null);
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
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-green-50 px-4 py-6">
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
            Smart Scan
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
              <AlertTriangle className="w-6 h-6 text-orange-600 mx-auto mb-2" />
              <div className="text-lg font-bold text-orange-600">
                {inventory.filter(item => item.quantity <= (item.reorder_point || 10)).length}
              </div>
              <div className="text-xs text-gray-600">Low Stock</div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md bg-white/80 backdrop-blur-sm">
            <CardContent className="p-4 text-center">
              <div className="text-lg font-bold text-red-600">
                {inventory.filter(item => item.expiry_date && new Date(item.expiry_date) < new Date()).length}
              </div>
              <div className="text-xs text-gray-600">Expired</div>
            </CardContent>
          </Card>
        </div>

        {/* Inventory List */}
        <div className="space-y-3 pb-20">
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
                    <div className="flex-1 min-w-0 pr-3">
                      <h3 className="font-semibold text-gray-800 text-sm truncate">{item.name}</h3>
                      {item.generic_name && (
                        <p className="text-xs text-gray-600 truncate">{item.generic_name}</p>
                      )}
                      {item.manufacturer && (
                        <p className="text-xs text-gray-500 truncate">{item.manufacturer}</p>
                      )}
                    </div>
                    <div className="flex space-x-1 ml-2">
                      <Button size="sm" variant="ghost" className="h-8 w-8 p-0 hover:bg-blue-50">
                        <Edit2 className="w-4 h-4 text-blue-600" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="h-8 w-8 p-0 hover:bg-red-50"
                        onClick={() => setDeleteItemId(item.id)}
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500">Qty:</span>
                      <Badge variant={item.quantity <= (item.reorder_point || 10) ? "destructive" : "secondary"}>
                        {item.quantity}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500">Price:</span>
                      <span className="font-medium">₹{item.selling_price}</span>
                    </div>
                    {item.expiry_date && (
                      <div className="col-span-2 flex items-center justify-between">
                        <span className="text-gray-500">Expiry:</span>
                        <span className={`${new Date(item.expiry_date) < new Date() ? 'text-red-600 font-medium' : ''}`}>
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

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={!!deleteItemId} onOpenChange={() => setDeleteItemId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Item</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this item? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => deleteItemId && handleDeleteItem(deleteItemId)}
                className="bg-red-600 hover:bg-red-700"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};

export default OptimizedMobileInventory;
