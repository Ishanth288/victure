import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { Toaster } from "@/components/ui/sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "@/components/theme-provider";
import { BrowserRouter } from "react-router-dom";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import { InventoryProvider } from "./contexts/InventoryContext";
import { BillingProvider } from "./contexts/BillingContext";
import { checkSupabaseAvailability } from "./integrations/supabase/client";

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

// 🧹 CRITICAL: Clear any form-related localStorage on app startup
console.log("🧹 Clearing any cached form data on app startup");
localStorage.removeItem('billingFormData');
localStorage.removeItem('patientFormData');
localStorage.removeItem('prescriptionFormData');

function Root() {
  const [isSupabaseAvailable, setIsSupabaseAvailable] = useState(false);
  const [loadingSupabase, setLoadingSupabase] = useState(true);

  useEffect(() => {
    const checkAvailability = async () => {
      const result = await checkSupabaseAvailability();
      setIsSupabaseAvailable(result.available || false);
      setLoadingSupabase(false);
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
              <AuthProvider>
                <InventoryProvider>
                  <BillingProvider>
                    <App />
                  </BillingProvider>
                </InventoryProvider>
                <Toaster position="top-center" richColors closeButton />
              </AuthProvider>
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
  event.preventDefault(); // Prevent the default handling of the rejection
});

window.addEventListener('error', (event) => {
  console.error('Global error:', event.error);
  // You might want to prevent default if you're handling all errors centrally
  // event.preventDefault();
});

// Simple root render without complex initialization
const root = ReactDOM.createRoot(document.getElementById("root")!); 
root.render(<Root />);
