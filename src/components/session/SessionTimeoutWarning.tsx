/**
 * Session Timeout Warning Component
 * Priority 3 Security Implementation
 * Shows session expiry warnings and handles session extension
 */

import React, { useState, useEffect } from 'react';
import { AlertTriangle, Clock, RefreshCw, LogOut } from 'lucide-react';
import { sessionManager } from '@/utils/sessionManager';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';

interface SessionTimeoutWarningProps {
  warningThreshold?: number; // milliseconds before expiry to show warning
  autoLogoutThreshold?: number; // milliseconds before expiry to auto logout
}

export const SessionTimeoutWarning: React.FC<SessionTimeoutWarningProps> = ({
  warningThreshold = 5 * 60 * 1000, // 5 minutes
  autoLogoutThreshold = 60 * 1000, // 1 minute
}) => {
  const [showWarning, setShowWarning] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isExtending, setIsExtending] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    let warningTimeoutId: NodeJS.Timeout;
    let logoutTimeoutId: NodeJS.Timeout;

    const checkSessionTimeout = () => {
      if (!sessionManager.isSessionValid()) {
        setShowWarning(false);
        return;
      }

      const remaining = sessionManager.getTimeUntilExpiry();
      setTimeRemaining(remaining);

      // Show warning if within threshold
      if (remaining <= warningThreshold && remaining > autoLogoutThreshold) {
        if (!showWarning) {
          setShowWarning(true);
          toast({
            title: "Session Expiring Soon",
            description: "Your session will expire soon. Please extend it to continue.",
            variant: "destructive",
          });
        }
      } else if (remaining <= autoLogoutThreshold) {
        // Auto logout if very close to expiry
        handleAutoLogout();
      } else {
        setShowWarning(false);
      }
    };

    const handleAutoLogout = async () => {
      setShowWarning(false);
      toast({
        title: "Session Expired",
        description: "Your session has expired. You will be logged out automatically.",
        variant: "destructive",
      });
      
      setTimeout(() => {
        sessionManager.logout('Session expired - auto logout');
      }, 2000);
    };

    // Check immediately
    checkSessionTimeout();

    // Set up interval to check every 10 seconds
    intervalId = setInterval(checkSessionTimeout, 10000);

    // Listen for session changes
    const unsubscribe = sessionManager.onSessionChange((session) => {
      if (!session) {
        setShowWarning(false);
        setTimeRemaining(0);
      }
    });

    return () => {
      if (intervalId) clearInterval(intervalId);
      if (warningTimeoutId) clearTimeout(warningTimeoutId);
      if (logoutTimeoutId) clearTimeout(logoutTimeoutId);
      unsubscribe();
    };
  }, [warningThreshold, autoLogoutThreshold, showWarning, toast]);

  const handleExtendSession = async () => {
    setIsExtending(true);
    
    try {
      const success = await sessionManager.extendSession();
      
      if (success) {
        setShowWarning(false);
        toast({
          title: "Session Extended",
          description: "Your session has been successfully extended.",
          variant: "default",
        });
      } else {
        toast({
          title: "Extension Failed",
          description: "Failed to extend session. Please log in again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Session extension error:', error);
      toast({
        title: "Extension Error",
        description: "An error occurred while extending your session.",
        variant: "destructive",
      });
    } finally {
      setIsExtending(false);
    }
  };

  const handleLogoutNow = async () => {
    setShowWarning(false);
    await sessionManager.logout('User chose to logout from warning dialog');
  };

  const formatTimeRemaining = (ms: number): string => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const getProgressValue = (): number => {
    const totalWarningTime = warningThreshold - autoLogoutThreshold;
    const currentWarningTime = timeRemaining - autoLogoutThreshold;
    return Math.max(0, Math.min(100, (currentWarningTime / totalWarningTime) * 100));
  };

  if (!showWarning) return null;

  return (
    <Dialog open={showWarning} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-amber-600">
            <AlertTriangle className="h-5 w-5" />
            Session Expiring Soon
          </DialogTitle>
          <DialogDescription className="space-y-4">
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Clock className="h-4 w-4 text-amber-500" />
                <span className="text-lg font-mono font-semibold text-amber-600">
                  {formatTimeRemaining(timeRemaining)}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                Your session will expire automatically to protect your account.
              </p>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Time Remaining</span>
                <span>{Math.floor(timeRemaining / 60000)} minutes</span>
              </div>
              <Progress 
                value={getProgressValue()} 
                className="h-2"
              />
            </div>
            
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <p className="text-xs text-amber-800">
                <strong>Security Notice:</strong> For your protection, we automatically log out inactive sessions.
                Click "Extend Session" to continue working.
              </p>
            </div>
          </DialogDescription>
        </DialogHeader>
        
        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={handleLogoutNow}
            className="flex items-center gap-2"
          >
            <LogOut className="h-4 w-4" />
            Logout Now
          </Button>
          
          <Button
            onClick={handleExtendSession}
            disabled={isExtending}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
          >
            {isExtending ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                Extending...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4" />
                Extend Session
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SessionTimeoutWarning;