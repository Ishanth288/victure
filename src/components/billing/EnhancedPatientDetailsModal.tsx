import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { User, Phone, Stethoscope, Save, X, UserPlus } from "lucide-react";

interface PatientModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (prescriptionId: number, patientData?: any) => void;
}

export function EnhancedPatientDetailsModal({
  open,
  onOpenChange,
  onSuccess,
}: PatientModalProps) {
  const { toast } = useToast();
  
  // Fresh state - no default values
  const [patientName, setPatientName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [doctorName, setDoctorName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  
  // Force complete reset when modal opens/closes
  useEffect(() => {
    if (open) {
      console.log("🔄 FRESH MODAL OPENED - Resetting all fields");
      setPatientName("");
      setPhoneNumber("");
      setDoctorName("");
      setErrors({});
      setIsLoading(false);
    }
  }, [open]);

  // Clear any stored data on component mount
  useEffect(() => {
    console.log("🧹 COMPONENT MOUNTED - Clearing storage");
    localStorage.removeItem('patientFormData');
    localStorage.removeItem('billingFormData');
    localStorage.removeItem('lastPatientData');
  }, []);

  // Input validation
  const validateInputs = () => {
    const newErrors: {[key: string]: string} = {};
    
    if (!patientName.trim()) {
      newErrors.patientName = "Patient name is required";
    }
    
    if (!phoneNumber.trim()) {
      newErrors.phoneNumber = "Phone number is required";
    } else if (phoneNumber.length < 10) {
      newErrors.phoneNumber = "Phone number must be at least 10 digits";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Generate unique prescription number
  const generatePrescriptionNumber = async (userId: string) => {
    try {
      const timestamp = Date.now();
      const random = Math.floor(Math.random() * 1000);
      return `PRE-${userId.slice(-6)}-${timestamp}-${random}`;
    } catch (error) {
      console.error("Error generating prescription number:", error);
      return `PRE-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    }
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!validateInputs()) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields correctly",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      console.log("🚀 STARTING FRESH PRESCRIPTION CREATION");
      console.log("📝 NEW FORM DATA:", {
        name: patientName.trim(),
        phone: phoneNumber.trim(),
        doctor: doctorName.trim() || "Not Specified"
      });

      // Get authenticated user
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        throw new Error("Authentication failed. Please refresh and try again.");
      }

      console.log("✅ USER AUTHENTICATED:", user.id);

      // Clean the form data
      const cleanName = patientName.trim();
      const cleanPhone = phoneNumber.replace(/\D/g, "");
      const cleanDoctor = doctorName.trim() || "Not Specified";

      // Create new patient (always create new - no conflicts)
      console.log("🆕 CREATING BRAND NEW PATIENT");
      
      const { data: newPatient, error: patientError } = await supabase
        .from("patients")
        .insert({
          name: cleanName,
          phone_number: cleanPhone,
          user_id: user.id,
          status: 'active'
        })
        .select("id, name, phone_number")
        .single();

      if (patientError) {
        console.error("❌ PATIENT CREATION FAILED:", patientError);
        throw new Error(`Failed to create patient: ${patientError.message}`);
      }

      console.log("✅ NEW PATIENT CREATED:", newPatient);

      // Generate unique prescription number
      const prescriptionNumber = await generatePrescriptionNumber(user.id);
      console.log("📋 GENERATED PRESCRIPTION NUMBER:", prescriptionNumber);

      // Create new prescription
      const { data: newPrescription, error: prescriptionError } = await supabase
        .from("prescriptions")
        .insert({
          prescription_number: prescriptionNumber,
          patient_id: newPatient.id,
          doctor_name: cleanDoctor,
          user_id: user.id,
          date: new Date().toISOString().split('T')[0],
          status: 'active'
        })
        .select("id, prescription_number")
        .single();

      if (prescriptionError) {
        console.error("❌ PRESCRIPTION CREATION FAILED:", prescriptionError);
        throw new Error(`Failed to create prescription: ${prescriptionError.message}`);
      }

      console.log("✅ NEW PRESCRIPTION CREATED:", newPrescription);

      // Success!
      const successData = {
        id: newPatient.id,
        name: cleanName,
        phone_number: cleanPhone,
        prescriptionNumber: prescriptionNumber,
        doctorName: cleanDoctor
      };

      console.log("🎉 SUCCESS - CALLING PARENT WITH:", successData);

      toast({
        title: "Prescription Created!",
        description: `Now add medicines for ${cleanName}`,
      });

      // Pass data to parent - DON'T close modal, let parent handle it
      onSuccess(newPrescription.id, successData);
      
      // Note: NOT closing modal here - let the parent (billing page) handle the workflow

    } catch (error: any) {
      console.error("💥 ERROR:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to create prescription",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    console.log("🔄 MODAL CLOSING - Clearing all data");
    setPatientName("");
    setPhoneNumber("");
    setDoctorName("");
    setErrors({});
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md mx-auto">
        <Card className="border-none shadow-none">
          <DialogHeader className="space-y-3 pb-6">
            <DialogTitle className="text-2xl font-bold text-center text-gray-800 flex items-center justify-center">
              <UserPlus className="w-6 h-6 mr-2 text-blue-600" />
              New Prescription
            </DialogTitle>
            <p className="text-gray-600 text-center text-sm">
              Enter patient details to start billing
            </p>
          </DialogHeader>

          <CardContent className="space-y-6 px-6 pb-6">
            {/* Patient Name Field */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-gray-700 flex items-center">
                <User className="w-4 h-4 mr-2 text-blue-500" />
                Patient Name *
              </Label>
              <Input
                value={patientName}
                onChange={(e) => {
                  setPatientName(e.target.value);
                  if (errors.patientName) {
                    setErrors(prev => ({ ...prev, patientName: "" }));
                  }
                }}
                placeholder="Enter patient's full name"
                className={`h-11 ${errors.patientName ? 'border-red-300 focus:border-red-500' : 'border-gray-300 focus:border-blue-500'}`}
                disabled={isLoading}
              />
              {errors.patientName && (
                <p className="text-red-500 text-xs">{errors.patientName}</p>
              )}
            </div>

            {/* Phone Number Field */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-gray-700 flex items-center">
                <Phone className="w-4 h-4 mr-2 text-green-500" />
                Phone Number *
              </Label>
              <Input
                value={phoneNumber}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, "");
                  setPhoneNumber(value);
                  if (errors.phoneNumber) {
                    setErrors(prev => ({ ...prev, phoneNumber: "" }));
                  }
                }}
                placeholder="Enter 10-digit phone number"
                className={`h-11 ${errors.phoneNumber ? 'border-red-300 focus:border-red-500' : 'border-gray-300 focus:border-green-500'}`}
                disabled={isLoading}
              />
              {errors.phoneNumber && (
                <p className="text-red-500 text-xs">{errors.phoneNumber}</p>
              )}
            </div>

            {/* Doctor Name Field */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-gray-700 flex items-center">
                <Stethoscope className="w-4 h-4 mr-2 text-purple-500" />
                Doctor Name <span className="text-gray-400">(Optional)</span>
              </Label>
              <Input
                value={doctorName}
                onChange={(e) => setDoctorName(e.target.value)}
                placeholder="Enter prescribing doctor's name"
                className="h-11 border-gray-300 focus:border-purple-500"
                disabled={isLoading}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-3 pt-4">
              <Button
                variant="outline"
                onClick={handleClose}
                className="flex-1 h-11"
                disabled={isLoading}
              >
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
              
              <Button
                onClick={handleSubmit}
                className="flex-1 h-11 bg-blue-600 hover:bg-blue-700"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                    Creating...
                  </div>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Create Prescription
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
}
