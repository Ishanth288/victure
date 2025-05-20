import React, { useState, useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  getMappingTemplates,
  saveMappingTemplate,
  deleteMappingTemplate
} from "@/utils/migration";
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
  onApplyTemplate,
}) => {
  const [templateName, setTemplateName] = useState("");
  const [sourceSystem, setSourceSystem] = useState("");
  const [mappingTemplates, setMappingTemplates] = useState<MappingTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [open, setOpen] = React.useState(false);

  useEffect(() => {
    loadMappingTemplates();
  }, [migrationMode]);

  const loadMappingTemplates = async () => {
    try {
      const templates = await getMappingTemplates(migrationMode);
      setMappingTemplates(templates);
    } catch (err) {
      console.error("Failed to load mapping templates:", err);
    }
  };

  const handleSaveTemplate = async () => {
    if (!templateName || !sourceSystem) {
      alert("Please enter a template name and source system.");
      return;
    }

    setIsSaving(true);

    try {
      const templateToSave: MappingTemplate = {
        name: templateName,
        source_system: sourceSystem,
        data_type: migrationMode,
        mappings: selectedFields,
      };

      const success = await saveMappingTemplate(templateToSave);

      if (success) {
        alert("Template saved successfully!");
        setTemplateName("");
        setSourceSystem("");
        loadMappingTemplates();
      } else {
        alert("Failed to save template.");
      }
    } catch (err) {
      console.error("Error saving template:", err);
      alert("Error saving template.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteTemplate = async () => {
    if (!selectedTemplate) {
      alert("Please select a template to delete.");
      return;
    }

    setIsDeleting(true);

    try {
      const success = await deleteMappingTemplate(selectedTemplate);

      if (success) {
        alert("Template deleted successfully!");
        setSelectedTemplate(null);
        loadMappingTemplates();
        setOpen(false);
      } else {
        alert("Failed to delete template.");
      }
    } catch (err) {
      console.error("Error deleting template:", err);
      alert("Error deleting template.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId);
    const template = mappingTemplates.find((t) => t.id === templateId);
    if (template) {
      onApplyTemplate(template);
    }
  };

  return (
    <div className="space-y-4">
      <h4 className="text-md font-medium">Mapping Template Management</h4>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="templateName">Template Name</Label>
          <Input
            type="text"
            id="templateName"
            value={templateName}
            onChange={(e) => setTemplateName(e.target.value)}
          />
        </div>

        <div>
          <Label htmlFor="sourceSystem">Source System</Label>
          <Input
            type="text"
            id="sourceSystem"
            value={sourceSystem}
            onChange={(e) => setSourceSystem(e.target.value)}
          />
        </div>
      </div>

      <Button onClick={handleSaveTemplate} disabled={isSaving}>
        {isSaving ? "Saving..." : "Save Template"}
      </Button>

      <div className="space-y-2">
        <Label htmlFor="existingTemplates">Existing Templates</Label>
        <Select onValueChange={handleTemplateSelect}>
          <SelectTrigger id="existingTemplates">
            <SelectValue placeholder="Select a template" />
          </SelectTrigger>
          <SelectContent>
            {mappingTemplates.map((template) => (
              <SelectItem key={template.id} value={template.id || ""}>
                {template.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogTrigger asChild>
          <Button
            variant="destructive"
            disabled={!selectedTemplate}
          >
            Delete Template
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. Are you sure you want to delete this
              template?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteTemplate} disabled={isDeleting}>
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
