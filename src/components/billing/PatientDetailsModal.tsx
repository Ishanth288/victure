
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Create patient
      const { data: patientData, error: patientError } = await supabase
        .from("patients")
        .insert([
          {
            name: formData.patientName,
            phone_number: formData.phoneNumber,
          },
        ])
        .select()
        .single();

      if (patientError) throw patientError;

      // Create prescription
      const prescriptionNumber = `PRE-${Date.now()}`;
      const { data: prescriptionData, error: prescriptionError } = await supabase
        .from("prescriptions")
        .insert([
          {
            prescription_number: prescriptionNumber,
            patient_id: patientData.id,
            doctor_name: formData.doctorName,
          },
        ])
        .select()
        .single();

      if (prescriptionError) throw prescriptionError;

      toast({
        title: "Success",
        description: "Patient details saved successfully",
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
