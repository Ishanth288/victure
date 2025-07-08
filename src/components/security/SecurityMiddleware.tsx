import React, { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { sessionValidator } from '@/utils/sessionValidation';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Shield, AlertTriangle } from 'lucide-react';

interface SecurityMiddlewareProps {
  children: React.ReactNode;
  requireReauth?: boolean;
  sensitiveOperation?: boolean;
  fallback?: React.ReactNode;
}

/**
 * Security middleware component that validates sessions and protects sensitive operations
 */
export function SecurityMiddleware({ 
  children, 
  requireReauth = false, 
  sensitiveOperation = false,
  fallback 
}: SecurityMiddlewareProps) {
  const { user, session } = useAuth();
  const [isValidating, setIsValidating] = useState(true);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [requiresReauth, setRequiresReauth] = useState(false);

  useEffect(() => {
    const validateAccess = async () => {
      setIsValidating(true);
      setValidationError(null);
      setRequiresReauth(false);

      try {
        // Basic auth check
        if (!user || !session) {
          setValidationError('Authentication required');
          setIsValidating(false);
          return;
        }

        // Check for sensitive operations
        if (sensitiveOperation) {
          const isValid = await sessionValidator.validateForSensitiveOperation();
          if (!isValid) {
            setRequiresReauth(true);
            setValidationError('Recent authentication required for this operation');
            setIsValidating(false);
            return;
          }
        }

        // Additional re-auth check
        if (requireReauth) {
          setRequiresReauth(true);
          setValidationError('Please confirm your identity to continue');
          setIsValidating(false);
          return;
        }

        setIsValidating(false);
      } catch (error) {
        console.error('Security validation error:', error);
        setValidationError('Security validation failed');
        setIsValidating(false);
      }
    };

    validateAccess();
  }, [user, session, requireReauth, sensitiveOperation]);

  const handleReauth = async () => {
    try {
      // In a real implementation, you would show a re-authentication modal
      // For now, we'll just refresh the session
      const refreshed = await sessionValidator.validateForSensitiveOperation();
      if (refreshed) {
        setRequiresReauth(false);
        setValidationError(null);
      } else {
        setValidationError('Re-authentication failed. Please sign in again.');
      }
    } catch (error) {
      console.error('Re-authentication error:', error);
      setValidationError('Re-authentication failed');
    }
  };

  // Show loading state
  if (isValidating) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="flex items-center space-x-2">
          <Shield className="h-5 w-5 animate-pulse text-blue-500" />
          <span className="text-sm text-gray-600">Validating security...</span>
        </div>
      </div>
    );
  }

  // Show validation error
  if (validationError) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <div className="p-6">
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            <div className="space-y-3">
              <p>{validationError}</p>
              {requiresReauth && (
                <Button 
                  onClick={handleReauth}
                  variant="outline"
                  size="sm"
                  className="border-red-300 text-red-700 hover:bg-red-100"
                >
                  <Shield className="h-4 w-4 mr-2" />
                  Verify Identity
                </Button>
              )}
            </div>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Render children if validation passes
  return <>{children}</>;
}

/**
 * Higher-order component for protecting sensitive operations
 */
export function withSecurityMiddleware<P extends object>(
  Component: React.ComponentType<P>,
  options: {
    requireReauth?: boolean;
    sensitiveOperation?: boolean;
    fallback?: React.ReactNode;
  } = {}
) {
  return function ProtectedComponent(props: P) {
    return (
      <SecurityMiddleware {...options}>
        <Component {...props} />
      </SecurityMiddleware>
    );
  };
}

/**
 * Hook for validating sensitive operations
 */
export function useSecurityValidation() {
  const { user, session } = useAuth();

  const validateSensitiveOperation = async (): Promise<boolean> => {
    if (!user || !session) {
      return false;
    }

    return await sessionValidator.validateForSensitiveOperation();
  };

  const forceLogoutAllSessions = async (reason: string): Promise<void> => {
    if (!user) {
      return;
    }

    await sessionValidator.forceLogoutAllSessions(user.id, reason);
  };

  return {
    validateSensitiveOperation,
    forceLogoutAllSessions,
    isAuthenticated: !!user && !!session
  };
}