
import { toast as sonnerToast, ToastT } from "sonner";

type ToastProps = Omit<ToastT, "id"> & {
  title?: string;
  description?: string;
  variant?: "default" | "destructive" | "success";
};

export function toast({
  title,
  description,
  variant = "default",
  ...props
}: ToastProps) {
  return sonnerToast(title ?? "", {
    description,
    ...props,
    className: variant === "destructive" 
      ? "bg-destructive text-destructive-foreground"
      : variant === "success" 
      ? "bg-green-500 text-white"
      : "",
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
      toast({ title: message, ...opts }),
    info: (message: string, opts = {}) => 
      toast({ title: message, ...opts }),
    // The Toaster component expects this, so we need to add it
    toasts: [] as any[],
  };
}
