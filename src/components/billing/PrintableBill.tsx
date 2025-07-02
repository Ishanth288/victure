
import React, { useEffect, useState } from 'react';
import { format } from 'date-fns';
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
    <div className="w-full bg-white" style={{ maxHeight: '148mm' }}>
      <div className="text-center mb-4 border-b pb-4">
        <h1 className="text-2xl font-bold text-primary mb-1">
          {pharmacyDetails?.pharmacy_name || 'Loading...'}
        </h1>
        <p className="text-sm text-neutral-600">{pharmacyDetails?.address}</p>
        <p className="text-sm text-neutral-600">{pharmacyDetails?.city}, {pharmacyDetails?.state} - {pharmacyDetails?.pincode}</p>
        <p className="text-sm text-neutral-600">GSTIN: {pharmacyDetails?.gstin || 'N/A'}</p>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-4 text-sm">
        <div>
          <h2 className="font-semibold mb-1">Patient Details:</h2>
          <p>Name: {billData.prescription.patient.name}</p>
          <p>Phone: {billData.prescription.patient.phone_number}</p>
          <p>Doctor: Dr. {billData.prescription.doctor_name}</p>
          <p>Prescription: {billData.prescription.prescription_number}</p>
        </div>
        <div className="text-right">
          <h2 className="font-semibold mb-1">Bill Details:</h2>
          <p>Bill No: {billData.bill_number}</p>
          <p>Date: {format(new Date(billData.date), 'dd/MM/yyyy')}</p>
            <p>Time: {format(new Date(billData.date), 'hh:mm a')}</p>
        </div>
      </div>

      <table className="w-full mb-4 text-sm">
        <thead className="bg-gray-50">
          <tr>
            <th className="p-1 text-left border">Sr. No.</th>
            <th className="p-1 text-left border">Item Name</th>
            <th className="p-1 text-left border">Qty</th>
            <th className="p-1 text-left border">Unit Price</th>
            <th className="p-1 text-left border">Total</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, index) => (
            <tr key={`${item.id}-${index}`}>
              <td className="p-1 border">{index + 1}</td>
              <td className="p-1 border">{item.inventory.name}</td>
              <td className="p-1 border">{item.quantity}</td>
              <td className="p-1 border">₹{item.unit_price.toFixed(2)}</td>
              <td className="p-1 border">₹{item.total_price.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="flex justify-end mb-4">
        <div className="w-48">
          <div className="flex justify-between mb-1 text-sm">
            <span>Subtotal:</span>
            <span>₹{Math.round(billData.subtotal).toFixed(2)}</span>
          </div>
          <div className="flex justify-between mb-1 text-sm">
            <span>GST ({billData.gst_percentage}%):</span>
            <span>₹{Math.round(billData.gst_amount).toFixed(2)}</span>
          </div>
          <div className="flex justify-between mb-1 text-sm">
            <span>Discount:</span>
            <span>₹{Math.round(billData.discount_amount).toFixed(2)}</span>
          </div>
          <div className="flex justify-between font-bold border-t pt-1 text-sm">
            <span>Total:</span>
            <span>₹{Math.round(billData.total_amount).toFixed(2)}</span>
          </div>
        </div>
      </div>

      <div className="text-xs text-gray-600">
        <h3 className="font-semibold mb-1">Terms & Conditions:</h3>
        <ul className="list-disc list-inside">
          <li>Goods once sold will not be taken back</li>
          <li>Subject to local jurisdiction</li>
        </ul>
      </div>

      <div className="text-center mt-2 text-xs text-gray-600">
        <p>Thank you for choosing {pharmacyDetails?.pharmacy_name}!</p>
      </div>
    </div>
  );
}
