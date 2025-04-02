
import { toast } from "sonner";

interface StableToastProps {
  title: string;
  description?: string;
  variant?: "default" | "destructive" | "success" | "warning";
  duration?: number;
  [key: string]: any; // Allow additional properties
}

export function stableToast({ title, description, variant = "default", duration, ...options }: StableToastProps) {
  // Map variant to the appropriate toast function
  switch (variant) {
    case "destructive":
      return toast.error(title, {
        description,
        duration,
        ...options,
      });
    case "success":
      return toast.success(title, {
        description,
        duration,
        ...options,
      });
    case "warning":
      return toast.warning(title, {
        description,
        duration,
        ...options,
      });
    default:
      return toast(title, {
        description,
        duration,
        ...options,
      });
  }
}
