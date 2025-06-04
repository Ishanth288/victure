import { useState, useEffect } from "react";
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
  const [submitAttempts, setSubmitAttempts] = useState(0);
  const [formData, setFormData] = useState({
    patientName: "",
    phoneNumber: "",
    doctorName: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Clear form when modal opens/closes to prevent stale data
  useEffect(() => {
    if (!open) {
      setFormData({
        patientName: "",
        phoneNumber: "",
        doctorName: "",
      });
      setErrors({});
      setSubmitAttempts(0);
    }
  }, [open]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.patientName.trim()) {
      newErrors.patientName = "Patient name is required";
    } else if (formData.patientName.trim().length < 2) {
      newErrors.patientName = "Patient name must be at least 2 characters";
    }
    
    if (!formData.phoneNumber.trim()) {
      newErrors.phoneNumber = "Phone number is required";
    } else {
      const cleanPhone = formData.phoneNumber.replace(/\D/g, "");
      if (cleanPhone.length !== 10) {
        newErrors.phoneNumber = "Please enter a valid 10-digit phone number";
      }
    }
    
    if (!formData.doctorName.trim()) {
      newErrors.doctorName = "Doctor name is required";
    } else if (formData.doctorName.trim().length < 2) {
      newErrors.doctorName = "Doctor name must be at least 2 characters";
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
        console.log("Max prescription found:", maxPrescription.prescription_number);
        const numberMatch = maxPrescription.prescription_number.match(/\d+/);
        if (numberMatch) {
          nextNumber = parseInt(numberMatch[0]) + 1;
          console.log("Next number calculated:", nextNumber);
        }
      }

      const newPrescriptionNumber = `PRE-${userId.slice(-8)}-${nextNumber}`;
      console.log("Generated prescription number:", newPrescriptionNumber);
      return newPrescriptionNumber;
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
    setSubmitAttempts(prev => prev + 1);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("No authenticated user found");
      }

      // Clean and validate form data
      const cleanPatientName = formData.patientName.trim();
      const cleanPhoneNumber = formData.phoneNumber.replace(/\D/g, ""); // Remove non-digits
      const cleanDoctorName = formData.doctorName.trim();

      let patientData;
      
      // First, try to find existing patient by phone number
      const { data: existingPatient, error: fetchPatientError } = await supabase
        .from("patients")
        .select("id, name, phone_number")
        .eq("phone_number", cleanPhoneNumber)
        .eq("user_id", user.id)
        .maybeSingle();

      if (fetchPatientError && fetchPatientError.code !== 'PGRST116') {
        console.error("Error fetching existing patient:", fetchPatientError);
        throw new Error(`Failed to check existing patients: ${fetchPatientError.message}`);
      }

      if (existingPatient) {
        // Update existing patient name if different
        if (existingPatient.name !== cleanPatientName) {
          const { error: updateError } = await supabase
            .from("patients")
            .update({ name: cleanPatientName })
            .eq("id", existingPatient.id);
          
          if (updateError) {
            console.warn("Failed to update patient name:", updateError);
            // Continue with existing data rather than failing
          }
        }
        
        patientData = { ...existingPatient, name: cleanPatientName };
        console.log("Using existing patient (updated):", patientData);
      } else {
        // Create new patient with retry logic
        let createAttempts = 0;
        const maxCreateAttempts = 3;
        
        while (createAttempts < maxCreateAttempts) {
          try {
            const { data: newPatient, error: createPatientError } = await supabase
              .from("patients")
              .insert({
                name: cleanPatientName,
                phone_number: cleanPhoneNumber,
                user_id: user.id,
                status: 'active'
              })
              .select("id, name, phone_number")
              .single();

            if (createPatientError) {
              throw createPatientError;
            }
            
            patientData = newPatient;
            console.log("New patient created successfully:", patientData);
            break;
          } catch (createError: any) {
            createAttempts++;
            console.error(`Patient creation attempt ${createAttempts} failed:`, createError);
            
            if (createAttempts >= maxCreateAttempts) {
              throw new Error(`Failed to create patient after ${maxCreateAttempts} attempts: ${createError.message}`);
            }
            
            // Wait a bit before retry
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }
      }

      if (!patientData || !patientData.id) {
        throw new Error("Failed to create or retrieve patient data");
      }

      // Generate prescription number with user scope
      const currentPrescriptionNumber = prescriptionNumber || await generateUserScopedPrescriptionNumber(user.id);
      
      // Create prescription with retry logic
      let prescriptionData;
      let createPrescriptionAttempts = 0;
      const maxPrescriptionAttempts = 3;
      
      while (createPrescriptionAttempts < maxPrescriptionAttempts) {
        try {
          const { data: newPrescription, error: prescriptionError } = await supabase
            .from("prescriptions")
            .insert({
              prescription_number: currentPrescriptionNumber,
              patient_id: patientData.id,
              doctor_name: cleanDoctorName,
              user_id: user.id,
              date: new Date().toISOString(),
              status: 'active'
            })
            .select("*")
            .single();

          if (prescriptionError) {
            // Handle unique constraint violation for prescription number
            if (prescriptionError.code === '23505') {
              const { data: existing, error: fetchError } = await supabase
                .from("prescriptions")
                .select("*")
                .eq("prescription_number", currentPrescriptionNumber)
                .eq("user_id", user.id)
                .single();
              
              if (!fetchError && existing) {
                console.log("Using existing prescription:", existing);
                prescriptionData = existing;
                break;
              }
            }
            
            throw prescriptionError;
          }
          
          prescriptionData = newPrescription;
          console.log("New prescription created successfully:", prescriptionData);
          break;
        } catch (prescriptionError: any) {
          createPrescriptionAttempts++;
          console.error(`Prescription creation attempt ${createPrescriptionAttempts} failed:`, prescriptionError);
          
          if (createPrescriptionAttempts >= maxPrescriptionAttempts) {
            throw new Error(`Failed to create prescription after ${maxPrescriptionAttempts} attempts: ${prescriptionError.message}`);
          }
          
          // Wait a bit before retry
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      if (!prescriptionData) {
        throw new Error("Failed to create or retrieve prescription data");
      }

      // Success feedback
      toast({
        title: "Success!",
        description: `Patient details saved and prescription ${prescriptionData.prescription_number} created successfully.`,
        variant: "default",
      });

      // Pass complete patient data to parent
      onSuccess(prescriptionData.id, {
        id: patientData.id,
        name: cleanPatientName,
        phone: cleanPhoneNumber,
        prescriptionNumber: prescriptionData.prescription_number,
        doctorName: cleanDoctorName
      });

      // Reset form on success
      setFormData({
        patientName: "",
        phoneNumber: "",
        doctorName: "",
      });
      setErrors({});
      setSubmitAttempts(0);

    } catch (error: any) {
      console.error("Error in patient details submission:", error);
      
      // Provide specific error messages based on attempt count
      let errorMessage = "Failed to save patient details. Please try again.";
      
      if (submitAttempts >= 3) {
        errorMessage = "Multiple attempts failed. Please check your connection and try again later.";
      } else if (error.message.includes("network") || error.message.includes("connection")) {
        errorMessage = "Connection issue detected. Please check your internet and try again.";
      } else if (error.message.includes("constraint")) {
        errorMessage = "Data validation error. Please check your inputs and try again.";
      }

      toast({
        title: "Error",
        description: errorMessage,
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
