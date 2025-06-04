
import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { Toaster } from "@/components/ui/sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "@/components/theme-provider";
import { BrowserRouter } from "react-router-dom";
import { TooltipProvider } from "@/components/ui/tooltip";
import { supabase } from "@/integrations/supabase/client";

// Create a simplified query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000,
    },
  },
});

function Root() {
  const [isSupabaseAvailable, setIsSupabaseAvailable] = useState(false);
  const [loadingSupabase, setLoadingSupabase] = useState(true);

  useEffect(() => {
    const checkAvailability = async () => {
      try {
        // Simple connection test
        const { error } = await supabase.auth.getSession();
        setIsSupabaseAvailable(!error);
      } catch (error) {
        console.error("Supabase connection failed:", error);
        setIsSupabaseAvailable(false);
      } finally {
        setLoadingSupabase(false);
      }
    };
    checkAvailability();
  }, []);

  if (loadingSupabase) {
    return <div className="flex items-center justify-center h-screen text-lg">Connecting to Supabase...</div>;
  }

  if (!isSupabaseAvailable) {
    return (
      <div className="flex flex-col items-center justify-center h-screen text-lg text-red-500">
        <p>Failed to connect to Supabase.</p>
        <p>Please check your network connection or Supabase configuration.</p>
      </div>
    );
  }

  return (
    <React.StrictMode>
      <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <BrowserRouter>
              <App />
              <Toaster position="top-center" richColors closeButton />
            </BrowserRouter>
          </TooltipProvider>
        </QueryClientProvider>
      </ThemeProvider>
    </React.StrictMode>
  );
}

// Add global error handlers
window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
  event.preventDefault();
});

window.addEventListener('error', (event) => {
  console.error('Global error:', event.error);
});

const root = ReactDOM.createRoot(document.getElementById("root")!); 
root.render(<Root />);
