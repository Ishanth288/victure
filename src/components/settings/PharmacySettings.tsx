
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
        // Update document title with new pharmacy name
        document.title = `${data.pharmacy_name} - Dashboard`;
      }
    } catch (error: any) {
      console.error("Error fetching pharmacy data:", error);
      toast.error(error.message);
    }
  };

  const handlePharmacyUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    console.log("Starting pharmacy update...");

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.id) {
        throw new Error("No user found");
      }

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

      console.log("Updating pharmacy data:", updatedData);

      const { error } = await supabase
        .from('profiles')
        .update(updatedData)
        .eq('id', session.user.id);

      if (error) throw error;

      // Update local state
      setPharmacyData(updatedData);
      
      // Update document title
      document.title = `${updatedData.pharmacy_name} - Dashboard`;
      
      console.log("Pharmacy update successful");
      toast.success("Pharmacy details updated successfully");
    } catch (error: any) {
      console.error("Error updating pharmacy:", error);
      toast.error(error.message || "Failed to update pharmacy details");
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
        <form onSubmit={handlePharmacyUpdate} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="pharmacyName">Pharmacy Name</Label>
            <Input 
              id="pharmacyName" 
              name="pharmacyName" 
              value={pharmacyData.pharmacy_name}
              onChange={handleInputChange}
              required 
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ownerName">Owner Name</Label>
            <Input 
              id="ownerName" 
              name="ownerName" 
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
