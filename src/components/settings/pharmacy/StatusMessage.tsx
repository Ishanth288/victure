
import { AlertCircle, CheckCircle } from "lucide-react";
import { Alert, AlertContent, AlertTitle, AlertDescription } from "@/components/ui/alert";

interface StatusMessageProps {
  type: 'error' | 'success' | null;
  message: string | null;
}

export function StatusMessage({ type, message }: StatusMessageProps) {
  if (!type || !message) return null;
  
  return (
    <Alert 
      variant={type === 'error' ? 'error' : 'success'} 
      className="mb-4"
      icon={type === 'error' ? 
        <AlertCircle className="h-4 w-4" /> : 
        <CheckCircle className="h-4 w-4" />
      }
    >
      <AlertContent>
        <AlertTitle>
          {type === 'error' ? 'Error' : 'Success'}
        </AlertTitle>
        <AlertDescription>
          {message}
        </AlertDescription>
      </AlertContent>
    </Alert>
  );
}
