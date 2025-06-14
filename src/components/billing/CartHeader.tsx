
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User, Phone, Calendar, FileText } from "lucide-react";

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
  return (
    <Card className="mb-6 shadow-sm border-l-4 border-l-primary">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            Patient Information
          </h2>
          {prescriptionId && (
            <Badge variant="outline" className="text-sm font-medium">
              ID: {prescriptionId}
            </Badge>
          )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-600">
              <User className="h-4 w-4" />
              Patient Name
            </div>
            <p className="text-base font-semibold text-gray-900 truncate">
              {patientName}
            </p>
          </div>
          
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-600">
              <Phone className="h-4 w-4" />
              Phone Number
            </div>
            <p className="text-base font-semibold text-gray-900">
              {phoneNumber}
            </p>
          </div>
          
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-600">
              <FileText className="h-4 w-4" />
              Doctor Name
            </div>
            <p className="text-base font-semibold text-gray-900 truncate">
              {doctorName}
            </p>
          </div>
          
          {prescriptionDate && (
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-600">
                <Calendar className="h-4 w-4" />
                Prescription Date
              </div>
              <p className="text-base font-semibold text-gray-900">
                {new Date(prescriptionDate).toLocaleDateString()}
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
