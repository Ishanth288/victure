
import { toast, ToastOptions } from "sonner";

interface StableToastProps extends ToastOptions {
  title: string;
  description?: string;
  variant?: "default" | "destructive" | "success" | "warning";
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
