/**
 * Session Status Indicator Component
 * Priority 3 Security Implementation
 * Shows current session status and time remaining
 */

import React, { useState, useEffect } from 'react';
import { Shield, Clock, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { sessionManager } from '@/utils/sessionManager';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface SessionStatusIndicatorProps {
  className?: string;
  showTimeRemaining?: boolean;
  showStatusText?: boolean;
  compact?: boolean;
}

type SessionStatus = 'active' | 'warning' | 'critical' | 'expired' | 'invalid';

export const SessionStatusIndicator: React.FC<SessionStatusIndicatorProps> = ({
  className,
  showTimeRemaining = true,
  showStatusText = true,
  compact = false,
}) => {
  const [status, setStatus] = useState<SessionStatus>('invalid');
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [lastUpdate, setLastUpdate] = useState(Date.now());

  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    const updateStatus = () => {
      const isValid = sessionManager.isSessionValid();
      const remaining = sessionManager.getTimeUntilExpiry();
      
      setTimeRemaining(remaining);
      setLastUpdate(Date.now());

      if (!isValid) {
        setStatus('invalid');
      } else if (remaining <= 0) {
        setStatus('expired');
      } else if (remaining <= 60000) { // 1 minute
        setStatus('critical');
      } else if (remaining <= 300000) { // 5 minutes
        setStatus('warning');
      } else {
        setStatus('active');
      }
    };

    // Update immediately
    updateStatus();

    // Update every 10 seconds
    intervalId = setInterval(updateStatus, 10000);

    // Listen for session changes
    const unsubscribe = sessionManager.onSessionChange(() => {
      updateStatus();
    });

    return () => {
      if (intervalId) clearInterval(intervalId);
      unsubscribe();
    };
  }, []);

  const getStatusConfig = (status: SessionStatus) => {
    switch (status) {
      case 'active':
        return {
          icon: CheckCircle,
          color: 'text-green-600',
          bgColor: 'bg-green-100',
          borderColor: 'border-green-200',
          label: 'Active',
          description: 'Session is active and secure'
        };
      case 'warning':
        return {
          icon: AlertTriangle,
          color: 'text-amber-600',
          bgColor: 'bg-amber-100',
          borderColor: 'border-amber-200',
          label: 'Warning',
          description: 'Session will expire soon'
        };
      case 'critical':
        return {
          icon: AlertTriangle,
          color: 'text-red-600',
          bgColor: 'bg-red-100',
          borderColor: 'border-red-200',
          label: 'Critical',
          description: 'Session expires very soon'
        };
      case 'expired':
        return {
          icon: XCircle,
          color: 'text-red-700',
          bgColor: 'bg-red-100',
          borderColor: 'border-red-300',
          label: 'Expired',
          description: 'Session has expired'
        };
      case 'invalid':
      default:
        return {
          icon: XCircle,
          color: 'text-gray-600',
          bgColor: 'bg-gray-100',
          borderColor: 'border-gray-200',
          label: 'Invalid',
          description: 'No active session'
        };
    }
  };

  const formatTimeRemaining = (ms: number): string => {
    if (ms <= 0) return '0:00';
    
    const hours = Math.floor(ms / 3600000);
    const minutes = Math.floor((ms % 3600000) / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const getTimeRemainingText = (): string => {
    if (timeRemaining <= 0) return 'Expired';
    
    const hours = Math.floor(timeRemaining / 3600000);
    const minutes = Math.floor((timeRemaining % 3600000) / 60000);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m remaining`;
    } else if (minutes > 0) {
      return `${minutes}m remaining`;
    } else {
      const seconds = Math.floor(timeRemaining / 1000);
      return `${seconds}s remaining`;
    }
  };

  const config = getStatusConfig(status);
  const Icon = config.icon;

  if (compact) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className={cn(
              "flex items-center gap-1 px-2 py-1 rounded-md border",
              config.bgColor,
              config.borderColor,
              className
            )}>
              <Icon className={cn("h-3 w-3", config.color)} />
              {showTimeRemaining && timeRemaining > 0 && (
                <span className={cn("text-xs font-mono", config.color)}>
                  {formatTimeRemaining(timeRemaining)}
                </span>
              )}
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <div className="text-sm">
              <div className="font-medium">{config.label} Session</div>
              <div className="text-muted-foreground">{config.description}</div>
              {timeRemaining > 0 && (
                <div className="text-xs mt-1">{getTimeRemainingText()}</div>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <div className={cn(
      "flex items-center gap-2 px-3 py-2 rounded-lg border",
      config.bgColor,
      config.borderColor,
      className
    )}>
      <div className="flex items-center gap-2">
        <Shield className="h-4 w-4 text-gray-600" />
        <Icon className={cn("h-4 w-4", config.color)} />
        
        {showStatusText && (
          <span className={cn("text-sm font-medium", config.color)}>
            {config.label}
          </span>
        )}
      </div>
      
      {showTimeRemaining && timeRemaining > 0 && (
        <div className="flex items-center gap-1 ml-auto">
          <Clock className={cn("h-3 w-3", config.color)} />
          <span className={cn("text-xs font-mono", config.color)}>
            {formatTimeRemaining(timeRemaining)}
          </span>
        </div>
      )}
      
      {!showTimeRemaining && timeRemaining > 0 && (
        <Badge variant="outline" className={cn("text-xs", config.color)}>
          {getTimeRemainingText()}
        </Badge>
      )}
    </div>
  );
};

export default SessionStatusIndicator;