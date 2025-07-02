// Standalone Supabase connection test
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

console.log('🔍 Environment check:');
console.log('URL exists:', !!supabaseUrl);
console.log('Key exists:', !!supabaseKey);
console.log('URL format:', supabaseUrl?.includes('supabase.co') ? 'Valid' : 'Invalid');

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  },
  global: {
    fetch: (url, options = {}) => {
      console.log(`🌐 Fetch request to: ${url}`);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        console.log('⏰ Request timeout after 10 seconds');
        controller.abort();
      }, 10000);
      
      return fetch(url, {
        ...options,
        signal: controller.signal
      }).finally(() => {
        clearTimeout(timeoutId);
      });
    }
  }
});

async function testConnection() {
  console.log('\n🚀 Starting Supabase connection test...');
  
  try {
    console.log('\n🧪 Test 1: Basic table access (no auth)');
    const { data, error, count } = await supabase
      .from('patients')
      .select('id', { count: 'exact', head: true });
    
    if (error) {
      console.log('❌ Test 1 failed:', error.message);
    } else {
      console.log('✅ Test 1 passed - Table accessible, count:', count);
    }
  } catch (err) {
    console.log('💥 Test 1 exception:', err.message);
  }
  
  try {
    console.log('\n🧪 Test 2: Auth status check');
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error) {
      console.log('❌ Test 2 failed:', error.message);
    } else {
      console.log('✅ Test 2 passed - Auth status:', user ? 'Authenticated' : 'Anonymous');
    }
  } catch (err) {
    console.log('💥 Test 2 exception:', err.message);
  }
  
  try {
    console.log('\n🧪 Test 3: Simple health check');
    const { data, error } = await supabase
      .from('patients')
      .select('count')
      .limit(0);
    
    if (error) {
      console.log('❌ Test 3 failed:', error.message);
    } else {
      console.log('✅ Test 3 passed - Health check successful');
    }
  } catch (err) {
    console.log('💥 Test 3 exception:', err.message);
  }
  
  console.log('\n🏁 Test completed');
}

testConnection().catch(err => {
  console.error('💥 Fatal error:', err);
  process.exit(1);
});