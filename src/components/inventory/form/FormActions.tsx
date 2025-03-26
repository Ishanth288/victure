
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface FormActionsProps {
  onCancel: () => void;
  onSubmit: () => Promise<void>;
  isSubmitting: boolean;
  isEdit: boolean;
}

export default function FormActions({
  onCancel,
  onSubmit,
  isSubmitting,
  isEdit
}: FormActionsProps) {
  return (
    <div className="flex justify-end gap-2">
      <Button
        variant="outline"
        onClick={onCancel}
        disabled={isSubmitting}
      >
        Cancel
      </Button>
      <Button 
        onClick={onSubmit}
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {isEdit ? "Saving..." : "Adding..."}
          </>
        ) : (
          isEdit ? "Save Changes" : "Add Item"
        )}
      </Button>
    </div>
  );
}
