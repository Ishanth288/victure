
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, CheckCircle } from "lucide-react";

interface PharmacyData {
  pharmacy_name: string;
  owner_name: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  gstin: string | null;
}

export default function PharmacySettings() {
  const [pharmacyData, setPharmacyData] = useState<PharmacyData>({
    pharmacy_name: "",
    owner_name: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    gstin: null
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'error' | 'success' | null; message: string | null }>({
    type: null,
    message: null
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
        updateTitle(data.pharmacy_name);
      }
    } catch (error: any) {
      console.error("Error fetching pharmacy data:", error);
      setStatusMessage({
        type: 'error',
        message: error.message
      });
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const updateTitle = (pharmacyName: string) => {
    document.title = `${pharmacyName} - Dashboard`;
    // Update pharmacy name in parent component via localStorage
    localStorage.setItem('pharmacyName', pharmacyName);
    // Dispatch an event to notify other components
    window.dispatchEvent(new Event('pharmacyNameUpdated'));
  };

  const handlePharmacyUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setStatusMessage({ type: null, message: null });

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.id) {
        throw new Error("No user found");
      }

      const { error } = await supabase
        .from('profiles')
        .update(pharmacyData)
        .eq('id', session.user.id);

      if (error) throw error;

      updateTitle(pharmacyData.pharmacy_name);
      
      setStatusMessage({
        type: 'success',
        message: "Pharmacy details updated successfully"
      });
      
      toast({
        title: "Success",
        description: "Pharmacy details updated successfully"
      });
    } catch (error: any) {
      console.error("Error updating pharmacy:", error);
      
      setStatusMessage({
        type: 'error',
        message: error.message || "Failed to update pharmacy details"
      });
      
      toast({
        title: "Error",
        description: error.message || "Failed to update pharmacy details",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPharmacyData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pharmacy Details</CardTitle>
        <CardDescription>Update your pharmacy information</CardDescription>
      </CardHeader>
      <CardContent>
        {statusMessage.type && (
          <Alert 
            variant={statusMessage.type === 'error' ? 'destructive' : 'default'} 
            className={`mb-4 ${statusMessage.type === 'success' ? 'bg-green-50 text-green-800 border-green-200' : ''}`}
          >
            {statusMessage.type === 'error' ? (
              <AlertCircle className="h-4 w-4" />
            ) : (
              <CheckCircle className="h-4 w-4" />
            )}
            <AlertTitle>
              {statusMessage.type === 'error' ? 'Error' : 'Success'}
            </AlertTitle>
            <AlertDescription>
              {statusMessage.message}
            </AlertDescription>
          </Alert>
        )}
        
        <form onSubmit={handlePharmacyUpdate} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="pharmacy_name">Pharmacy Name</Label>
            <Input 
              id="pharmacy_name" 
              name="pharmacy_name" 
              value={pharmacyData.pharmacy_name}
              onChange={handleInputChange}
              required 
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="owner_name">Owner Name</Label>
            <Input 
              id="owner_name" 
              name="owner_name" 
              value={pharmacyData.owner_name}
              onChange={handleInputChange}
              required 
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Input 
              id="address" 
              name="address" 
              value={pharmacyData.address}
              onChange={handleInputChange}
              required 
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input 
                id="city" 
                name="city" 
                value={pharmacyData.city}
                onChange={handleInputChange}
                required 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="state">State</Label>
              <Input 
                id="state" 
                name="state" 
                value={pharmacyData.state}
                onChange={handleInputChange}
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
                value={pharmacyData.pincode}
                onChange={handleInputChange}
                required 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gstin">GSTIN</Label>
              <Input 
                id="gstin" 
                name="gstin" 
                value={pharmacyData.gstin || ""}
                onChange={handleInputChange}
              />
            </div>
          </div>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Updating..." : "Update Pharmacy Details"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
