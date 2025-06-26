import React from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, Wifi, Database } from 'lucide-react';

interface InventoryErrorStateProps {
  error: string;
  onRetry: () => void;
  isRetrying?: boolean;
}

const InventoryErrorState: React.FC<InventoryErrorStateProps> = ({ 
  error, 
  onRetry, 
  isRetrying = false 
}) => {
  const getErrorIcon = () => {
    if (error.toLowerCase().includes('network') || error.toLowerCase().includes('connection')) {
      return <Wifi className="h-4 w-4" />;
    }
    if (error.toLowerCase().includes('database') || error.toLowerCase().includes('query')) {
      return <Database className="h-4 w-4" />;
    }
    return <AlertTriangle className="h-4 w-4" />;
  };

  const getErrorTitle = () => {
    if (error.toLowerCase().includes('network') || error.toLowerCase().includes('connection')) {
      return 'Connection Error';
    }
    if (error.toLowerCase().includes('database') || error.toLowerCase().includes('query')) {
      return 'Database Error';
    }
    if (error.toLowerCase().includes('auth')) {
      return 'Authentication Error';
    }
    return 'Error Loading Inventory';
  };

  const getErrorSuggestion = () => {
    if (error.toLowerCase().includes('network') || error.toLowerCase().includes('connection')) {
      return 'Please check your internet connection and try again.';
    }
    if (error.toLowerCase().includes('auth')) {
      return 'Please log out and log back in to refresh your session.';
    }
    return 'This might be a temporary issue. Please try again in a few moments.';
  };

  return (
    <div className="bg-white p-6 md:p-8 rounded-xl shadow-xl">
      <Alert variant="error">
        {getErrorIcon()}
        <AlertTitle>{getErrorTitle()}</AlertTitle>
        <AlertDescription className="mt-2">
          <div className="space-y-3">
            <p>{error}</p>
            <p className="text-sm text-gray-600">
              {getErrorSuggestion()}
            </p>
            <div className="flex flex-col sm:flex-row gap-2 mt-4">
              <Button 
                onClick={onRetry}
                disabled={isRetrying}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${isRetrying ? 'animate-spin' : ''}`} />
                {isRetrying ? 'Retrying...' : 'Try Again'}
              </Button>
              <Button 
                onClick={() => window.location.reload()}
                variant="outline"
                size="sm"
              >
                Reload Page
              </Button>
            </div>
          </div>
        </AlertDescription>
      </Alert>
      
      {/* Helpful tips */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <h3 className="font-medium text-blue-900 mb-2">Troubleshooting Tips:</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Ensure you have a stable internet connection</li>
          <li>• Try refreshing the page if the error persists</li>
          <li>• Contact support if you continue experiencing issues</li>
        </ul>
      </div>
    </div>
  );
};

export default InventoryErrorState;