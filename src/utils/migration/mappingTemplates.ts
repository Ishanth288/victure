
import { supabase } from "@/integrations/supabase/client";
import { MappingTemplate } from "@/types/dataMigration";

/**
 * Saves a mapping template to the database
 */
export async function saveMappingTemplate(template: MappingTemplate): Promise<boolean> {
  try {
    // Cast the template to match the expected database structure
    const dbTemplate = {
      name: template.name,
      source_system: template.source_system,
      data_type: template.data_type,
      mappings: template.mappings,
      user_id: template.user_id || (await supabase.auth.getUser()).data.user?.id
    };
    
    const { error } = await supabase
      .from('mapping_templates')
      .insert([dbTemplate]);
      
    if (error) {
      console.error('Failed to save mapping template:', error);
      return false;
    }
    
    return true;
  } catch (err) {
    console.error('Error saving mapping template:', err);
    return false;
  }
}

/**
 * Gets mapping templates for a specific data type
 */
export async function getMappingTemplates(dataType: 'Inventory' | 'Patients' | 'Prescriptions'): Promise<MappingTemplate[]> {
  try {
    const { data, error } = await supabase
      .from('mapping_templates')
      .select('*')
      .eq('data_type', dataType)
      .order('name');
      
    if (error) {
      console.error('Failed to fetch mapping templates:', error);
      return [];
    }
    
    // Properly cast the data to ensure type compatibility
    return (data || []).map(item => ({
      id: item.id,
      user_id: item.user_id,
      name: item.name,
      source_system: item.source_system,
      data_type: item.data_type as 'Inventory' | 'Patients' | 'Prescriptions',
      mappings: item.mappings as Record<string, string>,
      created_at: item.created_at,
      updated_at: item.updated_at
    }));
  } catch (err) {
    console.error('Error fetching mapping templates:', err);
    return [];
  }
}

/**
 * Deletes a mapping template
 */
export async function deleteMappingTemplate(id: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('mapping_templates')
      .delete()
      .eq('id', id);
      
    if (error) {
      console.error('Failed to delete mapping template:', error);
      return false;
    }
    
    return true;
  } catch (err) {
    console.error('Error deleting mapping template:', err);
    return false;
  }
}
