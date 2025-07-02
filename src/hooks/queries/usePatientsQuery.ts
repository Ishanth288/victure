import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Bill {
  id: number;
  total_amount: number;
  bill_number: string;
  date: string;
}

export interface Patient {
  id: number;
  name: string;
  phone_number: string;
  user_id: string;
  created_at: string;
  status: string;
  totalSpent: number;
  bills: Bill[];
  prescriptions: {
    id: number;
    prescription_number: string;
    doctor_name: string;
    date: string;
    status: string;
    user_id: string;
    bills: Bill[];
  }[];
}

// Enhanced test for Supabase connection
const testRawConnection = async () => {
  try {
    console.log('🔍 Testing raw Supabase connection...');
    console.log('🔍 Supabase URL:', import.meta.env.VITE_SUPABASE_URL);
    console.log('🔍 Supabase Key (first 20 chars):', import.meta.env.VITE_SUPABASE_ANON_KEY?.substring(0, 20) + '...');
    
    // Test 1: Get current user
    console.log('🔍 Step 1: Getting current user...');
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError) {
      console.error('❌ User error:', userError.message);
      return;
    }
    if (!user) {
      console.error('❌ No user found');
      return;
    }
    console.log('✅ Current User ID:', user.id);
    console.log('✅ User Email:', user.email);
    
    // Test 2: Simple table access
    console.log('🔍 Step 2: Testing simple table access...');
    const { data: simpleData, error: simpleError } = await supabase
      .from('patients')
      .select('id')
      .limit(1);
    
    if (simpleError) {
      console.error('❌ Simple query failed:', simpleError.message, simpleError.details, simpleError.hint);
      return;
    }
    console.log('✅ Simple query successful, table accessible');
    
    // Test 3: User-specific query
    console.log('🔍 Step 3: Testing user-specific query...');
    const { data: userData, error: userQueryError, count } = await supabase
      .from('patients')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id);
    
    if (userQueryError) {
      console.error('❌ User-specific query failed:', userQueryError.message, userQueryError.details, userQueryError.hint);
      return;
    }
    
    console.log('✅ User-specific query successful!');
    console.log('✅ Records found:', count);
    console.log('✅ Data sample:', userData?.slice(0, 2));
    
    // Test 4: Check table permissions
    console.log('🔍 Step 4: Testing table permissions...');
    const { data: permData, error: permError } = await supabase
      .from('patients')
      .select('id, name, user_id')
      .eq('user_id', user.id)
      .limit(5);
    
    if (permError) {
      console.error('❌ Permission test failed:', permError.message, permError.details);
    } else {
      console.log('✅ Permission test passed, can read user data');
      console.log('✅ Sample records:', permData);
    }
    
  } catch (error) {
    console.error('❌ Raw connection test failed:', error.message, error.stack);
  }
};

// Test will run when usePatientsQuery hook is called

const fetchPatients = async (userId: string) => {
  console.log('🔍 Fetching patients via Supabase client...');
  
  try {
    const { data, error } = await supabase
      .from('patients')
      .select(`
        *,
        prescriptions (
          id,
          prescription_number,
          doctor_name,
          date,
          status,
          user_id,
          bills (
            id,
            bill_number,
            total_amount,
            subtotal,
            gst_amount,
            gst_percentage,
            discount_amount,
            date,
            status,
            bill_items (
              id,
              quantity,
              unit_price,
              total_price,
              inventory_item_id,
              inventory:inventory_item_id (
                name
              )
            )
          )
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Supabase client error:', error);
      throw error;
    }

    console.log('✅ Supabase client success:', { data, count: data?.length });
    return data || [];
  } catch (error) {
    console.error('❌ fetchPatients error:', error);
    throw error;
  }
};

export const usePatientsQuery = (userId: string) => {
  console.log('🔍 usePatientsQuery called with userId:', userId);
  
  // Run test when hook is called
  React.useEffect(() => {
    if (userId) {
      testRawConnection();
    }
  }, [userId]);
  
  return useQuery({
    queryKey: ['patients', userId],
    queryFn: () => fetchPatients(userId),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};