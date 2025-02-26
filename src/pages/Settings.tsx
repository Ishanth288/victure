
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface PharmacyData {
  pharmacy_name: string;
  owner_name: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  gstin: string | null;
}

export default function Settings() {
  const [isLoading, setIsLoading] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [notificationEmail, setNotificationEmail] = useState(true);
  const [lowStockAlert, setLowStockAlert] = useState(true);
  const [expiryAlert, setExpiryAlert] = useState(true);
  const [pharmacyData, setPharmacyData] = useState<PharmacyData>({
    pharmacy_name: "",
    owner_name: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    gstin: null
  });

  useEffect(() => {
    fetchPharmacyData();
  }, []);

  const fetchPharmacyData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.id) return;

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (error) throw error;
      if (data) {
        setPharmacyData(data);
      }
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error("New passwords don't match");
      return;
    }
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ 
        password: newPassword 
      });
      if (error) throw error;
      toast.success("Password updated successfully");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePharmacyUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const updatedData: PharmacyData = {
      pharmacy_name: formData.get('pharmacyName')?.toString() || "",
      owner_name: formData.get('ownerName')?.toString() || "",
      address: formData.get('address')?.toString() || "",
      city: formData.get('city')?.toString() || "",
      state: formData.get('state')?.toString() || "",
      pincode: formData.get('pincode')?.toString() || "",
      gstin: formData.get('gstin')?.toString() || null
    };

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.id) throw new Error("No user found");

      const { error } = await supabase
        .from('profiles')
        .update(updatedData)
        .eq('id', session.user.id);

      if (error) throw error;
      toast.success("Pharmacy details updated successfully");
      setPharmacyData(updatedData);
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <h1 className="text-3xl font-bold">Settings</h1>
      
      <Tabs defaultValue="security" className="space-y-4">
        <TabsList>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="pharmacy">Pharmacy Details</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
        </TabsList>

        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>Update your password and security preferences</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePasswordChange} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <Input
                    id="currentPassword"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "Updating..." : "Update Password"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pharmacy">
          <Card>
            <CardHeader>
              <CardTitle>Pharmacy Details</CardTitle>
              <CardDescription>Update your pharmacy information</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePharmacyUpdate} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="pharmacyName">Pharmacy Name</Label>
                  <Input 
                    id="pharmacyName" 
                    name="pharmacyName" 
                    defaultValue={pharmacyData.pharmacy_name}
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ownerName">Owner Name</Label>
                  <Input 
                    id="ownerName" 
                    name="ownerName" 
                    defaultValue={pharmacyData.owner_name}
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Input 
                    id="address" 
                    name="address" 
                    defaultValue={pharmacyData.address}
                    required 
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input 
                      id="city" 
                      name="city" 
                      defaultValue={pharmacyData.city}
                      required 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state">State</Label>
                    <Input 
                      id="state" 
                      name="state" 
                      defaultValue={pharmacyData.state}
                      required 
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="pincode">PIN Code</Label>
                    <Input 
                      id="pincode" 
                      name="pincode" 
                      defaultValue={pharmacyData.pincode}
                      required 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="gstin">GSTIN</Label>
                    <Input 
                      id="gstin" 
                      name="gstin" 
                      defaultValue={pharmacyData.gstin || ""}
                    />
                  </div>
                </div>
                <Button type="submit">Update Pharmacy Details</Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>Manage your notification settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Email Notifications</h3>
                  <p className="text-sm text-gray-500">Receive updates via email</p>
                </div>
                <Button
                  variant={notificationEmail ? "default" : "outline"}
                  onClick={() => setNotificationEmail(!notificationEmail)}
                >
                  {notificationEmail ? "Enabled" : "Disabled"}
                </Button>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Low Stock Alerts</h3>
                  <p className="text-sm text-gray-500">Get notified when inventory is low</p>
                </div>
                <Button
                  variant={lowStockAlert ? "default" : "outline"}
                  onClick={() => setLowStockAlert(!lowStockAlert)}
                >
                  {lowStockAlert ? "Enabled" : "Disabled"}
                </Button>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Expiry Alerts</h3>
                  <p className="text-sm text-gray-500">Get notified about expiring medications</p>
                </div>
                <Button
                  variant={expiryAlert ? "default" : "outline"}
                  onClick={() => setExpiryAlert(!expiryAlert)}
                >
                  {expiryAlert ? "Enabled" : "Disabled"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
