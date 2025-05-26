
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { User, Phone, UserCheck, Sparkles } from "lucide-react";

interface PatientDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (prescriptionId: number, patientData?: any) => void;
  prescriptionNumber?: string;
}

export function PatientDetailsModal({
  open,
  onOpenChange,
  onSuccess,
  prescriptionNumber,
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
      const { data: maxPrescription, error } = await supabase
        .from("prescriptions")
        .select("prescription_number")
        .eq("user_id", userId)
        .order("prescription_number", { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      let nextNumber = 1;
      if (maxPrescription?.prescription_number) {
        const numberMatch = maxPrescription.prescription_number.match(/\d+/);
        if (numberMatch) {
          nextNumber = parseInt(numberMatch[0]) + 1;
        }
      }

      return `PRE-${nextNumber}`;
    } catch (error) {
      console.error("Error generating prescription number:", error);
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

      // Generate or use provided prescription number
      const finalPrescriptionNumber = prescriptionNumber || await generateUserScopedPrescriptionNumber(user.id);

      // Create prescription with user-scoped number
      const { data: prescriptionData, error: prescriptionError } = await supabase
        .from("prescriptions")
        .insert({
          prescription_number: finalPrescriptionNumber,
          patient_id: patientData.id,
          doctor_name: formData.doctorName,
          user_id: user.id
        })
        .select()
        .single();

      if (prescriptionError) throw prescriptionError;

      toast({
        title: "Success",
        description: `Patient details saved successfully. Prescription ${finalPrescriptionNumber} created.`,
      });

      onSuccess(prescriptionData.id, {
        name: formData.patientName,
        phone: formData.phoneNumber,
        prescriptionNumber: finalPrescriptionNumber,
        doctorName: formData.doctorName
      });
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
      <DialogContent className="sm:max-w-md border-0 p-0 overflow-hidden bg-gradient-to-br from-green-50 via-white to-blue-50">
        <div className="bg-white/80 backdrop-blur-sm rounded-lg shadow-2xl">
          <DialogHeader className="p-6 pb-4 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-t-lg">
            <DialogTitle className="flex items-center text-xl font-semibold">
              <Sparkles className="w-6 h-6 mr-2" />
              Patient Details
            </DialogTitle>
            <p className="text-green-100 text-sm mt-1">
              {prescriptionNumber ? `For Prescription ${prescriptionNumber}` : "Create new prescription"}
            </p>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            <div className="space-y-2">
              <Label htmlFor="patientName" className="text-sm font-semibold text-gray-700 flex items-center">
                <User className="w-4 h-4 mr-2 text-green-600" />
                Patient Name
              </Label>
              <Input
                id="patientName"
                value={formData.patientName}
                onChange={(e) =>
                  setFormData({ ...formData, patientName: e.target.value })
                }
                className="h-12 border-2 border-gray-200 focus:border-green-500 rounded-lg px-4 bg-white/50"
                placeholder="Enter patient's full name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phoneNumber" className="text-sm font-semibold text-gray-700 flex items-center">
                <Phone className="w-4 h-4 mr-2 text-blue-600" />
                Phone Number
              </Label>
              <Input
                id="phoneNumber"
                type="tel"
                value={formData.phoneNumber}
                onChange={(e) =>
                  setFormData({ ...formData, phoneNumber: e.target.value })
                }
                className="h-12 border-2 border-gray-200 focus:border-blue-500 rounded-lg px-4 bg-white/50"
                placeholder="Enter contact number"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="doctorName" className="text-sm font-semibold text-gray-700 flex items-center">
                <UserCheck className="w-4 h-4 mr-2 text-purple-600" />
                Doctor Name
              </Label>
              <Input
                id="doctorName"
                value={formData.doctorName}
                onChange={(e) =>
                  setFormData({ ...formData, doctorName: e.target.value })
                }
                className="h-12 border-2 border-gray-200 focus:border-purple-500 rounded-lg px-4 bg-white/50"
                placeholder="Enter prescribing doctor's name"
                required
              />
            </div>

            <Button 
              type="submit" 
              className="w-full h-12 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white font-semibold rounded-lg shadow-lg transition-all duration-200"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                  Creating...
                </div>
              ) : (
                "Start Billing"
              )}
            </Button>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
