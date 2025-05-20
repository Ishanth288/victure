
import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { autoDetectFieldMappings } from "@/utils/migrationUtils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { DataPreviewProps } from './types';

export const DataPreview: React.FC<DataPreviewProps> = ({ 
  previewItems, 
  selectedFields, 
  setSelectedFields, 
  fileHeaders, 
  migrationMode 
}) => {
  const handleAutoDetect = () => {
    const mappings = autoDetectFieldMappings(fileHeaders);
    setSelectedFields(mappings);
  };

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

  const getSelectableFields = () => {
    if (migrationMode === 'Inventory') {
      return [
        { value: 'name', label: 'Medicine Name' },
        { value: 'generic_name', label: 'Generic Name' },
        { value: 'manufacturer', label: 'Manufacturer' },
        { value: 'batch_number', label: 'Batch Number/NDC' },
        { value: 'expiry_date', label: 'Expiry Date' },
        { value: 'quantity', label: 'Quantity' },
        { value: 'unit_cost', label: 'Unit Cost' },
        { value: 'selling_price', label: 'Selling Price' },
        { value: 'schedule', label: 'Schedule' },
        { value: 'hsn_code', label: 'HSN Code' },
      ];
    } else if (migrationMode === 'Patients') {
      return [
        { value: 'name', label: 'Patient Name' },
        { value: 'phone_number', label: 'Phone Number' },
        { value: 'external_id', label: 'External ID' },
        { value: 'status', label: 'Status' },
      ];
    } else if (migrationMode === 'Prescriptions') {
      return [
        { value: 'prescription_number', label: 'Prescription Number' },
        { value: 'doctor_name', label: 'Doctor Name' },
        { value: 'date', label: 'Date' },
        { value: 'status', label: 'Status' },
      ];
    }
    return [];
  };

  const requiredFields = getRequiredFields();

  // Function to safely render cell content as string
  const formatCellContent = (value: any): string => {
    if (value === null || value === undefined) {
      return '';
    }
    if (typeof value === 'object') {
      return JSON.stringify(value);
    }
    return String(value);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Map Data Fields</h3>
        <button 
          onClick={handleAutoDetect}
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          Auto-detect fields
        </button>
      </div>
      
      <div className="overflow-x-auto max-h-[500px]">
        <Table className="border">
          <TableHeader>
            <TableRow>
              <TableHead>File Column</TableHead>
              <TableHead>Maps To Field</TableHead>
              <TableHead className="w-1/2">Preview</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {fileHeaders.map((header, index) => (
              <TableRow key={index}>
                <TableCell>{header}</TableCell>
                <TableCell>
                  <Select
                    value={selectedFields[header] || "none"}
                    onValueChange={(value) => {
                      if (value === "none") {
                        // Remove the field mapping if "Not Selected" is chosen
                        const updatedFields = { ...selectedFields };
                        delete updatedFields[header];
                        setSelectedFields(updatedFields);
                      } else {
                        setSelectedFields({
                          ...selectedFields,
                          [header]: value
                        });
                      }
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select field" />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-gray-800 border shadow-md">
                      <SelectItem value="none">Not Selected</SelectItem>
                      {getSelectableFields().map((field) => (
                        <SelectItem 
                          key={field.value} 
                          value={field.value}
                          disabled={
                            Object.values(selectedFields).includes(field.value) &&
                            selectedFields[header] !== field.value
                          }
                        >
                          {field.label}
                          {requiredFields.includes(field.value) ? ' (Required)' : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell className="max-w-[200px] truncate">
                  {previewItems.length > 0 && formatCellContent(previewItems[0][header])}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
