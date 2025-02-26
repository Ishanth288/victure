
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import DashboardLayout from "@/components/DashboardLayout";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Plus, User, Phone, UserRound, FileText } from "lucide-react";

interface PatientDetails {
  patientName: string;
  phoneNumber: string;
  doctorName: string;
  prescriptionNumber: string;
}

export default function Billing() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [patientDetails, setPatientDetails] = useState<PatientDetails>({
    patientName: "",
    phoneNumber: "",
    doctorName: "",
    prescriptionNumber: "",
  });

  const handleStartBilling = async () => {
    if (!patientDetails.patientName || !patientDetails.phoneNumber || !patientDetails.doctorName) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      // Create patient
      const { data: patientData, error: patientError } = await supabase
        .from("patients")
        .insert([
          {
            name: patientDetails.patientName,
            phone_number: patientDetails.phoneNumber,
          },
        ])
        .select()
        .single();

      if (patientError) throw patientError;

      // Create prescription
      const { data: prescriptionData, error: prescriptionError } = await supabase
        .from("prescriptions")
        .insert([
          {
            prescription_number: patientDetails.prescriptionNumber || `PRE-${Date.now()}`,
            patient_id: patientData.id,
            doctor_name: patientDetails.doctorName,
          },
        ])
        .select()
        .single();

      if (prescriptionError) throw prescriptionError;

      // Navigate to cart page with prescription ID
      navigate(`/billing/cart/${prescriptionData.id}`);
      
      toast({
        title: "Success",
        description: "Patient details saved successfully",
      });
    } catch (error) {
      console.error("Error saving patient details:", error);
      toast({
        title: "Error",
        description: "Failed to save patient details",
        variant: "destructive",
      });
    }
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-6">
        <Card className="mb-6">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-2xl font-bold text-primary">New Bill</CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-700">
              Patient Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="patientName">Patient Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="patientName"
                      value={patientDetails.patientName}
                      onChange={(e) =>
                        setPatientDetails({ ...patientDetails, patientName: e.target.value })
                      }
                      className="pl-10"
                      placeholder="Enter patient name"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phoneNumber">Phone Number</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="phoneNumber"
                      value={patientDetails.phoneNumber}
                      onChange={(e) =>
                        setPatientDetails({ ...patientDetails, phoneNumber: e.target.value })
                      }
                      className="pl-10"
                      placeholder="Enter phone number"
                    />
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="doctorName">Doctor Name</Label>
                  <div className="relative">
                    <UserRound className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="doctorName"
                      value={patientDetails.doctorName}
                      onChange={(e) =>
                        setPatientDetails({ ...patientDetails, doctorName: e.target.value })
                      }
                      className="pl-10"
                      placeholder="Enter doctor name"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="prescriptionNumber">Prescription Number</Label>
                  <div className="relative">
                    <FileText className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="prescriptionNumber"
                      value={patientDetails.prescriptionNumber}
                      onChange={(e) =>
                        setPatientDetails({ ...patientDetails, prescriptionNumber: e.target.value })
                      }
                      className="pl-10"
                      placeholder="Enter prescription number (optional)"
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <Button 
                onClick={handleStartBilling}
                className="bg-primary hover:bg-primary/90 text-white shadow-lg hover:shadow-xl transition-all duration-200"
              >
                <Plus className="w-4 h-4 mr-2" />
                Start Billing
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
