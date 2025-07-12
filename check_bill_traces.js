import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://aysdilfgxlyuplikmmdt.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF5c2RpbGZneGx5dXBsaWttbWR0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDAxNjU0NTAsImV4cCI6MjA1NTc0MTQ1MH0.7OLDoAC5i8F6IbORW7kY6at5pWdTZDB44D0g6kPaWpA'
);

async function checkBillEvidence() {
  try {
    console.log('=== CHECKING FOR BILL EVIDENCE ===\n');
    
    // Check key tables for record counts
    const tables = ['prescriptions', 'bills', 'bill_items', 'patients', 'medicines', 'inventory'];
    
    for (const table of tables) {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
        
      if (error) {
        console.log(`${table}: ❌ Error - ${error.message}`);
      } else {
        console.log(`${table}: ✅ ${count || 0} records`);
      }
    }
    
    console.log('\n=== CHECKING PRESCRIPTIONS FOR BILL DATA ===');
    
    // Check if any prescriptions have bill-related data
    const { data: prescriptionsWithBillData } = await supabase
      .from('prescriptions')
      .select('id, prescription_number, has_bill, bill_id, bill_number, bill_total_amount, bill_date')
      .or('has_bill.eq.true,bill_id.not.is.null,bill_number.not.is.null')
      .limit(10);
      
    console.log(`Prescriptions with bill data: ${prescriptionsWithBillData?.length || 0}`);
    if (prescriptionsWithBillData && prescriptionsWithBillData.length > 0) {
      prescriptionsWithBillData.forEach(p => {
        console.log(`  ID: ${p.id}, Number: ${p.prescription_number}`);
        console.log(`    has_bill: ${p.has_bill}, bill_id: ${p.bill_id}`);
        console.log(`    bill_number: ${p.bill_number}, amount: ${p.bill_total_amount}`);
        console.log(`    bill_date: ${p.bill_date}\n`);
      });
    }
    
    console.log('=== CHECKING FOR ANY BILL REFERENCES ===');
    
    // Check if any prescription has bill_number field populated
    const { data: withBillNumbers } = await supabase
      .from('prescriptions')
      .select('id, prescription_number, bill_number')
      .not('bill_number', 'is', null)
      .limit(5);
      
    console.log(`Prescriptions with bill_number: ${withBillNumbers?.length || 0}`);
    if (withBillNumbers && withBillNumbers.length > 0) {
      console.log('Found prescriptions with bill numbers:', withBillNumbers);
    }
    
    // Check if any prescription has has_bill = true
    const { data: withHasBill } = await supabase
      .from('prescriptions')
      .select('id, prescription_number, has_bill')
      .eq('has_bill', true)
      .limit(5);
      
    console.log(`Prescriptions with has_bill=true: ${withHasBill?.length || 0}`);
    if (withHasBill && withHasBill.length > 0) {
      console.log('Found prescriptions marked as having bills:', withHasBill);
    }
    
    console.log('\n=== SUMMARY ===');
    console.log('If prescriptions have bill_number or has_bill=true but bills table is empty,');
    console.log('it confirms that bills existed but were deleted during migration.');
    
  } catch (error) {
    console.error('Error:', error);
  }
}

checkBillEvidence();