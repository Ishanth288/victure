
import { Alert, AlertContent, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, Info, CheckCircle } from "lucide-react";

interface StatusMessageProps {
  type: 'success' | 'error' | 'info' | null;
  message: string | null;
}

export function StatusMessage({ type, message }: StatusMessageProps) {
  if (!type || !message) return null;
  
  const getIcon = () => {
    switch (type) {
      case 'error':
        return <AlertTriangle className="h-4 w-4" />;
      case 'info':
        return <Info className="h-4 w-4" />;
      case 'success':
        return <CheckCircle className="h-4 w-4" />;
      default:
        return null;
    }
  };
  
  const getVariant = () => {
    switch (type) {
      case 'error':
        return 'error';
      case 'info':
        return 'info';
      case 'success':
        return 'success';
      default:
        return 'default';
    }
  };
  
  return (
    <Alert 
      variant={getVariant()}
      className="mb-4"
      icon={getIcon()}
    >
      <AlertContent>
        <AlertTitle>
          {type === 'error' ? 'Error' : type === 'info' ? 'Information' : 'Success'}
        </AlertTitle>
        <AlertDescription>
          {message}
        </AlertDescription>
      </AlertContent>
    </Alert>
  );
}
