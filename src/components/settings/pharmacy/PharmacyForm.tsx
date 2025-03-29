
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { PharmacyData } from "./types";

interface PharmacyFormProps {
  pharmacyData: PharmacyData;
  onUpdateSuccess: (updatedData: PharmacyData) => void;
}

export function PharmacyForm({ pharmacyData, onUpdateSuccess }: PharmacyFormProps) {
  const [formData, setFormData] = useState<PharmacyData>(pharmacyData);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handlePharmacyUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.id) {
        throw new Error("No user found");
      }

      const { error } = await supabase
        .from('profiles')
        .update(formData)
        .eq('id', session.user.id);

      if (error) throw error;

      updateTitle(formData.pharmacy_name);
      
      onUpdateSuccess(formData);
      
      toast({
        title: "Success",
        description: "Pharmacy details updated successfully"
      });
    } catch (error: any) {
      console.error("Error updating pharmacy:", error);
      
      toast({
        title: "Error",
        description: error.message || "Failed to update pharmacy details",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateTitle = (pharmacyName: string) => {
    document.title = `${pharmacyName} - Dashboard`;
    // Update pharmacy name in parent component via localStorage
    localStorage.setItem('pharmacyName', pharmacyName);
    // Dispatch an event to notify other components
    window.dispatchEvent(new Event('pharmacyNameUpdated'));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <form onSubmit={handlePharmacyUpdate} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="pharmacy_name">Pharmacy Name</Label>
        <Input 
          id="pharmacy_name" 
          name="pharmacy_name" 
          value={formData.pharmacy_name}
          onChange={handleInputChange}
          required 
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="owner_name">Owner Name</Label>
        <Input 
          id="owner_name" 
          name="owner_name" 
          value={formData.owner_name}
          onChange={handleInputChange}
          required 
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="address">Address</Label>
        <Input 
          id="address" 
          name="address" 
          value={formData.address}
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
            value={formData.city}
            onChange={handleInputChange}
            required 
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="state">State</Label>
          <Input 
            id="state" 
            name="state" 
            value={formData.state}
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
            value={formData.pincode}
            onChange={handleInputChange}
            required 
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="gstin">GSTIN</Label>
          <Input 
            id="gstin" 
            name="gstin" 
            value={formData.gstin || ""}
            onChange={handleInputChange}
          />
        </div>
      </div>
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Updating..." : "Update Pharmacy Details"}
      </Button>
    </form>
  );
}
