
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { Toaster } from "@/components/ui/sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "@/components/theme-provider";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ConnectionErrorBoundary } from "@/components/ConnectionErrorBoundary";
import * as Sentry from "@sentry/react";
import { initializeAppMonitoring } from "@/utils/supabaseHelpers";
import { connectionManager } from "@/utils/connectionManager";
import { BrowserRouter } from "react-router-dom";
import { TooltipProvider } from "@/components/ui/tooltip";

// Initialize Sentry with reduced sampling rates to improve performance
Sentry.init({
  dsn: "https://examplePublicKey@o0.ingest.sentry.io/0",
  integrations: [
    new Sentry.BrowserTracing({
      tracingOrigins: ['localhost', 'victure-pharmease.app'],
    }),
    new Sentry.Replay({
      maskAllText: true, // Reduce payload size
      blockAllMedia: true, // Block media capturing to improve performance
    }),
  ],
  // Performance Monitoring - reduce sampling rate for better performance
  tracesSampleRate: 0.2, // Reduced from 1.0 to 0.2 (20% of transactions)
  replaysSessionSampleRate: 0.05, // Reduced from 0.1 to 0.05 (5% of sessions)
  replaysOnErrorSampleRate: 0.5, // Reduced from 1.0 to 0.5 (50% of error sessions)
  beforeSend(event) {
    // Filter out non-critical errors
    if (event.level === 'info' || event.level === 'warning') {
      return null;
    }
    return event;
  },
});

// Create a client with performance optimizations and connection retry
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3, // Increased retries for better resilience
      retryDelay: attemptIndex => Math.min(1000 * 1.5 ** attemptIndex, 10000), // Exponential backoff
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes garbage collection
      meta: {
        errorHandler: (error: any) => {
          console.error('Query error:', error);
          // Only report critical errors to Sentry
          if (error.status >= 500) {
            Sentry.captureException(error);
          }
        }
      }
    },
    mutations: {
      retry: 2, // Add retry for mutations
      retryDelay: attemptIndex => Math.min(1000 * 1.5 ** attemptIndex, 5000),
      meta: {
        errorHandler: (error: any) => {
          console.error('Mutation error:', error);
          // Only report critical errors to Sentry
          if (error.status >= 500) {
            Sentry.captureException(error);
          }
        }
      }
    }
  },
});

// Initialize application monitoring and connection management
initializeAppMonitoring();
connectionManager.initialize();

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
            <TooltipProvider>
              <BrowserRouter>
                <App />
                <Toaster position="top-center" richColors closeButton />
              </BrowserRouter>
            </TooltipProvider>
          </QueryClientProvider>
        </ThemeProvider>
      </ErrorBoundary>
    </ConnectionErrorBoundary>
  </React.StrictMode>
);
