
import React, { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { QrCode } from 'lucide-react';
import { supabase } from "@/integrations/supabase/client";

interface PrintableBillProps {
  billData: {
    billNumber: string;
    date: string;
    subtotal: number;
    gstAmount: number;
    gstPercentage: number;
    discountAmount: number;
    totalAmount: number;
    prescriptionDetails?: {
      patient: {
        name: string;
        phone_number: string;
      };
      doctor_name: string;
      prescription_number: string;
    };
  };
  items: {
    id: number;
    name: string;
    quantity: number;
    unit_cost: number;
    total: number;
  }[];
}

export function PrintableBill({ billData, items }: PrintableBillProps) {
  const [pharmacyDetails, setPharmacyDetails] = useState<any>(null);

  useEffect(() => {
    const fetchPharmacyDetails = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.id) {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
        
        if (data) {
          setPharmacyDetails(data);
        }
      }
    };

    fetchPharmacyDetails();
  }, []);

  return (
    <div className="max-w-4xl mx-auto bg-white p-8 print:p-4 print:shadow-none">
      <div className="text-center mb-6 border-b pb-4">
        <h1 className="text-3xl font-bold text-primary mb-2">
          {pharmacyDetails?.pharmacy_name || 'Loading...'}
        </h1>
        <p className="text-neutral-600">123 Healthcare Avenue, Medical District</p>
        <p className="text-neutral-600">Mumbai, Maharashtra - 400001</p>
        <p className="text-neutral-600">Phone: +91 9876543210 | Email: care@victure.com</p>
        <p className="text-neutral-600">GSTIN: 27AAAAA0000A1Z5 | DL No: MH-MUM-123456</p>
      </div>

      {/* Bill Details */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div>
          <h2 className="font-semibold mb-2">Patient Details:</h2>
          <p className="text-neutral-600">Name: {billData.prescriptionDetails?.patient.name || 'N/A'}</p>
          <p className="text-neutral-600">Phone: {billData.prescriptionDetails?.patient.phone_number || 'N/A'}</p>
          <p className="text-neutral-600">Doctor: {billData.prescriptionDetails?.doctor_name || 'N/A'}</p>
          <p className="text-neutral-600">Prescription: {billData.prescriptionDetails?.prescription_number || 'N/A'}</p>
        </div>
        <div className="text-right">
          <h2 className="font-semibold mb-2">Bill Details:</h2>
          <p className="text-neutral-600">Bill No: {billData.billNumber}</p>
          <p className="text-neutral-600">Date: {format(new Date(billData.date), 'dd/MM/yyyy')}</p>
          <p className="text-neutral-600">Time: {format(new Date(billData.date), 'hh:mm a')}</p>
        </div>
      </div>

      {/* Items Table */}
      <div className="mb-6 overflow-x-auto">
        <table className="w-full">
          <thead className="bg-neutral-50">
            <tr className="text-left">
              <th className="p-2 border">Sr. No.</th>
              <th className="p-2 border">Medicine Name</th>
              <th className="p-2 border">Qty</th>
              <th className="p-2 border">Unit Price (₹)</th>
              <th className="p-2 border">Total (₹)</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => (
              <tr key={item.id}>
                <td className="p-2 border">{index + 1}</td>
                <td className="p-2 border">{item.name}</td>
                <td className="p-2 border">{item.quantity}</td>
                <td className="p-2 border">₹{item.unit_cost.toFixed(2)}</td>
                <td className="p-2 border">₹{item.total.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Summary */}
      <div className="flex justify-end mb-6">
        <div className="w-64 space-y-2">
          <div className="flex justify-between">
            <span>Subtotal:</span>
            <span>₹{billData.subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>GST ({billData.gstPercentage}%):</span>
            <span>₹{billData.gstAmount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>Discount:</span>
            <span>₹{billData.discountAmount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between font-bold text-lg border-t pt-2">
            <span>Grand Total:</span>
            <span>₹{billData.totalAmount.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Terms and QR */}
      <div className="grid grid-cols-2 gap-4 border-t pt-4">
        <div>
          <h3 className="font-semibold mb-2">Terms & Conditions:</h3>
          <ul className="text-sm text-neutral-600 list-disc list-inside space-y-1">
            <li>Goods once sold will not be taken back or exchanged</li>
            <li>Bills not paid after date will attract 4% interest</li>
            <li>Subject to local jurisdiction only</li>
            <li>This is a computer-generated bill</li>
          </ul>
        </div>
        <div className="flex flex-col items-center justify-center">
          <QrCode className="w-24 h-24 text-neutral-800 mb-2" />
          <p className="text-sm text-neutral-600">Scan to pay</p>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center mt-6 pt-4 border-t text-sm text-neutral-600">
        <p>Thank you for choosing Victure Pharmacy!</p>
        <p>For any queries, please contact: +91 9876543210</p>
      </div>
    </div>
  );
}
