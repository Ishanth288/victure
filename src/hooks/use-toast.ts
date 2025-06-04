import { toast as sonnerToast, ToastT } from "sonner";
import React from "react";
import { CheckCircle, AlertCircle, Info, AlertTriangle, X } from "lucide-react";

type ToastProps = Omit<ToastT, "id"> & {
  title?: string;
  description?: string;
  variant?: "default" | "destructive" | "success" | "warning" | "info";
};

// Keep track of displayed toast IDs to prevent duplicates
const activeToasts = new Set<string>();
const MAX_VISIBLE_TOASTS = 2; // Reduced from 3 to 2 to prevent overwhelming

/**
 * Professional toast function with top-notch UI/UX
 */
export function toast({
  title,
  description,
  variant = "default",
  ...props
}: ToastProps) {
  // Professionalize titles and descriptions
  let finalTitle = title;
  let finalDescription = description;
  
  // Clean up redundant success/error messages
  if (variant === "success") {
    if (!title || title.toLowerCase().includes("success")) {
      finalTitle = "Success";
    }
    if (description?.includes("successfully")) {
      finalDescription = description.replace("successfully", "").replace("  ", " ").trim();
    }
  } else if (variant === "destructive") {
    if (!title || title.toLowerCase().includes("error") || title.toLowerCase().includes("fail")) {
      finalTitle = "Error";
    }
  }

  // Create a unique ID based on content to prevent duplicates
  const toastId = `${finalTitle}-${finalDescription?.substring(0, 30)}`.replace(/\s+/g, '-');
  
  // Don't show duplicate toasts
  if (activeToasts.has(toastId)) {
    return;
  }
  
  // Limit number of concurrent toasts - dismiss oldest if at limit
  if (activeToasts.size >= MAX_VISIBLE_TOASTS) {
    const oldestToastId = activeToasts.values().next().value;
    if (oldestToastId) {
      sonnerToast.dismiss(oldestToastId);
      activeToasts.delete(oldestToastId);
    }
  }
  
  // Add to active toasts
  activeToasts.add(toastId);
  
  // Get appropriate icon and styles based on variant
  let icon = null;
  let variantClass = "";
  
  switch (variant) {
    case "destructive":
      icon = React.createElement(AlertCircle, { className: "h-5 w-5 text-red-500 flex-shrink-0" });
      variantClass = "border-red-200 bg-red-50/95 text-red-900";
      break;
    case "success":
      icon = React.createElement(CheckCircle, { className: "h-5 w-5 text-emerald-500 flex-shrink-0" });
      variantClass = "border-emerald-200 bg-emerald-50/95 text-emerald-900";
      break;
    case "warning":
      icon = React.createElement(AlertTriangle, { className: "h-5 w-5 text-amber-500 flex-shrink-0" });
      variantClass = "border-amber-200 bg-amber-50/95 text-amber-900";
      break;
    case "info":
      icon = React.createElement(Info, { className: "h-5 w-5 text-blue-500 flex-shrink-0" });
      variantClass = "border-blue-200 bg-blue-50/95 text-blue-900";
      break;
    default:
      icon = React.createElement(Info, { className: "h-5 w-5 text-gray-500 flex-shrink-0" });
      variantClass = "border-gray-200 bg-white/95 text-gray-900";
      break;
  }
  
  // Show the toast with professional styling using sonner's built-in features
  return sonnerToast(finalTitle || "", {
    description: finalDescription,
    id: toastId,
    duration: props.duration || 4000,
    position: "top-right",
    dismissible: true,
    closeButton: true,
    icon: icon,
    className: `relative w-full max-w-sm backdrop-blur-sm border-2 rounded-xl shadow-lg transition-all duration-300 ease-in-out hover:shadow-xl ${variantClass}`,
    style: {
      padding: "16px",
      margin: "8px",
      zIndex: 9999,
      borderRadius: "12px",
      backdropFilter: "blur(8px)",
      WebkitBackdropFilter: "blur(8px)",
      fontFamily: "system-ui, -apple-system, sans-serif",
    },
    ...props,
    onDismiss: () => {
      activeToasts.delete(toastId);
    },
  });
}

export function useToast() {
  return {
    toast,
    dismiss: (toastId?: string) => {
      if (toastId) {
        sonnerToast.dismiss(toastId);
        activeToasts.delete(toastId);
      } else {
        sonnerToast.dismiss();
        activeToasts.clear();
      }
    },
    error: (title: string, description?: string, opts = {}) => 
      toast({ title, description, variant: "destructive", ...opts }),
    success: (title: string, description?: string, opts = {}) => 
      toast({ title, description, variant: "success", ...opts }),
    warning: (title: string, description?: string, opts = {}) => 
      toast({ title, description, variant: "warning", ...opts }),
    info: (title: string, description?: string, opts = {}) => 
      toast({ title, description, variant: "info", ...opts }),
    // For compatibility with existing code
    toasts: [] as any[],
  };
}
