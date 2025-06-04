import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { autoDetectFieldMappings } from "@/utils/migration/fieldMappings";
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
          className="text-sm text-blue-600 hover:text-blue-800 font-medium"
        >
          Auto-detect fields
        </button>
      </div>
      
      <div className="border rounded-lg bg-white">
        <div className="max-h-[400px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
          <Table className="relative">
            <TableHeader className="sticky top-0 bg-gray-50 border-b z-10">
              <TableRow>
                <TableHead className="font-semibold text-gray-900 border-r">File Column</TableHead>
                <TableHead className="font-semibold text-gray-900 border-r min-w-[200px]">Maps To Field</TableHead>
                <TableHead className="font-semibold text-gray-900 min-w-[200px]">Preview Data</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {fileHeaders.map((header, index) => (
                <TableRow key={index} className="hover:bg-gray-50">
                  <TableCell className="font-medium border-r bg-gray-50/50 sticky left-0 z-5">{header}</TableCell>
                  <TableCell className="border-r p-2">
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
                      <SelectTrigger className="w-full min-w-[180px] h-9">
                        <SelectValue placeholder="Select field" />
                      </SelectTrigger>
                      <SelectContent className="bg-white dark:bg-gray-800 border shadow-lg max-h-[200px] overflow-y-auto">
                        <SelectItem value="none" className="text-gray-500">Not Selected</SelectItem>
                        {getSelectableFields().map((field) => (
                          <SelectItem 
                            key={field.value} 
                            value={field.value}
                            disabled={
                              Object.values(selectedFields).includes(field.value) &&
                              selectedFields[header] !== field.value
                            }
                          >
                            <span className={requiredFields.includes(field.value) ? 'font-semibold' : ''}>
                              {field.label}
                              {requiredFields.includes(field.value) ? ' (Required)' : ''}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="p-2">
                    <div className="max-w-[250px] truncate text-sm text-gray-600 bg-gray-50 px-2 py-1 rounded">
                      {previewItems.length > 0 ? formatCellContent(previewItems[0][header]) : 'No preview data'}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        
        {fileHeaders.length === 0 && (
          <div className="flex items-center justify-center py-12 text-gray-500">
            <div className="text-center">
              <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-lg font-medium">No file uploaded</p>
              <p className="text-sm">Upload a CSV or Excel file to preview and map fields</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
