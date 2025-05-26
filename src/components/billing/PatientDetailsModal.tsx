
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface PatientDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (prescriptionId: number) => void;
}

export function PatientDetailsModal({
  open,
  onOpenChange,
  onSuccess,
}: PatientDetailsModalProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    patientName: "",
    phoneNumber: "",
    doctorName: "",
  });

  const generateUserScopedPrescriptionNumber = async (userId: string): Promise<string> => {
    try {
      // Get the highest prescription number for this user
      const { data: maxPrescription, error } = await supabase
        .from("prescriptions")
        .select("prescription_number")
        .eq("user_id", userId)
        .order("prescription_number", { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
        throw error;
      }

      let nextNumber = 1;
      if (maxPrescription?.prescription_number) {
        // Extract number from prescription number (assuming format like "PRE-123" or just "123")
        const numberMatch = maxPrescription.prescription_number.match(/\d+/);
        if (numberMatch) {
          nextNumber = parseInt(numberMatch[0]) + 1;
        }
      }

      return `PRE-${nextNumber}`;
    } catch (error) {
      console.error("Error generating prescription number:", error);
      // Fallback to timestamp-based number if query fails
      return `PRE-${Date.now()}`;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("No authenticated user found");
      }

      // Create patient
      const { data: patientData, error: patientError } = await supabase
        .from("patients")
        .insert({
          name: formData.patientName,
          phone_number: formData.phoneNumber,
          user_id: user.id
        })
        .select()
        .single();

      if (patientError) throw patientError;

      // Generate user-scoped prescription number
      const prescriptionNumber = await generateUserScopedPrescriptionNumber(user.id);

      // Create prescription with user-scoped number
      const { data: prescriptionData, error: prescriptionError } = await supabase
        .from("prescriptions")
        .insert({
          prescription_number: prescriptionNumber,
          patient_id: patientData.id,
          doctor_name: formData.doctorName,
          user_id: user.id
        })
        .select()
        .single();

      if (prescriptionError) throw prescriptionError;

      toast({
        title: "Success",
        description: `Patient details saved successfully. Prescription ${prescriptionNumber} created.`,
      });

      onSuccess(prescriptionData.id);
    } catch (error) {
      console.error("Error saving patient details:", error);
      toast({
        title: "Error",
        description: "Failed to save patient details",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Patient Details</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="patientName">Patient Name</Label>
            <Input
              id="patientName"
              value={formData.patientName}
              onChange={(e) =>
                setFormData({ ...formData, patientName: e.target.value })
              }
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phoneNumber">Phone Number</Label>
            <Input
              id="phoneNumber"
              type="tel"
              value={formData.phoneNumber}
              onChange={(e) =>
                setFormData({ ...formData, phoneNumber: e.target.value })
              }
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="doctorName">Doctor Name</Label>
            <Input
              id="doctorName"
              value={formData.doctorName}
              onChange={(e) =>
                setFormData({ ...formData, doctorName: e.target.value })
              }
              required
            />
          </div>
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : "Start Billing"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
