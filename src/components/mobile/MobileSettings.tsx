
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { 
  Settings, 
  User, 
  Store, 
  Bell, 
  Shield, 
  LogOut, 
  Save,
  Phone,
  Mail,
  MapPin
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

const MobileSettings: React.FC = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [profile, setProfile] = useState({
    pharmacy_name: '',
    owner_name: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    gstin: '',
    phone: '',
    email: ''
  });
  const [notifications, setNotifications] = useState({
    lowStock: true,
    expiry: true,
    newOrders: false
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      
      if (data) {
        setProfile({
          pharmacy_name: data.pharmacy_name || '',
          owner_name: data.owner_name || '',
          address: data.address || '',
          city: data.city || '',
          state: data.state || '',
          pincode: data.pincode || '',
          gstin: data.gstin || '',
          phone: data.phone || '',
          email: user.email || ''
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const handleSaveProfile = async () => {
    try {
      setIsLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('profiles')
        .update({
          pharmacy_name: profile.pharmacy_name,
          owner_name: profile.owner_name,
          address: profile.address,
          city: profile.city,
          state: profile.state,
          pincode: profile.pincode,
          gstin: profile.gstin,
          phone: profile.phone
        })
        .eq('id', user.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Profile updated successfully",
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      navigate('/auth');
    } catch (error) {
      console.error('Error logging out:', error);
      toast({
        title: "Error",
        description: "Failed to log out",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-green-50 p-4">
      <div className="max-w-md mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-2xl font-bold text-teal-800 mb-2">Settings</h1>
          <p className="text-teal-600">Manage your preferences</p>
        </div>

        {/* Profile Section */}
        <Card className="border-0 shadow-md bg-white/80 backdrop-blur-sm">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center text-lg text-teal-800">
              <Store className="w-5 h-5 mr-2" />
              Pharmacy Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="pharmacy_name" className="text-sm font-medium">Pharmacy Name</Label>
              <Input
                id="pharmacy_name"
                value={profile.pharmacy_name}
                onChange={(e) => setProfile({...profile, pharmacy_name: e.target.value})}
                className="rounded-lg"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="owner_name" className="text-sm font-medium">Owner Name</Label>
              <Input
                id="owner_name"
                value={profile.owner_name}
                onChange={(e) => setProfile({...profile, owner_name: e.target.value})}
                className="rounded-lg"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="address" className="text-sm font-medium">Address</Label>
              <Input
                id="address"
                value={profile.address}
                onChange={(e) => setProfile({...profile, address: e.target.value})}
                className="rounded-lg"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="city" className="text-sm font-medium">City</Label>
                <Input
                  id="city"
                  value={profile.city}
                  onChange={(e) => setProfile({...profile, city: e.target.value})}
                  className="rounded-lg"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pincode" className="text-sm font-medium">Pincode</Label>
                <Input
                  id="pincode"
                  value={profile.pincode}
                  onChange={(e) => setProfile({...profile, pincode: e.target.value})}
                  className="rounded-lg"
                />
              </div>
            </div>
            
            <Button 
              onClick={handleSaveProfile}
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-teal-600 to-green-600 hover:from-teal-700 hover:to-green-700 text-white rounded-lg"
            >
              <Save className="w-4 h-4 mr-2" />
              {isLoading ? 'Saving...' : 'Save Profile'}
            </Button>
          </CardContent>
        </Card>

        {/* Notifications Section */}
        <Card className="border-0 shadow-md bg-white/80 backdrop-blur-sm">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center text-lg text-teal-800">
              <Bell className="w-5 h-5 mr-2" />
              Notifications
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="lowStock" className="text-sm font-medium">Low Stock Alerts</Label>
              <Switch
                id="lowStock"
                checked={notifications.lowStock}
                onCheckedChange={(checked) => setNotifications({...notifications, lowStock: checked})}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="expiry" className="text-sm font-medium">Expiry Notifications</Label>
              <Switch
                id="expiry"
                checked={notifications.expiry}
                onCheckedChange={(checked) => setNotifications({...notifications, expiry: checked})}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="newOrders" className="text-sm font-medium">New Order Alerts</Label>
              <Switch
                id="newOrders"
                checked={notifications.newOrders}
                onCheckedChange={(checked) => setNotifications({...notifications, newOrders: checked})}
              />
            </div>
          </CardContent>
        </Card>

        {/* Account Section */}
        <Card className="border-0 shadow-md bg-white/80 backdrop-blur-sm">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center text-lg text-teal-800">
              <User className="w-5 h-5 mr-2" />
              Account
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <Mail className="w-4 h-4 text-gray-600" />
                <span className="text-sm text-gray-700">{profile.email}</span>
              </div>
            </div>
            
            <Button 
              onClick={handleLogout}
              variant="destructive"
              className="w-full rounded-lg"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MobileSettings;
