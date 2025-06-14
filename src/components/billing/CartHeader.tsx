
import React from 'react';
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User, Phone, FileText, Calendar, ChevronDown } from "lucide-react";

interface CartHeaderProps {
  patientName?: string;
  phoneNumber?: string;
  prescriptionId?: string;
  doctorName?: string;
  prescriptionDate?: string;
}

export const CartHeader: React.FC<CartHeaderProps> = ({
  patientName = "Not Available",
  phoneNumber = "Not Available",
  prescriptionId,
  doctorName = "Dr. Not Specified",
  prescriptionDate
}) => {
  const formatTime = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const formatPrescriptionId = (id?: string) => {
    if (!id) return '';
    return `PRE-${id.slice(-8)}`;
  };

  return (
    <div className="w-full max-w-sm">
      <Card className="border border-gray-200 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <User className="h-5 w-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">Patient Information</h3>
            {prescriptionId && (
              <Badge variant="outline" className="ml-auto text-xs">
                ID: {prescriptionId}
              </Badge>
            )}
            {prescriptionId && (
              <Badge variant="outline" className="text-xs">
                DB: {prescriptionId}
              </Badge>
            )}
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4 pt-0">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="flex items-center gap-1 text-sm text-gray-600 mb-1">
                <User className="h-3 w-3" />
                <span>Patient Name</span>
              </div>
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-gray-400" />
                <span className="font-medium text-gray-900">{patientName}</span>
                {prescriptionDate && (
                  <span className="text-xs text-gray-500">
                    ({formatTime(prescriptionDate)})
                  </span>
                )}
              </div>
            </div>

            <div>
              <div className="flex items-center gap-1 text-sm text-gray-600 mb-1">
                <FileText className="h-3 w-3" />
                <span>Doctor Name</span>
              </div>
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-gray-400" />
                <span className="font-medium text-gray-900">{doctorName}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="flex items-center gap-1 text-sm text-gray-600 mb-1">
                <Phone className="h-3 w-3" />
                <span>Phone Number</span>
              </div>
              <div className="font-medium text-gray-900">{phoneNumber}</div>
            </div>

            <div>
              <div className="flex items-center gap-1 text-sm text-gray-600 mb-1">
                <Calendar className="h-3 w-3" />
                <span>Prescription Number</span>
              </div>
              <div className="font-medium text-gray-900">
                {formatPrescriptionId(prescriptionId)}
              </div>
            </div>
          </div>

          {prescriptionDate && (
            <div className="pt-2 border-t border-gray-100">
              <div className="flex items-center gap-1 text-sm text-gray-600 mb-1">
                <span>(Prescription Date: {new Date(prescriptionDate).toLocaleDateString()})</span>
              </div>
            </div>
          )}

          <div className="pt-2">
            <button className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
              <ChevronDown className="h-4 w-4" />
              <span>Debug: Raw Prescription Data</span>
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
