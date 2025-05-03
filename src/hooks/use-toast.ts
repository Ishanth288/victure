
import { toast as sonnerToast, ToastT } from "sonner";

type ToastProps = Omit<ToastT, "id"> & {
  title?: string;
  description?: string;
  variant?: "default" | "destructive" | "success" | "warning" | "info";
};

// Keep track of displayed toast IDs to prevent duplicates
const activeToasts = new Set<string>();
const MAX_VISIBLE_TOASTS = 3;

/**
 * Enhanced toast function that prevents duplicates and limits concurrent toasts
 */
export function toast({
  title,
  description,
  variant = "default",
  ...props
}: ToastProps) {
  // Create a unique ID based on content to prevent duplicates
  const toastId = `${title}-${description?.substring(0, 20)}`;
  
  // Don't show duplicate toasts
  if (activeToasts.has(toastId)) {
    return;
  }
  
  // Limit number of concurrent toasts
  if (activeToasts.size >= MAX_VISIBLE_TOASTS) {
    sonnerToast.dismiss();
  }
  
  // Add to active toasts
  activeToasts.add(toastId);
  
  // Determine variant-specific styles
  const variantStyles = {
    default: "",
    destructive: "bg-destructive text-destructive-foreground border border-destructive/20",
    success: "bg-green-50 text-green-800 border border-green-200",
    warning: "bg-yellow-50 text-yellow-800 border border-yellow-200",
    info: "bg-blue-50 text-blue-800 border border-blue-200",
  };
  
  // Show the toast
  return sonnerToast(title ?? "", {
    description,
    id: toastId,
    ...props,
    className: `shadow-lg ${variantStyles[variant]}`,
    duration: props.duration || 5000,
    onDismiss: (toastData) => {
      activeToasts.delete(toastId);
      if (props.onDismiss) {
        props.onDismiss(toastData);
      }
    },
  });
}

export function useToast() {
  return {
    toast,
    dismiss: sonnerToast.dismiss,
    error: (message: string, opts = {}) => 
      toast({ title: message, variant: "destructive", ...opts }),
    success: (message: string, opts = {}) => 
      toast({ title: message, variant: "success", ...opts }),
    warning: (message: string, opts = {}) => 
      toast({ title: message, variant: "warning", ...opts }),
    info: (message: string, opts = {}) => 
      toast({ title: message, variant: "info", ...opts }),
    // The Toaster component expects this, so we need to add it
    toasts: [] as any[],
  };
}
