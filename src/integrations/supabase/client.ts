import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://aysdilfgxlyuplikmmdt.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF5c2RpbGZneGx5dXBsaWttbWR0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDAxNjU0NTAsImV4cCI6MjA1NTc0MTQ1MH0.7OLDoAC5i8F6IbORW7kY6at5pWdTZDB44D0g6kPaWpA";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: localStorage
  }
});

// Helper method to safely handle Supabase query results
export const handleQueryResult = <T>(result: T | { error: true }) => {
  if (result && typeof result === 'object' && 'error' in result && result.error === true) {
    console.error("Supabase query error:", result);
    return null;
  }
  return result as T;
};

// Add a connection status check for debugging
export const checkSupabaseConnection = async () => {
  try {
    const { data, error } = await (supabase as any).from('profiles').select('count', { count: 'exact', head: true });
    if (error) {
      console.error('Supabase connection test failed:', error);
      return false;
    }
    console.log('Supabase connection test successful');
    return true;
  } catch (e) {
    console.error('Supabase connection test exception:', e);
    return false;
  }
};
