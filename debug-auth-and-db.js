import { supabase } from './src/integrations/supabase/client.js';

async function debugAuthAndDatabase() {
  console.log('=== Authentication Debug ===');
  
  try {
    // Check current session
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    console.log('Session check:', { 
      hasSession: !!sessionData.session, 
      hasUser: !!sessionData.session?.user,
      userId: sessionData.session?.user?.id,
      error: sessionError 
    });
    
    // Check current user
    const { data: userData, error: userError } = await supabase.auth.getUser();
    console.log('User check:', { 
      hasUser: !!userData.user, 
      userId: userData.user?.id,
      email: userData.user?.email,
      error: userError 
    });
    
  } catch (error) {
    console.error('Auth check failed:', error);
  }
  
  console.log('\n=== Database Debug ===');
  
  try {
    // Check if system_settings table exists and has data
    const { data: settingsData, error: settingsError, count } = await supabase
      .from('system_settings')
      .select('*', { count: 'exact' });
      
    console.log('System settings check:', { 
      hasData: !!settingsData, 
      count: count,
      data: settingsData,
      error: settingsError 
    });
    
    // Try to get specific record with id=1
    const { data: singleRecord, error: singleError } = await supabase
      .from('system_settings')
      .select('*')
      .eq('id', 1)
      .maybeSingle();
      
    console.log('Single record check (id=1):', { 
      hasRecord: !!singleRecord, 
      record: singleRecord,
      error: singleError 
    });
    
  } catch (error) {
    console.error('Database check failed:', error);
  }
  
  console.log('\n=== Security Logs Table Debug ===');
  
  try {
    // Check if security_logs table exists
    const { data: securityData, error: securityError, count: securityCount } = await supabase
      .from('security_logs')
      .select('*', { count: 'exact' })
      .limit(1);
      
    console.log('Security logs check:', { 
      hasData: !!securityData, 
      count: securityCount,
      error: securityError 
    });
    
  } catch (error) {
    console.error('Security logs check failed:', error);
  }
}

debugAuthAndDatabase().catch(console.error);