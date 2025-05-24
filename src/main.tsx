
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { Toaster } from "@/components/ui/sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "@/components/theme-provider";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ConnectionErrorBoundary } from "@/components/ConnectionErrorBoundary";
import { BrowserRouter } from "react-router-dom";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";

// Create a client with performance optimizations
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      retryDelay: attemptIndex => Math.min(1000 * 1.5 ** attemptIndex, 10000),
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes garbage collection
    },
    mutations: {
      retry: 2,
      retryDelay: attemptIndex => Math.min(1000 * 1.5 ** attemptIndex, 5000),
    }
  },
});

// Health check endpoint
if (window.location.pathname === '/health') {
  document.body.innerHTML = 'OK';
}

// Use createRoot once to prevent multiple renders
const root = ReactDOM.createRoot(document.getElementById("root")!);
root.render(
  <React.StrictMode>
    <ConnectionErrorBoundary>
      <ErrorBoundary>
        <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
          <QueryClientProvider client={queryClient}>
            <AuthProvider>
              <TooltipProvider>
                <BrowserRouter>
                  <App />
                  <Toaster position="top-center" richColors closeButton />
                </BrowserRouter>
              </TooltipProvider>
            </AuthProvider>
          </QueryClientProvider>
        </ThemeProvider>
      </ErrorBoundary>
    </ConnectionErrorBoundary>
  </React.StrictMode>
);
