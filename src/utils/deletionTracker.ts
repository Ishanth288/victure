import { supabase } from "@/integrations/supabase/client";

interface DeletionLogData {
  entity_type: 'bill_item' | 'prescription' | 'patient' | 'medicine_return' | 'inventory_adjustment';
  entity_id: number;
  entity_data: any;
  deletion_reason?: string;
  deletion_type?: 'manual' | 'return' | 'replacement' | 'cleanup';
  patient_id?: number;
  prescription_id?: number;
  bill_id?: number;
  medicine_name?: string;
  amount_affected?: number;
  quantity_affected?: number;
  notes?: string;
  is_reversible?: boolean;
  reversal_deadline?: Date;
}

export async function logDeletion(data: DeletionLogData): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.error('No authenticated user found for deletion logging');
      return;
    }

    const deletionRecord = {
      entity_type: data.entity_type,
      entity_id: data.entity_id,
      entity_data: data.entity_data,
      deletion_reason: data.deletion_reason || null,
      deletion_type: data.deletion_type || 'manual',
      patient_id: data.patient_id || null,
      prescription_id: data.prescription_id || null,
      bill_id: data.bill_id || null,
      medicine_name: data.medicine_name || null,
      deleted_by: user.id,
      amount_affected: data.amount_affected || null,
      quantity_affected: data.quantity_affected || null,
      notes: data.notes || null,
      is_reversible: data.is_reversible || false,
      reversal_deadline: data.reversal_deadline?.toISOString() || null,
    };

    const { error } = await (supabase as any)
      .from('deletion_history')
      .insert([deletionRecord]);

    if (error) {
      console.error('Error logging deletion:', error);
      throw error;
    }

    console.log('✅ Deletion logged successfully:', {
      entity_type: data.entity_type,
      entity_id: data.entity_id,
      deletion_type: data.deletion_type
    });

  } catch (error) {
    console.error('Failed to log deletion:', error);
    // Don't throw error to prevent blocking the main deletion operation
  }
}

// Convenience functions for common deletion types
export async function logInventoryDeletion(
  item: any,
  reason?: string,
  notes?: string
): Promise<void> {
  await logDeletion({
    entity_type: 'bill_item',
    entity_id: item.id,
    entity_data: {
      medicine_name: item.medicine_name,
      quantity: item.quantity_in_stock,
      price: item.price,
      manufacturer: item.manufacturer,
      batch_number: item.batch_number,
      expiry_date: item.expiry_date
    },
    deletion_reason: reason,
    deletion_type: 'manual',
    medicine_name: item.medicine_name,
    amount_affected: item.price * item.quantity_in_stock,
    quantity_affected: item.quantity_in_stock,
    notes: notes,
    is_reversible: false
  });
}

export async function logMedicineReturn(
  billItem: any,
  returnData: any,
  reason?: string
): Promise<void> {
  await logDeletion({
    entity_type: 'medicine_return',
    entity_id: returnData.id,
    entity_data: {
      original_bill_item: billItem,
      return_quantity: returnData.quantity_returned,
      refund_amount: returnData.refund_amount
    },
    deletion_reason: reason || 'Medicine return',
    deletion_type: 'return',
    bill_id: billItem.bill_id,
    medicine_name: billItem.medicine_name,
    amount_affected: returnData.refund_amount,
    quantity_affected: returnData.quantity_returned,
    notes: returnData.reason,
    is_reversible: true,
    reversal_deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
  });
}

export async function logPatientDeletion(
  patient: any,
  reason?: string
): Promise<void> {
  await logDeletion({
    entity_type: 'patient',
    entity_id: patient.id,
    entity_data: {
      name: patient.name,
      phone_number: patient.phone_number,
      created_at: patient.created_at
    },
    deletion_reason: reason || 'Patient record deletion',
    deletion_type: 'manual',
    patient_id: patient.id,
    notes: reason,
    is_reversible: false
  });
}

export async function logPrescriptionDeletion(
  prescription: any,
  reason?: string
): Promise<void> {
  await logDeletion({
    entity_type: 'prescription',
    entity_id: prescription.id,
    entity_data: {
      prescription_number: prescription.prescription_number,
      doctor_name: prescription.doctor_name,
      patient_id: prescription.patient_id,
      created_at: prescription.created_at
    },
    deletion_reason: reason || 'Prescription deletion',
    deletion_type: 'manual',
    patient_id: prescription.patient_id,
    prescription_id: prescription.id,
    notes: reason,
    is_reversible: false
  });
} 