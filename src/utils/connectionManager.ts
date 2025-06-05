
// Simplified connection manager without complex error handling
export const connectionManager = {
  checkConnection: async (): Promise<boolean> => {
    try {
      return navigator.onLine;
    } catch (error) {
      return false;
    }
  },

  attemptReconnect: async (): Promise<boolean> => {
    return navigator.onLine;
  },

  initialize: (): void => {
    // Minimal initialization
  }
};

export const fetchWithRetry = async (
  url: string, 
  options: RequestInit = {}
): Promise<Response> => {
  return fetch(url, options);
};
