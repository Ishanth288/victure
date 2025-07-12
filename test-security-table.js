// Test script to check and create security_logs table if needed
import { supabase } from './src/integrations/supabase/client.js';

async function testSecurityTable() {
  console.log('Testing security_logs table...');
  
  try {
    // Try to query the security_logs table
    const { data, error } = await supabase
      .from('security_logs')
      .select('id')
      .limit(1);
    
    if (error) {
      console.error('Error accessing security_logs table:', error);
      
      if (error.message.includes('relation "public.security_logs" does not exist')) {
        console.log('security_logs table does not exist. Creating it...');
        
        // Create the security_logs table
        const { error: createError } = await supabase.rpc('exec_sql', {
          sql: `
            CREATE TABLE IF NOT EXISTS security_logs (
              id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
              event_type TEXT NOT NULL,
              user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
              ip_address INET,
              user_agent TEXT,
              details JSONB DEFAULT '{}'::jsonb,
              severity TEXT DEFAULT 'info' CHECK (severity IN ('low', 'medium', 'high', 'critical', 'info')),
              created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
            
            CREATE INDEX IF NOT EXISTS idx_security_logs_event_type ON security_logs(event_type);
            CREATE INDEX IF NOT EXISTS idx_security_logs_user_id ON security_logs(user_id);
            CREATE INDEX IF NOT EXISTS idx_security_logs_created_at ON security_logs(created_at);
            CREATE INDEX IF NOT EXISTS idx_security_logs_severity ON security_logs(severity);
            
            ALTER TABLE security_logs ENABLE ROW LEVEL SECURITY;
            
            CREATE POLICY IF NOT EXISTS "Service role can manage security logs" ON security_logs
              FOR ALL USING (auth.role() = 'service_role');
          `
        });
        
        if (createError) {
          console.error('Failed to create security_logs table:', createError);
        } else {
          console.log('✅ security_logs table created successfully!');
        }
      }
    } else {
      console.log('✅ security_logs table exists and is accessible');
    }
  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

testSecurityTable();