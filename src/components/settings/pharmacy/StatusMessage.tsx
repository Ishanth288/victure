
import { AlertCircle, CheckCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface StatusMessageProps {
  type: 'error' | 'success' | null;
  message: string | null;
}

export function StatusMessage({ type, message }: StatusMessageProps) {
  if (!type || !message) return null;
  
  return (
    <Alert 
      variant={type === 'error' ? 'destructive' : 'default'} 
      className={`mb-4 ${type === 'success' ? 'bg-green-50 text-green-800 border-green-200' : ''}`}
    >
      {type === 'error' ? (
        <AlertCircle className="h-4 w-4" />
      ) : (
        <CheckCircle className="h-4 w-4" />
      )}
      <AlertTitle>
        {type === 'error' ? 'Error' : 'Success'}
      </AlertTitle>
      <AlertDescription>
        {message}
      </AlertDescription>
    </Alert>
  );
}
