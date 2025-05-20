
import { Alert, AlertContent } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertTriangle, X } from "lucide-react";

interface AlertNotificationProps {
  message: string;
  onClose?: () => void;
  variant?: "warning" | "error" | "success" | "info" | "default";
}

export function AlertNotification({ 
  message, 
  onClose,
  variant = "warning" 
}: AlertNotificationProps) {
  return (
    <Alert
      layout="row"
      isNotification
      variant={variant}
      icon={
        <AlertTriangle className={`${
          variant === "warning" ? "text-amber-500" : 
          variant === "error" ? "text-red-500" : 
          variant === "success" ? "text-emerald-500" : 
          variant === "info" ? "text-blue-500" : "text-gray-500"
        }`} size={16} strokeWidth={2} />
      }
      action={onClose ? (
        <Button
          variant="ghost"
          className="group -my-1.5 -me-2 h-8 w-8 p-0 hover:bg-transparent"
          aria-label="Close notification"
          onClick={onClose}
        >
          <X
            size={16}
            strokeWidth={2}
            className="opacity-60 transition-opacity group-hover:opacity-100"
          />
        </Button>
      ) : undefined}
    >
      <p className="text-sm">{message}</p>
    </Alert>
  );
}
