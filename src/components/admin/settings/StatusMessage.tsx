
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, Info, CheckCircle } from "lucide-react";

interface StatusMessageProps {
  type: 'success' | 'error' | 'info' | null;
  message: string | null;
}

export function StatusMessage({ type, message }: StatusMessageProps) {
  if (!type || !message) return null;
  
  return (
    <Alert 
      variant={type === 'error' ? 'destructive' : 'default'} 
      className={`mb-4 
        ${type === 'success' ? 'bg-green-50 text-green-800 border-green-200' : ''} 
        ${type === 'info' ? 'bg-blue-50 text-blue-800 border-blue-200' : ''}
      `}
    >
      {type === 'error' ? (
        <AlertTriangle className="h-4 w-4" />
      ) : type === 'info' ? (
        <Info className="h-4 w-4" />
      ) : (
        <CheckCircle className="h-4 w-4" />
      )}
      <AlertTitle>
        {type === 'error' ? 'Error' : type === 'info' ? 'Information' : 'Success'}
      </AlertTitle>
      <AlertDescription>
        {message}
      </AlertDescription>
    </Alert>
  );
}
