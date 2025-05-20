import { toast as sonnerToast, ToastT } from "sonner";
import { CheckCircle, AlertCircle, Info, AlertTriangle, X } from "lucide-react";

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
    // Pass the oldest toast ID to dismiss if available, or a dummy ID
    const oldestToastId = activeToasts.values().next().value || "oldest-toast";
    sonnerToast.dismiss(oldestToastId);
  }
  
  // Add to active toasts
  activeToasts.add(toastId);
  
  // Get appropriate icon based on variant
  let icon = null;
  switch (variant) {
    case "destructive":
      icon = <AlertCircle className="h-4 w-4 text-red-600" />;
      break;
    case "success":
      icon = <CheckCircle className="h-4 w-4 text-emerald-600" />;
      break;
    case "warning":
      icon = <AlertTriangle className="h-4 w-4 text-amber-600" />;
      break;
    case "info":
      icon = <Info className="h-4 w-4 text-blue-600" />;
      break;
  }
  
  // Determine variant-specific styles
  const variantStyles = {
    default: "",
    destructive: "border-red-500/50 text-red-600",
    success: "border-emerald-500/50 text-emerald-600",
    warning: "border-amber-500/50 text-amber-600",
    info: "border-blue-500/50 text-blue-600",
  };
  
  // Show the toast with enhanced styling
  return sonnerToast(title ?? "", {
    description,
    id: toastId,
    ...props,
    classNames: {
      toast: `relative rounded-lg border shadow-lg ${variantStyles[variant]} px-4 py-3`,
      title: "text-sm font-medium",
      description: "text-sm text-muted-foreground mt-1",
    },
    icon: icon,
    closeButton: true,
    duration: props.duration || 5000,
    onDismiss: (toast) => {
      activeToasts.delete(toastId);
      if (props.onDismiss) {
        // Calling onDismiss with the toast object as required by the type
        props.onDismiss(toast);
      }
    },
  });
}

export function useToast() {
  return {
    toast,
    dismiss: (toastId: string = "all-toasts") => sonnerToast.dismiss(toastId),
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
