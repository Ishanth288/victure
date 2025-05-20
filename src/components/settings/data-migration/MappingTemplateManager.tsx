
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, Save, Trash, Refresh } from "lucide-react";
import { stableToast } from "@/components/ui/stable-toast";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger 
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { MappingTemplate } from "@/types/dataMigration";
import { MigrationMode } from "./types";

interface MappingTemplateManagerProps {
  selectedFields: Record<string, string>;
  fileHeaders: string[];
  migrationMode: MigrationMode;
  onApplyTemplate: (template: MappingTemplate) => void;
}

export const MappingTemplateManager: React.FC<MappingTemplateManagerProps> = ({
  selectedFields,
  fileHeaders,
  migrationMode,
  onApplyTemplate
}) => {
  const [templateName, setTemplateName] = useState<string>("");
  const [sourceSystem, setSourceSystem] = useState<string>("");
  const [templates, setTemplates] = useState<MappingTemplate[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);

  // Load templates on component mount
  useEffect(() => {
    loadTemplates();
  }, [migrationMode]);

  const loadTemplates = async () => {
    setIsLoading(true);
    
    try {
      const { data, error } = await supabase
        .from("mapping_templates")
        .select("*")
        .eq("data_type", migrationMode)
        .order("created_at", { ascending: false });
      
      if (error) {
        console.error("Error fetching templates:", error);
        stableToast({
          title: "Error",
          description: "Failed to load mapping templates",
          variant: "destructive",
        });
      } else {
        setTemplates(data || []);
      }
    } catch (err) {
      console.error("Failed to load templates:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const saveTemplate = async () => {
    if (!templateName.trim()) {
      stableToast({
        title: "Validation Error",
        description: "Please provide a template name",
        variant: "destructive",
      });
      return;
    }

    if (!sourceSystem.trim()) {
      stableToast({
        title: "Validation Error",
        description: "Please provide a source system name",
        variant: "destructive",
      });
      return;
    }
    
    setIsSaving(true);
    
    try {
      // Create the template object
      const template: MappingTemplate = {
        name: templateName,
        source_system: sourceSystem,
        data_type: migrationMode,
        mappings: selectedFields
      };
      
      // Save to database
      const { error } = await supabase
        .from("mapping_templates")
        .insert([template]);
      
      if (error) {
        console.error("Error saving template:", error);
        stableToast({
          title: "Error",
          description: "Failed to save mapping template",
          variant: "destructive",
        });
      } else {
        stableToast({
          title: "Success",
          description: "Mapping template saved successfully",
          variant: "success",
        });
        
        // Reset form and reload templates
        setTemplateName("");
        setSourceSystem("");
        await loadTemplates();
        setIsDialogOpen(false);
      }
    } catch (err) {
      console.error("Failed to save template:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const deleteTemplate = async (id: string) => {
    if (!confirm("Are you sure you want to delete this template?")) {
      return;
    }
    
    try {
      const { error } = await supabase
        .from("mapping_templates")
        .delete()
        .eq("id", id);
      
      if (error) {
        console.error("Error deleting template:", error);
        stableToast({
          title: "Error",
          description: "Failed to delete template",
          variant: "destructive",
        });
      } else {
        stableToast({
          title: "Success",
          description: "Template deleted successfully",
          variant: "success",
        });
        
        // Reload templates
        await loadTemplates();
      }
    } catch (err) {
      console.error("Failed to delete template:", err);
    }
  };

  const handleApplyTemplate = (template: MappingTemplate) => {
    // Filter the mappings to only include headers that exist in the current file
    const filteredMappings: Record<string, string> = {};
    
    // Check which keys in the template actually exist in the current file headers
    fileHeaders.forEach(header => {
      // Find if there's a mapping for this header or a similar one
      const templateKeys = Object.keys(template.mappings);
      const matchingKey = templateKeys.find(key => 
        key.toLowerCase() === header.toLowerCase() || 
        header.toLowerCase().includes(key.toLowerCase()) || 
        key.toLowerCase().includes(header.toLowerCase())
      );
      
      if (matchingKey) {
        filteredMappings[header] = template.mappings[matchingKey];
      }
    });
    
    onApplyTemplate({
      ...template,
      mappings: filteredMappings
    });
    
    stableToast({
      title: "Template Applied",
      description: `Applied template: ${template.name}`,
      variant: "success",
    });
  };

  return (
    <div className="mapping-template-manager space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Saved Mapping Templates</h3>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline">
              <Save className="w-4 h-4 mr-1" />
              Save Current Mapping
            </Button>
          </DialogTrigger>
          
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Save Mapping Template</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="template-name">Template Name</Label>
                <Input
                  id="template-name"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  placeholder="e.g., My Pharmacy System"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="source-system">Source System</Label>
                <Input
                  id="source-system"
                  value={sourceSystem}
                  onChange={(e) => setSourceSystem(e.target.value)}
                  placeholder="e.g., PharmaCare Systems, Excel Export"
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setIsDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button 
                onClick={saveTemplate}
                disabled={isSaving}
              >
                {isSaving ? "Saving..." : "Save Template"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      
      <div className="templates-list">
        {isLoading ? (
          <div className="text-center p-4">
            <p className="text-sm text-gray-500">Loading templates...</p>
          </div>
        ) : templates.length === 0 ? (
          <div className="text-center p-4 border rounded-md bg-gray-50">
            <p className="text-sm text-gray-500">No saved templates for {migrationMode} data.</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-60 overflow-y-auto border rounded-md p-2">
            {templates.map((template) => (
              <div 
                key={template.id} 
                className="flex items-center justify-between p-2 border rounded hover:bg-gray-50"
              >
                <div>
                  <p className="text-sm font-medium">{template.name}</p>
                  <p className="text-xs text-gray-500">Source: {template.source_system}</p>
                </div>
                <div className="flex space-x-2">
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    onClick={() => handleApplyTemplate(template)}
                  >
                    Apply
                  </Button>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    onClick={() => deleteTemplate(template.id!)}
                  >
                    <Trash className="w-4 h-4 text-red-500" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
        
        <div className="mt-2 text-right">
          <Button 
            size="sm" 
            variant="ghost" 
            onClick={loadTemplates} 
            disabled={isLoading}
          >
            <Refresh className="w-4 h-4 mr-1" /> Refresh
          </Button>
        </div>
      </div>
    </div>
  );
};
