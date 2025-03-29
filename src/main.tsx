
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { Toaster } from "@/components/ui/sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "@/components/theme-provider";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import * as Sentry from "@sentry/react";
import { initializeAppMonitoring } from "@/utils/supabaseHelpers";
import { BrowserRouter } from "react-router-dom";

// Initialize Sentry for error tracking
Sentry.init({
  dsn: "https://examplePublicKey@o0.ingest.sentry.io/0",
  integrations: [
    new Sentry.BrowserTracing(),
    new Sentry.Replay(),
  ],
  // Performance Monitoring
  tracesSampleRate: 1.0, // Capture 100% of the transactions
  // Session Replay
  replaysSessionSampleRate: 0.1, // Sample rate for all sessions
  replaysOnErrorSampleRate: 1.0, // Sample rate for sessions with errors
});

// Create a client with robust error handling
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3, // Increase retries for failed queries
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
      meta: {
        errorHandler: (error: any) => {
          console.error('Query error:', error);
          Sentry.captureException(error);
        }
      }
    },
    mutations: {
      meta: {
        errorHandler: (error: any) => {
          console.error('Mutation error:', error);
          Sentry.captureException(error);
        }
      }
    }
  },
});

// Initialize application monitoring
initializeAppMonitoring();

// Add a health check endpoint that can be used to verify the application is running
if (window.location.pathname === '/health') {
  document.body.innerHTML = 'OK';
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
        <QueryClientProvider client={queryClient}>
          <BrowserRouter>
            <App />
            <Toaster position="top-center" />
          </BrowserRouter>
        </QueryClientProvider>
      </ThemeProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
