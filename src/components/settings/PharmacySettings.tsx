
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PharmacyForm, StatusMessage, usePharmacyData } from "./pharmacy";

export default function PharmacySettings() {
  const { 
    pharmacyData, 
    setPharmacyData, 
    statusMessage, 
    setSuccessMessage, 
    resetStatusMessage 
  } = usePharmacyData();

  const handleUpdateSuccess = (updatedData: any) => {
    setPharmacyData(updatedData);
    setSuccessMessage("Pharmacy details updated successfully");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pharmacy Details</CardTitle>
        <CardDescription>Update your pharmacy information</CardDescription>
      </CardHeader>
      <CardContent>
        <StatusMessage 
          type={statusMessage.type} 
          message={statusMessage.message} 
        />
        
        <PharmacyForm 
          pharmacyData={pharmacyData} 
          onUpdateSuccess={handleUpdateSuccess} 
        />
      </CardContent>
    </Card>
  );
}
