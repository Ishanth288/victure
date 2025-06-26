import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Bill, BillItem, PrescriptionBill } from '@/contexts/BillingContext';

// Transform bill to prescription bill format
const transformBillToPrescriptionBill = (bill: any): PrescriptionBill => {
  const totalReturnValue = bill.bill_items?.reduce((sum: any, item: any) => {
    const returnQuantity = item.return_quantity || 0;
    const returnValue = returnQuantity * item.unit_price;
    return sum + returnValue;
  }, 0) || 0;

  const effectiveAmount = bill.total_amount - totalReturnValue;
  const billDate = new Date(bill.date);

  // Handle nested structure from Supabase
  const prescription = Array.isArray(bill.prescriptions) ? bill.prescriptions[0] : bill.prescriptions;
  const patient = prescription?.patients;

  return {
    id: bill.id,
    bill_id: bill.id,
    bill_number: bill.bill_number,
    amount: effectiveAmount,
    original_amount: bill.total_amount,
    return_value: totalReturnValue,
    date: bill.date,
    prescription_id: prescription?.id || null,
    prescription_number: prescription?.prescription_number || 'Unknown',
    doctor_name: prescription?.doctor_name || 'Not Specified',
    status: bill.status,
    patient: patient ? { name: patient.name, phone_number: patient.phone_number } : { name: 'Unknown', phone_number: 'Unknown' },
    bill_items: bill.bill_items || [],
    display_date: billDate
  };
};

// Fetch bills function
const fetchBills = async (userId: string): Promise<{ bills: Bill[], prescriptionBills: PrescriptionBill[] }> => {
  if (!userId) {
    throw new Error('User ID is required');
  }

  const { data: billsData, error: billsError } = await supabase
    .from('bills')
    .select(`
      *,
      prescriptions (
        id,
        prescription_number,
        doctor_name,
        date,
        status,
        patient_id,
        patients (
          id,
          name,
          phone_number
        )
      ),
      bill_items (
        id,
        inventory_item_id,
        quantity,
        unit_price,
        total_price,
        return_quantity
      )
    `)
    .eq('user_id', userId)
    .order('date', { ascending: false })
    .order('id', { ascending: false });

  if (billsError) {
    throw billsError;
  }

  if (!billsData) {
    return { bills: [], prescriptionBills: [] };
  }

  // Transform to prescription bills with proper data structure
  const prescriptionBillsData = billsData.map(bill => transformBillToPrescriptionBill(bill));

  // Sort by date, most recent first
  const sortedPrescriptionBills = prescriptionBillsData.sort((a, b) => {
    return b.display_date.getTime() - a.display_date.getTime();
  });

  return {
    bills: billsData,
    prescriptionBills: sortedPrescriptionBills
  };
};

export const useBillsQuery = (userId: string | null) => {
  return useQuery({
    queryKey: ['bills', userId],
    queryFn: () => fetchBills(userId!),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};
