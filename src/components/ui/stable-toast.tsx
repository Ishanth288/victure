
import { toast } from "sonner";

interface StableToastProps {
  title: string;
  description?: string;
  variant?: "default" | "destructive" | "success" | "warning";
  [key: string]: any; // Allow additional properties
}

export function stableToast({ title, description, variant = "default", ...options }: StableToastProps) {
  // Map variant to the appropriate toast function
  switch (variant) {
    case "destructive":
      return toast.error(title, {
        description,
        ...options,
      });
    case "success":
      return toast.success(title, {
        description,
        ...options,
      });
    case "warning":
      return toast.warning(title, {
        description,
        ...options,
      });
    default:
      return toast(title, {
        description,
        ...options,
      });
  }
}
