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
  // Professionalize default titles for common variants
  let finalTitle = title;
  let finalDescription = description;
  if (variant === "success" && (!title || title.toLowerCase().includes("success"))) {
    finalTitle = "Action Completed";
    if (!description) finalDescription = "Your request was processed successfully.";
  } else if (variant === "destructive" && (!title || title.toLowerCase().includes("error") || title.toLowerCase().includes("fail"))) {
    finalTitle = "Something Went Wrong";
    if (!description) finalDescription = "We couldn't complete your request. Please try again.";
  } else if (variant === "info" && (!title || title.toLowerCase().includes("info"))) {
    finalTitle = "Information";
  } else if (variant === "warning" && (!title || title.toLowerCase().includes("warning"))) {
    finalTitle = "Attention Needed";
  }
  // Create a unique ID based on content to prevent duplicates
  const toastId = `${finalTitle}-${finalDescription?.substring(0, 20)}`;
  
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
  const iconProps = { className: "h-4 w-4" };
  
  switch (variant) {
    case "destructive":
      icon = React.createElement(AlertCircle, { className: "h-4 w-4 text-red-600" });
      break;
    case "success":
      icon = React.createElement(CheckCircle, { className: "h-4 w-4 text-emerald-600" });
      break;
    case "warning":
      icon = React.createElement(AlertTriangle, { className: "h-4 w-4 text-amber-600" });
      break;
    case "info":
      icon = React.createElement(Info, { className: "h-4 w-4 text-blue-600" });
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
  return sonnerToast(finalTitle ?? "", {
    description: finalDescription,
    id: toastId,
    ...props,
    classNames: {
      toast: `relative rounded-xl border shadow-2xl bg-white/70 backdrop-blur-md transition-all duration-500 ease-in-out animate-slide-in ${variantStyles[variant]} px-6 py-4 flex items-start gap-3 hover:shadow-3xl`,
      title: "text-base font-bold tracking-tight text-gray-900",
      description: "text-sm text-gray-700 mt-1",
    },
    icon: icon,
    closeButton: true,
    duration: props.duration || 4000,
    onDismiss: (toast) => {
      activeToasts.delete(toastId);
      if (props.onDismiss) {
        props.onDismiss(toast);
      }
    },
    style: {
      boxShadow: "0 8px 32px 0 rgba(31, 38, 135, 0.37)",
      border: "1.5px solid rgba(255,255,255,0.18)",
      background: "rgba(255,255,255,0.85)",
      backdropFilter: "blur(8px)",
      WebkitBackdropFilter: "blur(8px)",
      color: variant === "destructive" ? "#dc2626" : variant === "success" ? "#059669" : variant === "warning" ? "#d97706" : variant === "info" ? "#2563eb" : "#111827",
      zIndex: 9999,
      marginTop: 12,
      marginBottom: 12,
      marginLeft: 0,
      marginRight: 0,
      minWidth: 320,
      maxWidth: 420,
      pointerEvents: "auto",
    },
    // Custom animation (slide in from top)
    animation: {
      enter: "animate-slide-in",
      exit: "animate-fade-out",
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
