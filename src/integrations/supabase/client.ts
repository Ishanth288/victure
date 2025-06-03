
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://aysdilfgxlyuplikmmdt.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF5c2RpbGZneGx5dXBsaWttbWR0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDAxNjU0NTAsImV4cCI6MjA1NTc0MTQ1MH0.7OLDoAC5i8F6IbORW7kY6at5pWdTZDB44D0g6kPaWpA";

// Simple Supabase client without complex retry logic
export const supabase = createClient<Database>(
  SUPABASE_URL, 
  SUPABASE_PUBLISHABLE_KEY,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      storage: localStorage
    }
  }
);

// Simple availability check
// More robust availability check
export const checkSupabaseAvailability = async (): Promise<boolean> => {
  try {
    console.log('Checking Supabase availability...');
    // Attempt to get a session to verify connectivity and authentication
    const { data: { session }, error } = await supabase.auth.getSession();

    if (error) {
      console.error('Supabase session check failed:', error);
      return false;
    }

    if (session) {
      console.log('Supabase is available and user session found.');
      return true;
    } else {
      console.log('Supabase is available but no active user session.');
      return true; // Supabase is reachable, even if no session
    }
  } catch (error) {
    console.error('Supabase connection failed:', error);
    return false;
  }
};
