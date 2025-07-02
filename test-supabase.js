// Simple Node.js script to test Supabase connection
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

console.log('🔍 Starting Supabase Connection Test');
console.log('Environment check:');
console.log('- NODE_ENV:', process.env.NODE_ENV);
console.log('- All env vars:', Object.keys(process.env).filter(key => key.includes('SUPABASE')));

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

console.log('\n🔍 Testing Supabase Connection');
console.log('URL:', supabaseUrl);
console.log('Key (partial):', supabaseKey ? supabaseKey.substring(0, 20) + '...' : 'NOT FOUND');

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  try {
    console.log('\n1. Testing basic connection...');
    const { data, error } = await supabase.from('patients').select('count', { count: 'exact', head: true });
    
    if (error) {
      console.error('❌ Basic connection failed:', error.message);
      return;
    }
    
    console.log('✅ Basic connection successful');
    console.log('Patient count:', data);
    
    console.log('\n2. Testing authentication...');
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      console.error('❌ Auth check failed:', authError.message);
    } else {
      console.log('✅ Auth check successful');
      console.log('User:', user ? user.id : 'No user logged in');
    }
    
    console.log('\n3. Testing table access...');
    const { data: tableData, error: tableError } = await supabase
      .from('patients')
      .select('*')
      .limit(1);
    
    if (tableError) {
      console.error('❌ Table access failed:', tableError.message);
    } else {
      console.log('✅ Table access successful');
      console.log('Sample data:', tableData);
    }
    
  } catch (err) {
    console.error('❌ Unexpected error:', err.message);
  }
}

testConnection();