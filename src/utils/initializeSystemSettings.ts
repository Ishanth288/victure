import { supabase } from '@/integrations/supabase/client';

export async function initializeSystemSettings() {
  try {
    // Check if system_settings record with id=1 exists
    const { data: existingSettings, error: checkError } = await supabase
      .from('system_settings')
      .select('id')
      .eq('id', 1)
      .maybeSingle();

    if (checkError) {
      console.error('Error checking system settings:', checkError);
      return false;
    }

    // If record doesn't exist, create it with default values
    if (!existingSettings) {
      console.log('Creating default system settings record...');
      
      const { error: insertError } = await supabase
        .from('system_settings')
        .insert({
          id: 1,
          maintenance_mode: false,
          maintenance_message: 'The system is currently undergoing scheduled maintenance. Please try again later.',
          maintenance_start_date: null,
          maintenance_end_date: null,
          maintenance_announcement: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (insertError) {
        console.error('Error creating system settings:', insertError);
        return false;
      }

      console.log('Default system settings created successfully');
      return true;
    }

    console.log('System settings already exist');
    return true;
  } catch (error) {
    console.error('Failed to initialize system settings:', error);
    return false;
  }
}