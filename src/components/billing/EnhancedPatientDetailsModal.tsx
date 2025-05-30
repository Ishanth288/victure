
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { User, Phone, UserCheck, Sparkles, Loader2 } from "lucide-react";

interface EnhancedPatientDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (prescriptionId: number, patientData?: any) => void;
  prescriptionNumber?: string;
}

export function EnhancedPatientDetailsModal({
  open,
  onOpenChange,
  onSuccess,
  prescriptionNumber,
}: EnhancedPatientDetailsModalProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    patientName: "",
    phoneNumber: "",
    doctorName: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.patientName.trim()) {
      newErrors.patientName = "Patient name is required";
    }
    
    if (!formData.phoneNumber.trim()) {
      newErrors.phoneNumber = "Phone number is required";
    } else if (!/^\d{10}$/.test(formData.phoneNumber.replace(/\s/g, ""))) {
      newErrors.phoneNumber = "Please enter a valid 10-digit phone number";
    }
    
    if (!formData.doctorName.trim()) {
      newErrors.doctorName = "Doctor name is required";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const generateUserScopedPrescriptionNumber = async (userId: string): Promise<string> => {
    try {
      const { data: maxPrescription, error } = await supabase
        .from("prescriptions")
        .select("prescription_number")
        .eq("user_id", userId)
        .order("prescription_number", { ascending: false })
        .limit(1)
        .maybeSingle();

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

      return `PRE-${userId.substring(0, 8)}-${nextNumber}`;
    } catch (error) {
      console.error("Error generating prescription number:", error);
      return `PRE-${Date.now()}`;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("No authenticated user found");
      }

      let patientData;
      // Check if patient already exists
      const { data: existingPatient, error: fetchPatientError } = await supabase
        .from("patients")
        .select("id")
        .eq("phone_number", formData.phoneNumber.trim())
        .eq("user_id", user.id)
        .single();

      if (fetchPatientError && fetchPatientError.code !== 'PGRST116') { // PGRST116 means no rows found
        console.error("Error fetching existing patient:", fetchPatientError);
        throw fetchPatientError;
      }

      if (existingPatient) {
        patientData = existingPatient;
        console.log("Existing patient found:", patientData);
      } else {
        // Create new patient if not found
        const { data: newPatient, error: createPatientError } = await supabase
          .from("patients")
          .insert({
            name: formData.patientName.trim(),
            phone_number: formData.phoneNumber.trim(),
            user_id: user.id
          })
          .select()
          .single();

        if (createPatientError) {
          console.error("Error creating new patient:", createPatientError);
          throw createPatientError;
        }
        patientData = newPatient;
        console.log("New patient created:", patientData);
      }

      // Generate or use provided prescription number
      const finalPrescriptionNumber = prescriptionNumber || await generateUserScopedPrescriptionNumber(user.id);
      console.log("Final prescription number:", finalPrescriptionNumber);
      console.log("Patient ID for prescription:", patientData.id);

      // Create prescription with user-scoped number
      const { data: prescriptionData, error: prescriptionError } = await supabase
        .from("prescriptions")
        .insert({
          prescription_number: finalPrescriptionNumber,
          patient_id: patientData.id,
          doctor_name: formData.doctorName.trim(),
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
        name: formData.patientName.trim(),
        phone: formData.phoneNumber.trim(),
        prescriptionNumber: finalPrescriptionNumber,
        doctorName: formData.doctorName.trim()
      });

      // Reset form
      setFormData({
        patientName: "",
        phoneNumber: "",
        doctorName: "",
      });
      setErrors({});
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
      <DialogContent className="sm:max-w-lg border-0 p-0 overflow-hidden">
        <Card className="border-0 shadow-2xl bg-gradient-to-br from-white via-blue-50/20 to-green-50/20">
          <DialogHeader className="p-6 pb-4 bg-gradient-to-r from-blue-600 via-purple-600 to-green-600 text-white rounded-t-lg">
            <DialogTitle className="flex items-center text-xl font-semibold">
              <Sparkles className="w-6 h-6 mr-2" />
              Patient Details
            </DialogTitle>
            <p className="text-blue-100 text-sm mt-1">
              {prescriptionNumber ? `For Prescription ${prescriptionNumber}` : "Create new prescription"}
            </p>
          </DialogHeader>
          
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="patientName" className="text-sm font-semibold text-gray-700 flex items-center">
                  <User className="w-4 h-4 mr-2 text-blue-600" />
                  Patient Name *
                </Label>
                <Input
                  id="patientName"
                  value={formData.patientName}
                  onChange={(e) => {
                    setFormData({ ...formData, patientName: e.target.value });
                    if (errors.patientName) setErrors({ ...errors, patientName: "" });
                  }}
                  className={`h-12 border-2 rounded-xl px-4 transition-all duration-200 ${
                    errors.patientName 
                      ? "border-red-300 focus:border-red-500 bg-red-50/50" 
                      : "border-gray-200 focus:border-blue-500 bg-white/70"
                  }`}
                  placeholder="Enter patient's full name"
                />
                {errors.patientName && (
                  <p className="text-red-500 text-xs mt-1">{errors.patientName}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phoneNumber" className="text-sm font-semibold text-gray-700 flex items-center">
                  <Phone className="w-4 h-4 mr-2 text-green-600" />
                  Phone Number *
                </Label>
                <Input
                  id="phoneNumber"
                  type="tel"
                  value={formData.phoneNumber}
                  onChange={(e) => {
                    setFormData({ ...formData, phoneNumber: e.target.value });
                    if (errors.phoneNumber) setErrors({ ...errors, phoneNumber: "" });
                  }}
                  className={`h-12 border-2 rounded-xl px-4 transition-all duration-200 ${
                    errors.phoneNumber 
                      ? "border-red-300 focus:border-red-500 bg-red-50/50" 
                      : "border-gray-200 focus:border-green-500 bg-white/70"
                  }`}
                  placeholder="Enter 10-digit contact number"
                />
                {errors.phoneNumber && (
                  <p className="text-red-500 text-xs mt-1">{errors.phoneNumber}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="doctorName" className="text-sm font-semibold text-gray-700 flex items-center">
                  <UserCheck className="w-4 h-4 mr-2 text-purple-600" />
                  Doctor Name *
                </Label>
                <Input
                  id="doctorName"
                  value={formData.doctorName}
                  onChange={(e) => {
                    setFormData({ ...formData, doctorName: e.target.value });
                    if (errors.doctorName) setErrors({ ...errors, doctorName: "" });
                  }}
                  className={`h-12 border-2 rounded-xl px-4 transition-all duration-200 ${
                    errors.doctorName 
                      ? "border-red-300 focus:border-red-500 bg-red-50/50" 
                      : "border-gray-200 focus:border-purple-500 bg-white/70"
                  }`}
                  placeholder="Enter prescribing doctor's name"
                />
                {errors.doctorName && (
                  <p className="text-red-500 text-xs mt-1">{errors.doctorName}</p>
                )}
              </div>

              <Button 
                type="submit" 
                className="w-full h-12 bg-gradient-to-r from-blue-600 via-purple-600 to-green-600 hover:from-blue-700 hover:via-purple-700 hover:to-green-700 text-white font-semibold rounded-xl shadow-lg transition-all duration-200 transform hover:scale-[1.02]"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <div className="flex items-center">
                    <Loader2 className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                    Creating Prescription...
                  </div>
                ) : (
                  "Start Billing"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
}
