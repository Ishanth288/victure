
import { useState, useEffect } from "react";
import { connectionManager } from "@/utils/connectionManager";

export interface ConnectionStatusOptions {
  pollingInterval?: number;
  onReconnect?: () => void;
  onDisconnect?: () => void;
  autoRetry?: boolean;
  maxRetries?: number;
}

/**
 * Hook for monitoring connection status and managing reconnection
 */
export function useConnectionStatus(options: ConnectionStatusOptions = {}) {
  const {
    pollingInterval = 30000, // Check connection every 30 seconds by default
    onReconnect,
    onDisconnect,
    autoRetry = true,
    maxRetries = 5
  } = options;
  
  const [isConnected, setIsConnected] = useState<boolean>(true);
  const [isChecking, setIsChecking] = useState<boolean>(false);

  // Function to check connection
  const checkConnection = async () => {
    if (isChecking) return;
    
    setIsChecking(true);
    
    try {
      const connectionStatus = await connectionManager.checkConnection();
      
      // Update connection state if it changed
      if (connectionStatus !== isConnected) {
        setIsConnected(connectionStatus);
        
        if (connectionStatus) {
          // Connection restored
          if (onReconnect) {
            onReconnect();
          }
        } else {
          // Connection lost
          if (onDisconnect) {
            onDisconnect();
          }
          
          // Auto retry if enabled
          if (autoRetry) {
            connectionManager.attemptReconnect({
              maxRetries,
              onReconnectSuccess: onReconnect
            });
          }
        }
      }
    } finally {
      setIsChecking(false);
    }
  };

  // Force a connection check
  const forceCheck = () => {
    checkConnection();
  };

  // Set up regular connection checking
  useEffect(() => {
    // Initial check
    checkConnection();
    
    // Set up interval for regular checks
    const intervalId = setInterval(() => {
      checkConnection();
    }, pollingInterval);
    
    return () => {
      clearInterval(intervalId);
    };
  }, [pollingInterval]);

  return {
    isConnected,
    isChecking,
    checkConnection: forceCheck
  };
}
