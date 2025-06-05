
// Minimal connection manager
export const connectionManager = {
  checkConnection: async (): Promise<boolean> => {
    try {
      return navigator.onLine;
    } catch (error) {
      console.warn('Connection check failed:', error);
      return false;
    }
  },

  attemptReconnect: async (): Promise<boolean> => {
    console.log('Attempting reconnect...');
    return navigator.onLine;
  },

  initialize: (): void => {
    console.log('Connection manager initialized');
  }
};

export const fetchWithRetry = async (
  url: string, 
  options: RequestInit = {}
): Promise<Response> => {
  try {
    return await fetch(url, options);
  } catch (error) {
    console.warn('Fetch failed:', error);
    throw error;
  }
};
