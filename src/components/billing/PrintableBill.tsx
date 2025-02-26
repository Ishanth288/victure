import React, { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { QrCode } from 'lucide-react';
import { supabase } from "@/integrations/supabase/client";

interface PrintableBillProps {
  billData: {
    bill_number: string;
    date: string;
    subtotal: number;
    gst_amount: number;
    gst_percentage: number;
    discount_amount: number;
    total_amount: number;
    prescription: {
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
        <p className="text-neutral-600">{pharmacyDetails?.address}</p>
        <p className="text-neutral-600">{pharmacyDetails?.city}, {pharmacyDetails?.state} - {pharmacyDetails?.pincode}</p>
        <p className="text-neutral-600">GSTIN: {pharmacyDetails?.gstin || 'N/A'}</p>
      </div>

      {/* Bill Details */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div>
          <h2 className="font-semibold mb-2">Patient Details:</h2>
          <p>Name: {billData.prescription.patient.name}</p>
          <p>Phone: {billData.prescription.patient.phone_number}</p>
          <p>Doctor: Dr. {billData.prescription.doctor_name}</p>
          <p>Prescription: {billData.prescription.prescription_number}</p>
        </div>
        <div className="text-right">
          <h2 className="font-semibold mb-2">Bill Details:</h2>
          <p>Bill No: {billData.bill_number}</p>
          <p>Date: {format(new Date(billData.date), 'dd/MM/yyyy')}</p>
          <p>Time: {format(new Date(billData.date), 'hh:mm a')}</p>
        </div>
      </div>

      {/* Items Table */}
      <table className="w-full mb-6">
        <thead className="bg-gray-50">
          <tr>
            <th className="p-2 text-left border">Sr. No.</th>
            <th className="p-2 text-left border">Item Name</th>
            <th className="p-2 text-left border">Qty</th>
            <th className="p-2 text-left border">Unit Price</th>
            <th className="p-2 text-left border">Total</th>
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

      {/* Summary */}
      <div className="flex justify-end mb-6">
        <div className="w-64">
          <div className="flex justify-between mb-2">
            <span>Subtotal:</span>
            <span>₹{Math.round(billData.subtotal).toFixed(2)}</span>
          </div>
          <div className="flex justify-between mb-2">
            <span>GST ({billData.gst_percentage}%):</span>
            <span>₹{Math.round(billData.gst_amount).toFixed(2)}</span>
          </div>
          <div className="flex justify-between mb-2">
            <span>Discount:</span>
            <span>₹{Math.round(billData.discount_amount).toFixed(2)}</span>
          </div>
          <div className="flex justify-between font-bold border-t pt-2">
            <span>Total:</span>
            <span>₹{Math.round(billData.total_amount).toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t pt-4">
        <h3 className="font-semibold mb-2">Terms & Conditions:</h3>
        <ul className="text-sm text-gray-600 list-disc list-inside">
          <li>Goods once sold will not be taken back</li>
          <li>Subject to local jurisdiction</li>
          <li>This is a computer-generated bill</li>
        </ul>
      </div>

      <div className="text-center mt-6 text-sm text-gray-600">
        <p>Thank you for choosing {pharmacyDetails?.pharmacy_name}!</p>
      </div>
    </div>
  );
}
