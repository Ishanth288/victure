
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

// Create a simplified query client with better error handling
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000,
      retryOnMount: false,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
    mutations: {
      retry: 1,
    },
  },
});

// Clear any form-related localStorage on app startup
console.log("🧹 Clearing any cached form data on app startup");
localStorage.removeItem('billingFormData');
localStorage.removeItem('patientFormData');
localStorage.removeItem('prescriptionFormData');

function Root() {
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

// Add global error handlers that don't cause infinite loops
window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
  // Only prevent default for specific error types to avoid blocking legitimate errors
  if (event.reason?.message?.includes('Network request failed') || 
      event.reason?.message?.includes('Failed to fetch')) {
    event.preventDefault();
  }
});

window.addEventListener('error', (event) => {
  console.error('Global error:', event.error);
  // Don't prevent default to allow normal error handling
});

// Simple root render without complex initialization
const root = ReactDOM.createRoot(document.getElementById("root")!); 
root.render(<Root />);
