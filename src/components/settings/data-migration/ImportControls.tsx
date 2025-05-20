
import React from 'react';
import { ArrowRight, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ImportControlsProps } from './types';

export const ImportControls: React.FC<ImportControlsProps> = ({
  onStartImport,
  previewItems,
  isImporting,
  selectedFields,
  migrationMode
}) => {
  const getRequiredFields = () => {
    if (migrationMode === 'Inventory') {
      return ['name'];
    } else if (migrationMode === 'Patients') {
      return ['name', 'phone_number'];
    } else if (migrationMode === 'Prescriptions') {
      return ['prescription_number', 'doctor_name', 'date'];
    }
    return [];
  };

  const requiredFields = getRequiredFields();
  const mappedFields = Object.values(selectedFields);
  const areRequiredFieldsMapped = requiredFields.every(field => mappedFields.includes(field));

  return (
    <div className="space-y-4 mt-4">
      {!areRequiredFieldsMapped && (
        <Alert variant="destructive" className="bg-red-50">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Missing Required Fields</AlertTitle>
          <AlertDescription>
            Please map all required fields before importing.
            {migrationMode === 'Inventory' && " Medicine Name is required."}
            {migrationMode === 'Patients' && " Patient Name and Phone Number are required."}
            {migrationMode === 'Prescriptions' && " Prescription Number, Doctor Name, and Date are required."}
          </AlertDescription>
        </Alert>
      )}
      
      <div className="flex justify-end">
        <Button 
          disabled={isImporting || !areRequiredFieldsMapped || previewItems.length === 0} 
          onClick={onStartImport}
          className="flex items-center"
        >
          Import {previewItems.length} Items
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};
