import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://aysdilfgxlyuplikmmdt.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF5c2RpbGZneGx5dXBsaWttbWR0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDAxNjU0NTAsImV4cCI6MjA1NTc0MTQ1MH0.7OLDoAC5i8F6IbORW7kY6at5pWdTZDB44D0g6kPaWpA'
);

async function testPrescriptions() {
  try {
    // First, let's see what users exist
    const { data: users, error: usersError } = await supabase.auth.admin.listUsers();
    if (usersError) {
      console.log('Cannot list users (admin required), trying with a sample user ID');
      
      // Let's try to get prescriptions with a sample user ID
      const { data: prescriptions, error: prescError } = await supabase
        .from('prescriptions')
        .select('*')
        .limit(5);
        
      if (prescError) {
        console.error('Error fetching prescriptions:', prescError);
        return;
      }
      
      console.log('Sample prescriptions:', prescriptions);
      
      if (prescriptions && prescriptions.length > 0) {
        const sampleUserId = prescriptions[0].user_id;
        console.log('Testing with user ID:', sampleUserId);
        
        // Test the RPC function
        const { data: rpcData, error: rpcError } = await supabase.rpc('get_prescription_details', { 
          p_user_id: sampleUserId 
        });
        
        if (rpcError) {
          console.error('RPC Error:', rpcError);
        } else {
          console.log('RPC Results:');
          console.log(JSON.stringify(rpcData, null, 2));
        }
        
        // Also check bills directly
        const { data: bills, error: billsError } = await supabase
          .from('bills')
          .select('*')
          .eq('user_id', sampleUserId);
          
        if (billsError) {
          console.error('Bills Error:', billsError);
        } else {
          console.log('Bills for user:', bills);
        }
        
        // Check all bills to see if there are any bills at all
        const { data: allBills, error: allBillsError } = await supabase
          .from('bills')
          .select('*')
          .limit(10);
          
        if (allBillsError) {
          console.error('All Bills Error:', allBillsError);
        } else {
          console.log('All bills in database:', allBills);
        }
        
        // Check if there are bills with different user_ids
        const { data: billsWithUsers, error: billsUsersError } = await supabase
          .from('bills')
          .select('id, bill_number, user_id, prescription_id, total_amount')
          .limit(20);
          
        if (billsUsersError) {
          console.error('Bills with users error:', billsUsersError);
        } else {
          console.log('Bills with user IDs:', billsWithUsers);
        }
      }
    } else {
      console.log('Users found:', users.users.length);
    }
  } catch (error) {
    console.error('Test error:', error);
  }
}

testPrescriptions();